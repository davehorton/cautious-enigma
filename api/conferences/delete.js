const mysql = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    const sqlCheckIfExists = `
      SELECT id
      FROM conferences
      WHERE id = ?
    `;
    const [resultsCheckIfExists] = await mysql.query(sqlCheckIfExists, req.params.id);
    if (!resultsCheckIfExists.length) {
      res.status(404).send('Conference doesn\'t exist');
      return;
    }
    const sqlDelete = `
      DELETE FROM conferences
      WHERE id = ?
    `;
    await mysql.query(sqlDelete, req.params.id);
    res.status(200).send('Conference deleted');
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};
