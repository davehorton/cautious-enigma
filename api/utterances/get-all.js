const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    const sqlCheckIfTransExists = `
      SELECT id
      FROM transcriptions
      WHERE id = ?
    `;
    const resultsCheckIfTransExists = await query(sqlCheckIfTransExists, req.params.id);
    if (!resultsCheckIfTransExists.length) {
      res.status(404).send('Transcription doesn\'t exist');
      return;
    }
    const sql = `
      SELECT
        seq,
        speech,
        start,
        duration,
        confidence
      FROM utterances
      WHERE transcription_id = ?
    `;
    const results = await query(sql, req.params.id);
    res.status(200).json(results);
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};
