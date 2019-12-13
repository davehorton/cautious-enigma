const { query } = require('../../db/mysql');

module.exports = async(req, res) => {
  try {
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
    const sqlDelete = `
      DELETE FROM conferences
      WHERE id = ?
    `;
    await query(sqlDelete, req.params.id);
    res.send('Conference deleted');
  } catch (err) {
    console.error('ERROR ', new Date());
    console.error(err);
    res.sendStatus(500);
  }
};
