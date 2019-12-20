const config = require('config');
const assert = require('assert');
const request = require('request-promise');
const api_server = config.get('api-server');

module.export = async(meeting_pin) => {
  // "voip/end-transcription/555"
  // OR
  // stick them in the database from here
  try {
    assert.equal(typeof meeting_pin, 'string', 'argument \'meeting_pin\' must be string');

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
};