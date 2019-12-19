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
      return async() => {
        try {
          // 1. createConference
          // TODO this is giving an error if I pass any parameters
          // but I am following the API:
          // https://davehorton.github.io/drachtio-fsmrf/api/MediaServer.html#createConference
          this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - Creating conference for ${meeting_pin}`);
          const conference = await this.mediaserver.createConference();
      
          // add to media server object to getSize and update API on 0 participants
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - Saving conference object to mediaserver.locals object');
          this.mediaserver.locals.meeting_pin = conference;
      
          // 2. join endpoint to the conference
          await endpoint.join(conference);
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - connected endpoint to conference')
          // 3. start recording
          const date = new Date();
          const confRecordingDir = `${__dirname}/recordings/${date.getFullYear()}${date.getMonth()}${date.getDate()}-${meeting_pin}.wav`;
          this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - start recording to file: ${confRecordingDir}`)
          await conference.startRecording();
      
          // 4. connect mod_audio_fork to WebSocket server
          // create endpoint connected to the conference
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - creating conference endpoint for WS server');
          const wsConfEndpoint = await this.mediaserver.createEndpoint();
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - connecting WS endpoint to conference');
          await wsConfEndpoint.join(conference);
      
          // create endpoint that bridges with the conference endpoint
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - creating streaming endpoint for WS server')
          const wsStreamEndpoint = await this.mediaserver.createEndpoint();
          this.logger.info('#ConferenceHandler: this.create_new_fs_conference() - bridge streaming endpoint with conference endpoint')
          await wsStreamEndpoint.bridge(wsConfEndpoint);
      
          // fork conference audio between the two endpoints to the websocket server
          const wsServer = config.get('deepgram-websocket-server');
          const url = `${wsServer.host}:${wsServer.port}`;
          const metaData = {meeting_id: meeting_pin, callid: req.get('Call-Id')};
          this.logger.info(`#ConferenceHandler: this.create_new_fs_conference() - forking audio to websocket server at ${url}`);
          await wsStreamEndpoint.forkAudioStart({
            wsUrl: url,
            mixType: 'stereo',
            sampling: '16k',
            metaData
          });
        } catch (error) {
          throw error;
        }
      };
    };
  }

  async exec() {
    const uri = parseUri(this.req.uri);
    this.logger.info(uri, `received ${this.req.method} from ${this.req.protocol}/${this.req.source_address}:${this.req.source_port}`);
    try {
      const { endpoint, dialog } = await this.mediaserver.connectCaller(this.req, this.res);

      const { digits } = await endpoint.playCollect({ file: config.get('prompts').welcome, min: 1, max: 15 });

      const { id, meeting_pin, statusCode, freeswitch_ip } = await api_join_conference(digits, this.mediaserver.address);

      if (statusCode === 201 && freeswitch_ip === null) {
        this.create_new_fs_conference(endpoint, meeting_pin);
      } else if (statusCode === 200) {
        try {
          const conference = this.mediaserver.locals.meeting_pin;
          await endpoint.join(conference);
        } catch (error) {
          this.logger.error(uri, `Received error joining conference: ${JSON.stringify(error)}`);
          this.logger.info(uri, 'Conference does not exist. Going to create a new conference and join it.');
          this.create_new_fs_conference(endpoint, meeting_pin);
        }
      }

      dialog.on('destroy', () => {
        this.logger.info('Caller hung up. Checking conference size');
        const confSize = this.mediaserver.locals.meeting_pin.getSize();
        this.logger.info(`conference size it: ${confSize}`);
        if (confSize === 0) {
          this.logger.info(uri, 'Last participant left the conference. Updating the API.');
          const conference = this.mediaserver.locals.meeting_pin;
          conference.destroy();
          this.emit('conference::empty', meeting_pin);
        }
        endpoint.destroy();
      });
    } catch (err) {
      this.logger.error(err, '#handle - Error connecting to conference');
      // TODO need to be able to handle destroying
      // endpoint or dialog here
      throw err;
    }
  }
} 

module.exports = ConferenceHandler;
