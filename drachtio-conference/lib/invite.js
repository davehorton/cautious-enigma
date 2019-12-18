const assert = require('assert');
const config = require('config');
const parseUri = require('drachtio-srf').parseUri;
const request = require('request-promise');
const api_server = config.get('api-server');

module.exports = handler;

async function create_new_fs_conference(req, ms, endpoint, meeting_pin) {
  try {
    // 1. createConference
    // TODO this is giving an error if I pass any parameters
    // but I am following the API:
    // https://davehorton.github.io/drachtio-fsmrf/api/MediaServer.html#createConference
    const conference = await ms.createConference();

    // add to media server object to getSize and update API on 0 participants
    ms.local.meeting_pin = conference;

    // 2. join endpoint to the conference
    await endpoint.join(conference);
    // 3. start recording
    const date = new Date();
    await conference.startRecording(`${__dirname}/recordings/${date.getFullYear()}${date.getMonth()}${date.getDate()}-${meeting_pin}.wav`);

    // 4. connect mod_audio_fork to WebSocket server
    // create endpoint connected to the conference
    const wsConfEndpoint = await ms.createEndpoint();
    await wsConfEndpoint.join(conference);

    // create endpoint that bridges with the conference endpoint
    const wsStreamEndpoint = await ms.createEndpoint();
    await wsStreamEndpoint.bridge(wsConfEndpoint);

    // fork conference audio between the two endpoints to the websocket server
    const wsServer = config.get('deepgram-websocket-server');
    const url = `${wsServer.host}:${wsServer.port}`;
    const metaData = {meeting_id: meeting_pin, callid: req.get('Call-Id')};
    await wsStreamEndpoint.forkAudioStart({
      wsUrl: url,
      mixType: 'stereo',
      sampling: '16k',
      metaData
    });

    // TODO post request to /voip/start-transcription/
  } catch (error) {
    throw error;
  }
}

async function api_join_conference(meeting_pin) {
  try {
    assert.equal(typeof meeting_pin, 'string', 'argument \'meeting_pin\' must be provided to request_join_conference function');

    const conference_api_uri = `${api_server.host}:${api_server.port}/api/voip/join-conference/${meeting_pin}`;

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

async function api_end_transcription(meeting_pin) {
  // "voip/end-transcription/555"
  // OR
  // stick them in the database from here
  try {
    assert.equal(typeof meeting_pin, 'string', 'argument \'meeting_pin\' must be provided to request_join_conference function');

    const conference_api_uri = `${api_server.host}:${api_server.port}/api/voip/end-transcription/${meeting_pin}`;

    const options = {
      method: 'PUT',
      uri: conference_api_uri
    };
    const response = await request(options);
    console.log(response);
    return response;
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
      ms.locals = {};
      logger.info(`selected freeswitch media server at ${ms.address}`);
      const { endpoint, dialog } = await ms.connectCaller(req, res);

      const { digits } = await endpoint.playCollect({ file: config.get('prompts').welcome, min: 1, max: 15 });

      const { id, meeting_pin, statusCode, freeswitch_ip } = await api_join_conference(digits);

      if (statusCode == 201 && freeswitch_ip == null) {
        await create_new_fs_conference(req, ms, endpoint, meeting_pin);
      }

      if (statusCode == 200) {
        try {
          const conference = ms.locals.meeting_pin;
          await endpoint.join(conference);
        } catch (error) {
          logger.error(uri, `Received error joining conference: ${JSON.stringify(error)}`);
          logger.info(uri, 'Conference does not exist. Going to create a new conference and join it.');
          await create_new_fs_conference(req, ms, endpoint, meeting_pin);
        }
      }

      dialog.on('destroy', () => {
        if (ms.locals.meeting_id.getSize() == 0) {
          logger.info(uri, 'Last participant left the conference. Updating the API.');
          const conference = ms.locals.meeting_id;
          conference.destroy();
          // update API end-transaction
          api_end_transcription(meeting_id);
        }
        endpoint.destroy();
      });
    } catch (err) {
      logger.error(err, '#handle - Error connecting to conference');
      // TODO need to be able to handle destroying
      // endpoint or dialog here
      throw err;
    }
  };
}
