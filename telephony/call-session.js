const Emitter = require('events');
const config = require('config');
const moment = require('moment');
const execSync = require('child_process').execSync;
const {apiJoinConference, apiCloseConference} = require('./apis');

class CallSession extends Emitter {
  constructor(logger, req, res) {
    super();
    this.req = req;
    this.res = res;
    this.logger = logger;
    this.ms = req.locals.ms;
  }

  async exec() {
    try {
      await this._connectToMs();
      const createConference = await this._promptForMeetingId();
      if (createConference) {
        await this._createConference();
      }
      else {
        await this.ep.join(this.confPin);
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  async _connectToMs() {
    try {
      const {endpoint, dialog} = await this.ms.connectCaller(this.req, this.res);
      this.ep = endpoint;
      this.dlg = dialog;
      this.dlg.on('destroy', this._onHangup.bind(this));
    } catch (err) {
      this.logger.error(err, 'Error connecting to media server');
      this.res.send(480);
      throw err;
    }
  }

  async _promptForMeetingId() {
    for (let i = 0; i < 3; i++) {
      try {
        if (i > 0) await this.ep.play(config.get('prompts').error);
        const { digits } = await this.ep.playCollect({ file: config.get('prompts').welcome, min: 1, max: 15 });
        this.logger.debug(`collected meeting pin ${digits}`);
        const { meeting_pin, freeswitch_ip } = await apiJoinConference(this.logger, digits, this.ms.address);
        this.confPin = `conf-${meeting_pin}`;
        this.confMsAddress = freeswitch_ip;
        this.logger.debug(`meeting_pin ${this.confPin}, freeswitch_ip: ${freeswitch_ip}`);
        return this.confMsAddress === null ? true : false;
      } catch (err) {
        if (err.statusCode !== 404) {
          this.logger.error(err, 'Error collecting/validating pin');
          this._hangup();
          throw err;
        }
      }
    }
    this.logger.info('invalid pin, max retries');
    this._hangup();
    throw new Error('max retries');
  }

  async _createConference() {
    try {

      // create conference, join the caller to it and start recording
      this.logger.info(`creating conference ${this.confPin}`);
      this.conference = await this.ms.createConference(this.confPin);
      this.conference.on('delMember', async(evt) => {
        if (this._isConferenceEmpty(evt)) this._closeConference();
      });
      await this.ep.join(this.conference);
    }
    catch (err) {
      this.logger.error(err, 'Error creating conference');
      this._hangup(true);
      return;
    }

    try {
      // start recording the conference
      this.confRecordingPath =
        `/tmp/${this.confPin}-${moment().format()}.mp3`
          .replace(/\+/g, '-')
          .replace(/\:/g, '-');
      this.logger.info(`start recording to file: ${this.confRecordingPath}`);
      await this.conference.startRecording(this.confRecordingPath);

      // for streaming audio to deepgram, create another pair of endpoints -
      // one in in the conference providing a conference mix to the other which streams to dg
      this.wsConfEndpoint = await this.ms.createEndpoint();
      await this.wsConfEndpoint.join(this.confPin, {flags: {ghost: true, mute: true}});
      this.wsStreamEndpoint = await this.ms.createEndpoint();
      await this.wsConfEndpoint.modify(this.wsStreamEndpoint.local.sdp);
      await this.wsStreamEndpoint.modify(this.wsConfEndpoint.local.sdp);

      this.wsStreamEndpoint.addCustomEventListener('mod_audio_fork::connect', (event) => {
        this.logger.info('successfully connected to websocket server');
      });
      this.wsStreamEndpoint.addCustomEventListener('mod_audio_fork::connect_failed', (event) => {
        this.logger.error('received mod_audio_fork::connect_failed event');
        this.emit('conference::audio_fork_failed', this.confPin);
      });
      this.wsStreamEndpoint.addCustomEventListener('mod_audio_fork::json', async(event) => {
        if (event.is_final) {
          this.logger.info(event, 'received mod_audio_fork::json event');
          this.emit('conference::utterance', { meeting_pin: this.confPin, utterance: event});
        }
      });

      // fork conference audio between the two endpoints to the websocket server
      const url = config.get('deepgram-websocket-server.url');
      this.logger.info(`forking audio to websocket server at ${url}`);
      await this.wsStreamEndpoint.forkAudioStart({
        wsUrl: url,
        mixType: 'mono',
        sampling: '8000'
      });
    } catch (err) {
      this.logger.error(err, 'Error with streaming, continuing conference');
      if (this.wsConfEndpoint) this.wsConfEndpoint.destroy();
      if (this.wsStreamEndpoint) this.wsStreamEndpoint.destroy();
    }
  }

  _hangup(playError) {
    this.dlg.destroy();
    this.ep.destroy();
  }

  _onHangup() {
    this.ep.destroy();
  }

  _isConferenceEmpty(evt) {
    return parseInt(evt.getHeader('Conference-Size')) === 1;
  }

  async _closeConference() {
    const arr = /conf-(.*)/.exec(this.confPin);
    this.logger.info('destroying conference after last participant left');
    await apiCloseConference(this.logger, arr[1]);
    this.conference.destroy();
    if (this.wsConfEndpoint) this.wsConfEndpoint.destroy();
    if (this.wsStreamEndpoint) this.wsStreamEndpoint.destroy();
    execSync(`sudo chmod a+r ${this.confRecordingPath}`);
  }

}

module.exports = CallSession;
