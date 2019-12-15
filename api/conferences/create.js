const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    if (!req.body['meeting-pin']) {
      res.status(400).send('Meeting PIN required');
      return;
    }
    const sql = `
      INSERT INTO conferences (meeting_pin, description)
      VALUES (?, ?)
    `;
    const sqlValues = [
      req.body['meeting-pin'],
      req.body.description,
    ];
    await query(sql, sqlValues);
    const sqlGetConfId = `
      SELECT id
      FROM conferences
      WHERE meeting_pin = ?
    `;
    const conferenceId = await query(sqlGetConfId, req.body['meeting-pin']);
    res.status(201).json({ conferenceId: conferenceId[0].id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).send('A meeting with that PIN already exists');
      return;
    }
    logger.error(err);
    res.sendStatus(500);
  }
};
