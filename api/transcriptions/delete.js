const { query } = require('../../db/mysql');

module.exports = async(req, res) => {
  try {
    const sqlCheckIfExists = `
      SELECT id
      FROM transcriptions
      WHERE id = ?
    `;
    const resultsCheckIfExists = await query(sqlCheckIfExists, req.params.id);
    if (!resultsCheckIfExists.length) {
      res.status(404).send('Transcription doesn\'t exist');
      return;
    }
    const sqlDelete = `
      DELETE FROM transcriptions
      WHERE id = ?
    `;
    await query(sqlDelete, req.params.id);
    res.send('transcription deleted');
  } catch (err) {
    console.error('ERROR ', new Date());
    console.error(err);
    res.sendStatus(500);
  }
};
