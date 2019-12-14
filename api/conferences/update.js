const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    if (!req.body['meeting-pin']) {
      res.status(400).send('Meeting PIN required');
      return;
    }
    const sqlCheckIfExists = `
      SELECT id
      FROM conferences
      WHERE id = ?
    `;
    const resultsCheckIfExists = await query(sqlCheckIfExists, req.params.id);
    if (!resultsCheckIfExists.length) {
      res.status(404).send('Conference doesn\'t exist');
      return;
    }
    const sqlUpdate = `
      UPDATE conferences
      SET
        meeting_pin = ?,
        description = ?
      WHERE id = ?
    `;
    const sqlUpdateValues = [
      req.body['meeting-pin'],
      req.body.description,
      req.params.id,
    ];
    await query(sqlUpdate, sqlUpdateValues);
    res.status(200).send('Conference updated');
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};
