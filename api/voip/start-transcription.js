const { query } = require('../../db/mysql');

module.exports = async(req, res) => {
  try {
    // Get Conference ID
    const sqlGetConferenceId = `
      SELECT id
      FROM conferences
      WHERE meeting_pin = ?
    `;
    const conferenceIdResults = await query(sqlGetConferenceId, req.params.pin);
    if (!conferenceIdResults.length) {
      res.status(404).send('Conference doesn\'t exist');
      return;
    }
    const conferenceId = conferenceIdResults[0].id;

    // Close any active transcriptions
    const sqlCloseExistingTrans = `
      UPDATE transcriptions
      SET time_end = ?
      WHERE conference_id = ?
      AND time_end IS NULL
    `;
    await query(sqlCloseExistingTrans, [new Date(), conferenceId]);

    // Start transcription
    const sqlStartTranscription = `
      INSERT INTO transcriptions
        (conference_id)
      VALUES
        (?)
    `;
    await query(sqlStartTranscription, conferenceId);
    res.status(201).send('Transcription started successfully');

  } catch (err) {
    console.error('ERROR ', new Date());
    console.error(err);
    res.sendStatus(500);
  }
};
