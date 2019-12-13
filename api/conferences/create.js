const { query } = require('../../db/mysql');

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
    res.sendStatus(201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).send('A meeting with that PIN already exists');
      return;
    }
    console.error('ERROR ', new Date());
    console.error(err);
    res.sendStatus(500);
  }
};
