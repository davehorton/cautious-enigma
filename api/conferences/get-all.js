const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

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
    logger.error(err);
    res.sendStatus(500);
  }
};
