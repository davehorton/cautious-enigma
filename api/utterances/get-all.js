const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
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
    res.status(200).send(results);
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};
