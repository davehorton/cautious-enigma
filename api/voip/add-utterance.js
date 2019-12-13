const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    if (!req.body.speech) {
      res.status(400).send('Speech required');
      return;
    }

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

    // Get transcription ID
    const sqlGetTranscriptionId = `
      SELECT id
      FROM transcriptions
      WHERE conference_id = ?
      AND time_end IS NULL
    `;
    const transcriptionIdResults = await query(sqlGetTranscriptionId, conferenceId);
    if (!transcriptionIdResults.length) {
      res.status(404).send('No active transcription');
      return;
    }
    const transcriptionId = transcriptionIdResults[0].id;

    // Calculate sequence number
    let seq = 1;
    const sqlGetSeq = `
      SELECT seq
      FROM utterances
      WHERE transcription_id = ?
      ORDER BY seq DESC
      LIMIT 1
    `;
    const prevSeqResults = await query(sqlGetSeq, transcriptionId);
    if (prevSeqResults.length) {
      seq = prevSeqResults[0].seq + 1;
    }

    const sqlAddUtterance = `
      INSERT INTO utterances
        (seq, speech, start, duration, confidence, transcription_id)
      VALUES
        (?, ?, ?, ?, ?, ?)
    `;
    const sqlValuesAddUtterance = [
      seq,
      req.body.speech,
      req.body.start,
      req.body.duration,
      req.body.confidence,
      transcriptionId
    ];
    await query(sqlAddUtterance, sqlValuesAddUtterance);
    res.send('Utterance added successfully');

  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};