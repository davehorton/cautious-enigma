const { query } = require('../../db/mysql');

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
    res.send(results);
  } catch (err) {
    console.error('ERROR ', new Date());
    console.error(err);
    res.sendStatus(500);
  }
};
