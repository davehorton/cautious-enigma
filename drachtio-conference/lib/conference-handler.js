const Emitter = require('events');
const config = require('config');
const parseUri = require('drachtio-srf').parseUri;
const api_join_conference = require('./api-join-conference');

class ConferenceHandler extends Emitter {
  constructor(opts) {
    super();
    this.logger = opts.logger;
    this.srf = opts.req.srf;
    this.req = opts.req;
    this.res = opts.res;
    this.mediaserver = opts.mediaserver;

    this.join_fs_conference = (conference, endpoint, meeting_pin) => {
      return new Promise(async(resolve, reject) => {
        try {      
          // join endpoint to the conference
          await endpoint.join(meeting_pin);
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - connected endpoint to conference');
          
          // start recording
          const date = new Date();
          const confRecordingPath = `${__dirname}/recordings/${date.getFullYear()}${date.getMonth()}${date.getDate()}-${meeting_pin}.wav`;
          this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - start recording to file: ${confRecordingPath}`);
          await conference.startRecording(confRecordingPath);
      
          // connect mod_audio_fork to WebSocket server

          // create endpoint connected to the conference
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - creating conference endpoint for WS server');
          const wsConfEndpoint = await this.mediaserver.createEndpoint();
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - connecting WS endpoint to conference');
          await wsConfEndpoint.join(meeting_pin);
      
          // create endpoint that bridges with the conference endpoint
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - creating streaming endpoint for WS server');
          const wsStreamEndpoint = await this.mediaserver.createEndpoint();
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - bridge streaming endpoint with conference endpoint');
          await wsStreamEndpoint.bridge(wsConfEndpoint);

          // setup event listeners
          wsStreamEndpoint.addCustomEventListener('mod_audio_fork::connect', (event) => { 
            this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - successfully connected to websocket server`);
            this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - ${JSON.stringify(event)}`); 
          });

          wsStreamEndpoint.addCustomEventListener('mod_audio_fork::transcription', async(event) => {
            this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - received mod_audio_fork::transcription event`);
            this.emit('conference::utterance', { meeting_pin: meeting_pin, utterance: event.data });
          });

          wsStreamEndpoint.addCustomEventListener('mod_audio_fork::connect_failed', (event) => {
            this.logger.error('#ConferenceHandler: this.create_new_fs_conference() - received mod_audio_fork::connect_failed event');
            this.logger.error(`#ConferenceHandler: this.create_new_fs_conference() - ${JSON.stringify(event)}`);
            this.emit('conference::audio_fork_failed', meeting_pin);
          });

          // fork conference audio between the two endpoints to the websocket server
          const wsServer = config.get('deepgram-websocket-server');
          const url = `${wsServer.host}:${wsServer.port}`;
          const metaData = {meeting_id: meeting_pin, callid: this.req.get('Call-Id')};
          this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - forking audio to websocket server at ${url}`);
          await wsStreamEndpoint.forkAudioStart({
            wsUrl: url,
            mixType: 'stereo',
            sampling: '16k',
            metaData
          });

          resolve({wsConfEndpoint, wsStreamEndpoint});
        } catch (error) {
          reject(error);
        }
      });
    };
  }

  async exec() {
    const uri = parseUri(this.req.uri);
    let dialog;
    let endpoint;
    this.logger.info(uri, `#ConferenceHandler.exec() - received ${this.req.method} from ${this.req.protocol}/${this.req.source_address}:${this.req.source_port}`);
    try {
      const callerObject = await this.mediaserver.connectCaller(this.req, this.res);

      dialog = callerObject.dialog;
      endpoint = callerObject.endpoint;

      const { digits } = await endpoint.playCollect({ file: config.get('prompts').welcome, min: 1, max: 15 });

      const { meeting_pin, freeswitch_ip } = await api_join_conference(digits, this.mediaserver.address);

      if (freeswitch_ip !== null) {
        this.logger.info(`freeswitch_ip for conference ${meeting_pin} is ${freeswitch_ip}`);
        // should check if it is the freeswitch that the endpoint is connected on
      }

      this.logger.info(uri, `#ConferenceHandler.exec() - Check for conference.`);
      try {
        const conference = await this.mediaserver.createConference(meeting_pin);
        console.log(conference);
        // add to media server object to getSize and update API on 0 participants
        this.logger.info(uri, '#ConferenceHandler.exec() - Saving conference object to mediaserver.locals object');
        this.mediaserver.locals.meeting_pin.conference = conference;
        const {wsConfEndpoint, wsEndpoint} = await this.join_fs_conference(conference, endpoint, meeting_pin.toString());
        
        // add wsEndpoint to mediaserver conference object to destroy when conference ends
        this.mediaserver.locals.meeting_pin.websocketEndpoints = [ wsConfEndpoint, wsEndpoint ];

        console.log('now mediaserver.locals object should have this conference objects stored for later');
        console.log(this.mediaserver.locals.meeting_pin);
      } catch (error) {
        if (error === 'conference exists') {
          this.logger.info(uri, `#exec: conference exists, we just need to join it`);
          await endpoint.join(meeting_pin);
          if (this.mediaserver.locals.meeting_pin) {
            console.log('ok, we still have the conference object for later use when everyone hangsup');
          } else {
            console.log(`PROBLEM: this.mediaserver.locals.meeting_pin for ${meeting_pin} is undefined.`);
            console.log('this will cause problems trying to check conference size when people hangup.');
          }
        }
      }

      dialog.on('destroy', async() => {
        this.logger.info('Caller hung up. Checking conference size');
        const confSize = await this.mediaserver.locals.meeting_pin.conference.getSize();
        this.logger.info(`conference size is: ${confSize}`);
        if (confSize === 0) { // could be 1 still for websocket endpoint
          this.logger.info(uri, 'Last participant left the conference. Updating the API.');

          // destroy websocket endpoints
          if (this.mediaserver.locals.meeting_pin.websocketEndpoints) {
            this.logger.info(uri, `Destroying websocket Endpoints for ${meeting_pin}`);
            this.mediaserver.locals.websocketEndpoints[0].destroy();
            this.mediaserver.locals.websocketEndpoints[1].destroy();
          }

          // destroy endpoint
          const conference = this.mediaserver.locals.meeting_pin;
          conference.destroy();
          this.emit('conference::empty', meeting_pin);
        }

        endpoint.destroy();
      });
    } catch (error) {
      this.logger.error(error, '#handle - Error connecting to conference');
      // TODO need to be able to handle destroying
      // endpoint or dialog here
      await endpoint.play(`${config.get('prompts').error}`);
      await endpoint.play(`${config.get('prompts').goodbye}`);
      dialog.destroy();
      this.emit('error', error);
    }
  }
} 

module.exports = ConferenceHandler;
