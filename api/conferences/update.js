const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    if (!req.body['meeting-pin']) {
      res.status(400).send('Meeting PIN required');
      return;
    }
    const sqlCheckIfConfExists = `
      SELECT id
      FROM conferences
      WHERE id = ?
    `;
    const resultsCheckIfConfExists = await query(sqlCheckIfConfExists, req.params.id);
    if (!resultsCheckIfConfExists.length) {
      res.status(404).send('Conference doesn\'t exist');
      return;
    }
    const sqlCheckIfPinInUse = `
      SELECT id
      FROM conferences
      WHERE meeting_pin = ?
    `;
    const resultsCheckIfPinInUse = await query(sqlCheckIfPinInUse, req.body['meeting-pin']);
    if (resultsCheckIfPinInUse.length) {
      res.status(409).send('A meeting with that PIN already exists');
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
