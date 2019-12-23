# cautious-enigma [![Build Status](https://secure.travis-ci.org/davehorton/cautious-enigma.png)](http://travis-ci.org/davehorton/cautious-enigma)

An audio conferencing application that integrates with [Deepgram](https://deepgram.com) to provide transcriptions of conference audio.  The application also records conference audio and includes a simple web GUI and REST provisioning api.

## Testing
To run the included test suite for the REST provisioning api, you will need to have a mysql server installed on your laptop/server. You will need to set the MYSQL_ROOT_PASSWORD env variable to the mysql root password before running the tests.  The test suite creates a database and user in your mysql server to run the tests against, and removes it when done.  The database, user, and password are specified in config/local-test.json.
```
MYSQL_ROOT_PASSWORD=foobar npm test
```