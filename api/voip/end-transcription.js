const mysql = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    // Get Conference ID
    const sqlGetConferenceId = `
      SELECT id
      FROM conferences
      WHERE meeting_pin = ?
    `;
    const [conferenceIdResults] = await mysql.query(sqlGetConferenceId, req.params.pin);
    if (!conferenceIdResults.length) {
      res.status(404).send('Conference doesn\'t exist');
      return;
    }
    const conferenceId = conferenceIdResults[0].id;

    // See if there are any active transcriptions
    const sqlFindActiveTranscriptions = `
      SELECT id
      FROM transcriptions
      WHERE conference_id = ?
      AND time_end IS NULL
    `;
    const activeTranscriptions = await mysql.query(sqlFindActiveTranscriptions, conferenceId);
    if (!activeTranscriptions.length) {
      res.status(404).send('No active transcription to end');
      return;
    }

    // End active transcription(s)
    const sqlEndTranscription = `
      UPDATE transcriptions
      SET time_end = ?
      WHERE conference_id = ?
      AND time_end IS NULL
    `;
    await mysql.query(sqlEndTranscription, [new Date(), conferenceId]);
    res.status(200).send('Transcription ended successfully');

  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};
