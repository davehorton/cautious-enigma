const mysql = require('../../db/mysql');
const logger = require('../../utils/logger');

module.exports = async(req, res) => {
  try {
    if (!req.body['freeswitch-ip']) {
      res.status(400).send('FreeSWITCH IP required');
      return;
    }

    const conn = await mysql.getConnection();
    try {
      await conn.beginTransaction();

      const sqlGetConferenceInfo = `
        SELECT
          id,
          date_created,
          meeting_pin,
          description,
          freeswitch_ip
        FROM conferences
        WHERE meeting_pin = ?
        FOR UPDATE
      `;
      const [conferenceInfo] = await conn.query(sqlGetConferenceInfo, req.params.pin);
      if (!conferenceInfo.length) {
        res.status(404).send('Conference doesn\'t exist');
        return;
      }
      const conferenceId = conferenceInfo[0].id;

      // If no freeswitch IP, conference is already in progress
      if (!conferenceInfo[0].freeswitch_ip) {
        // Set new freeswitch IP for conference
        const sqlUpdateConf = `
          UPDATE conferences
          SET freeswitch_ip = ?
          WHERE id = ?
        `;
        const sqlValuesUpdateConf = [
          req.body['freeswitch-ip'],
          conferenceId
        ];
        await conn.query(sqlUpdateConf, sqlValuesUpdateConf);

        // Close any active transcriptions
        const sqlCloseExistingTrans = `
          UPDATE transcriptions
          SET time_end = ?
          WHERE conference_id = ?
          AND time_end IS NULL
        `;
        await conn.query(sqlCloseExistingTrans, [new Date(), conferenceId]);

        // Start transcription
        const sqlStartTranscription = `
          INSERT INTO transcriptions
            (conference_id)
          VALUES
            (?)
        `;
        await conn.query(sqlStartTranscription, conferenceId);
      }

      await conn.commit();
      res.status(200).json(conferenceInfo);
      await conn.release();

    } catch (err) {
      await conn.rollback();
      await conn.release();
      throw err;
    }

  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
};
