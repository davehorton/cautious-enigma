const { query } = require('../../db/mysql');

module.exports = async(req, res) => {
  try {
    const sql = `
      SELECT
        id,
        time_start,
        time_end
      FROM transcriptions
      WHERE conference_id = ?
    `;
    const results = await query(sql, req.params.id);
    res.send(results);
  } catch (err) {
    console.error('ERROR ', new Date());
    console.error(err);
    res.sendStatus(500);
  }
};
