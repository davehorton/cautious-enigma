const { query } = require('../../db/mysql');

module.exports = async(req, res) => {
  try {
    const sql = `
      SELECT
        id,
        meeting_pin,
        description
      FROM conferences
    `;
    const results = await query(sql);
    res.send(results);
  } catch (err) {
    console.error('ERROR ', new Date());
    console.error(err);
    res.sendStatus(500);
  }
};
