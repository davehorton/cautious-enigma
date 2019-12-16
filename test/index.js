const config = require('config');
const test = require('tape');
const child_process = require('child_process');
const promisify = require('util').promisify;
const exec = promisify(child_process.exec);

const { host, user, password, database } = config.get('mysql');

//=============================================================================
// Create Database
//=============================================================================
test('Create Database', async(t) => {
  try {
    await exec(
      `mysql -h ${host} -u ${user} -p${password}\
        -e "DROP DATABASE IF EXISTS ${database}"`
    );
    await exec(
      `mysql -h ${host} -u ${user} -p${password}\
        -e "CREATE DATABASE ${database}"`
    );
    await exec(
      `mysql -h ${host} -u ${user} -p${password}\
        ${database} < ${__dirname}/../schema.sql`
    );
    t.pass('Database created successfully');
    t.end();
  } catch (err) {
    t.fail(err);
    t.end();
  }
});

//=============================================================================
// Conferences Tests
//=============================================================================
require('./conferences/create.js');
require('./conferences/get-all.js');
require('./conferences/get-one.js');
require('./conferences/update.js');
require('./conferences/delete.js');

//=============================================================================
// VoIP Tests
//=============================================================================
require('./voip/join-conference.js');
require('./voip/add-utterance.js');
require('./voip/end-transcription.js');

//=============================================================================
// Transcriptions Tests
//=============================================================================
require('./transcriptions/get-all.js');
require('./transcriptions/get-one.js');
require('./transcriptions/delete.js');

//=============================================================================
// Utterances Tests
//=============================================================================
require('./utterances/get-all.js');

//=============================================================================
// Drop Database
//=============================================================================
test('Drop Database', async(t) => {
  try {
    await exec(
      `mysql -h ${host} -u ${user} -p${password}\
        -e "DROP DATABASE ${database}"`
    );
    t.pass('Database dropped successfully');
    t.end();
  } catch (err) {
    t.fail(err);
    t.end();
  }
});
