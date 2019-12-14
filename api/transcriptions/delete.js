const { query } = require('../../db/mysql');
const logger = require('../../utils/logger');

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
    res.status(200).send('Transcription deleted');
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};
