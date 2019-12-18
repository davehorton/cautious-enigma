const assert = require('assert');
const config = require('config');
const parseUri = require('drachtio-srf').parseUri;
const request = require('request-promise');

module.exports = handler;

async function api_join_conference(meeting_pin) {
  try {
    assert.equal(typeof meetingPin, 'string', 'argument \'meetingPin\' must be provided to request_join_conference function');

    const api_server = config.get('api-server');
    const conference_api_uri = `${api_server.host}:${api_server.port}/voip/join-conference/${meeting_pin}`;

    const options = {
      method: 'POST',
      uri: conference_api_uri,
      body: {
        'freeswitch-ip': config.get('freeswitch').host
      },
      json: true
    };
    const response = await request(options);
    console.log(response);
    return response;
  } catch (error) {
    throw error;
  }
}

async function api_start_transaction() {
  // "voip/start-transcription/"
}

async function api_end_transaction() {
  // "voip/end-transcription/555"
  // OR
  // stick them in the database from here
}

async function createNewConference(req, ms, endpoint, conference_api_id, meeting_pin) {
  try {
    // 1. createConference
    const conference = await ms.createConference(meeting_pin);

    // add to media server object to getSize and update API on 0 participants
    ms.local.meeting_pin = conference;

    // 2. join endpoint to the conference
    await endpoint.join(conference);
    // 3. start recording
    await conference.startRecording(`${conference_api_id}-${meeting_pin}.wav`);

    // 4. connect mod_audio_fork to WebSocket server
    // create endpoint connected to the conference
    const wsConfEndpoint = await ms.createEndpoint();
    await wsConfEndpoint.join(meeting_pin);

    // create endpoint that bridges with the conference endpoint
    const wsStreamEndpoint = await ms.createEndpoint();
    await wsStreamEndpoint.bridge(wsConfEndpoint);

    // fork conference audio between the two endpoints to the websocket server
    const wsServer = config.get('deepgram-websocket-server');
    const url = `${wsServer.host}:${wsServer.port}`;
    const metaData = {meeting_id: meeting_pin, callid: req.get('Call-Id')};
    await wsStreamEndpoint.forkAudioStart({
      url,
      mixType: 'stereo',
      sampling: '16k',
      metaData
    });

    // TODO post request to /voip/start-transcription/
  } catch (error) {
    throw error;
  }
}

function handler({logger}) {
  return async(req, res) => {
    const srf = req.srf;
    const uri = parseUri(req.uri);
    logger.info(uri, `received ${req.method} from ${req.protocol}/${req.source_address}:${req.source_port}`);
    try {
      const mediaservers = srf.locals.lb.getLeastLoaded();
      const ms = mediaservers[0];
      logger.info(`selected freeswitch media server at ${ms.address}`);
      const {endpoint, dialog} = await ms.connectCaller(req, res);

      const { digits } = await endpoint.playCollect({ file: 'conf/conf-enter_conf_number.wav', min: 1, max: 15 });

      const { id, meeting_pin, statusCode, freeswitch_ip } = await api_join_conference(digits);

      if (statusCode == 404 || (statusCode == 201 && freeswitch_ip == null)) {
        await createNewConference(req, ms, endpoint, id, meeting_pin);
      }

      // conference on another freeswitch media server
      if (statusCode == 200 && !srf.local.hostport.includes(freeswitch_ip)) {
        // conference is already on a difference freeswitch than the one we connected the caller on.
        // 1. look through mediaservers array for matching host ip
        // 2. re-connect caller
        // 3. ??? do I need to re-invite or will ms.connectCaller do that automatically?
      }

      if (statusCode == 200) {
        try {
          await endpoint.join(meeting_pin);
        } catch (error) {
          logger.error(uri, `Received error joining conference: ${JSON.stringify(error)}`);
          logger.info(uri, 'Conference does not exist. Going to create a new conference and join it.');
          await createNewConference(req, ms, endpoint, id, meeting_pin);
          // TODO update database with new conference
        }
      }

      dialog.on('destroy', () => {
        if (ms.local.meetingId.getSize() == 0) {
          logger.info(uri, 'Last participant left the conference. Updating the API.');
          // update API end-transaction
        }
        endpoint.destroy();
      });
    } catch (err) {
      logger.error(err, '#handle - Error connecting to conference');
      throw err;
    }
  };
}
