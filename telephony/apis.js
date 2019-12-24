const config = require('config');
const assert = require('assert');
const request = require('request-promise-native');
//require('request-debug')(request);

async function apiJoinConference(logger, meeting_pin, fs_address) {
  try {
    assert.equal(typeof meeting_pin, 'string', 'argument \'meeting_pin\' must be string');

    const conference_api_uri = `http://127.0.0.1:${config.get('port')}/api/voip/join-conference/${meeting_pin}`;

    const options = {
      method: 'POST',
      uri: conference_api_uri,
      body: {
        'freeswitch-ip': fs_address
      },
      json: true
    };
    const response = await request(options);
    logger.debug(response,
      `response from join-conference with meeting pin ${meeting_pin} and freeswitch ${fs_address}`);
    return response;
  } catch ({err, response}) {
    logger.error(err, `Error from join-conference: ${response.statusCode}`);
    throw {err, statusCode: response.statusCode};
  }
}

async function apiAddUtterance(logger, meeting_pin, evt) {
  try {
    assert.equal(typeof meeting_pin, 'string', 'argument \'meeting_pin\' must be string');

    const conference_api_uri = `http://127.0.0.1:${config.get('port')}/api/voip/add-utterance/${meeting_pin}`;

    const options = {
      method: 'POST',
      uri: conference_api_uri,
      body: {
        start: evt.start,
        duration: evt.duration,
        confidence: evt.channel.alternatives[0].confidence,
        speech: evt.channel.alternatives[0].transcript
      },
      json: true
    };
    const response = await request(options);
    logger.debug(response,
      `response from add-utterance with meeting pin ${meeting_pin}`);
    return response;
  } catch (err) {
    logger.error(err, 'Error from add-utterance');
  }
}

async function apiCloseConference(logger, meeting_pin) {
  try {
    assert.equal(typeof meeting_pin, 'string', 'argument \'meeting_pin\' must be string');

    const conference_api_uri = `http://127.0.0.1:${config.get('port')}/api/voip/end-transcription/${meeting_pin}`;

    const options = {
      method: 'PUT',
      uri: conference_api_uri
    };
    const response = await request(options);
    logger.debug(response,
      `response from end-transcription with meeting pin ${meeting_pin}`);
    return response;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  apiJoinConference,
  apiAddUtterance,
  apiCloseConference
};
