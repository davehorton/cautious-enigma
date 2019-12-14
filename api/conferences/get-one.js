const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    const sql = `
      SELECT
        id,
        date_created,
        meeting_pin,
        description
      FROM conferences
      WHERE id = ?
    `;
    const results = await query(sql, req.params.id);
    if (!results.length) {
      res.status(404).send('Conference doesn\'t exist');
      return;
    }
    res.status(200).send(results[0]);
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};
