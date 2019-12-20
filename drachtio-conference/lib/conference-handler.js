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

    this.create_new_fs_conference = (endpoint, meeting_pin) => {
      return new Promise(async(resolve, reject) => {
        try {
          // 1. createConference
          // TODO this is giving an error if I pass any parameters
          // but I am following the API:
          // https://davehorton.github.io/drachtio-fsmrf/api/MediaServer.html#createConference
          this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - Creating conference for ${meeting_pin}`);
          const conference = await this.mediaserver.createConference(meeting_pin);
      
          // add to media server object to getSize and update API on 0 participants
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - Saving conference object to mediaserver.locals object');
          this.mediaserver.locals.meeting_pin = conference;
      
          // 2. join endpoint to the conference
          await endpoint.join(meeting_pin);
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - connected endpoint to conference');
          // 3. start recording
          const date = new Date();
          const confRecordingPath = `${__dirname}/recordings/${date.getFullYear()}${date.getMonth()}${date.getDate()}-${meeting_pin}.wav`;
          this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - start recording to file: ${confRecordingPath}`);
          await conference.startRecording(confRecordingPath);
      
          // 4. connect mod_audio_fork to WebSocket server
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

          wsStreamEndpoint.addCustomEventListener('mod_audio_fork::connect', (event) => { 
            this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - successfully connected to websocket server`);
            this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - ${JSON.stringify(event)}`); 
          });

          wsStreamEndpoint.addCustomEventListener('mod_audio_fork::transcription', async(event) => {
            this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - received mod_audio_fork::transcription event`);
            this.emit('conference::utterance', { meeting_pin: meeting_pin, utterance: event.data });
          });

          // failure
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

          resolve(wsStreamEndpoint);
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
    this.logger.info(uri, `received ${this.req.method} from ${this.req.protocol}/${this.req.source_address}:${this.req.source_port}`);
    try {
      const callerObject = await this.mediaserver.connectCaller(this.req, this.res);

      dialog = callerObject.dialog;
      endpoint = callerObject.endpoint;

      const { digits } = await endpoint.playCollect({ file: config.get('prompts').welcome, min: 1, max: 15 });

      const { meeting_pin, freeswitch_ip } = await api_join_conference(digits, this.mediaserver.address);

      if (freeswitch_ip === null) {
        await this.create_new_fs_conference(endpoint, meeting_pin.toString());
      } else {
        try {
          await endpoint.join(meeting_pin.toString());
        } catch (error) {
          this.logger.error(uri, `Received error joining conference: ${JSON.stringify(error)}`);
          this.logger.info(uri, 'Conference does not exist. Going to create a new conference and join it.');
          await this.create_new_fs_conference(endpoint, meeting_pin.toString());
        }
      }

      dialog.on('destroy', async() => {
        this.logger.info('Caller hung up. Checking conference size');
        const confSize = await this.mediaserver.locals.meeting_pin.getSize();
        this.logger.info(`conference size is: ${confSize}`);
        if (confSize === 0) {
          this.logger.info(uri, 'Last participant left the conference. Updating the API.');
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
