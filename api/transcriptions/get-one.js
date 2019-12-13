const { query } = require('../../db/mysql');

module.exports = async(req, res) => {
  try {
    const sql = `
      SELECT
        id,
        time_start,
        time_end
      FROM transcriptions
      WHERE id = ?
    `;
    const results = await query(sql, req.params.id);
    if (!results.length) {
      res.status(404).send('Transcription doesn\'t exist');
      return;
    }
    res.send(results);
  } catch (err) {
    console.error('ERROR ', new Date());
    console.error(err);
    res.sendStatus(500);
  }
};
