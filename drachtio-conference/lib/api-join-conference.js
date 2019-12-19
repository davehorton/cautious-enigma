const config = require('config');
const assert = require('assert');
const request = require('request-promise');
const api_server = config.get('api-server');

module.exports = async(meeting_pin, fs_address) => {
  try {
    assert.equal(typeof meeting_pin, 'string', 'argument \'meeting_pin\' must be provided to request_join_conference function');

    const conference_api_uri = `${api_server.host}:${api_server.port}/api/voip/join-conference/${meeting_pin}`;

    const options = {
      method: 'POST',
      uri: conference_api_uri,
      body: {
        'freeswitch-ip': fs_address
      },
      json: true
    };
    const response = await request(options);
    console.log(response);
    return response;
  } catch (error) {
    throw error;
  }
};
