const config = require('config');
const logger = require('../utils/logger');
const Srf = require('drachtio-srf');
const srf = new Srf();
const Mrf = require('drachtio-fsmrf');
const mrf = new Mrf(srf);
const { LoadBalancer } = require('drachtio-fn-fsmrf-sugar');
const api_end_transcription = require('./lib/api-end-transcription');
const api_add_utterance = require('./lib/api-add-utterance');
const ConferenceHandler = require('./lib/conference-handler');

srf.connect(config.get('drachtio'));
srf.on('connect', async(err, hp) => {
  if (err) throw err;
  console.log('#==========================================================');
  logger.info(`# Started drachtio listening on ${hp}`);
  console.log('#==========================================================');
  const lb = srf.locals.lb = new LoadBalancer();
  try {
    await lb.start({servers: config.get('freeswitch'), logger, mrf});
  } catch (error) {
    logger.error(error);
    console.error(error);
  }
});

srf.on('error', (err) => logger.error(err));

srf.invite(async(req, res) => {
    const mediaservers = srf.locals.lb.getLeastLoaded();
    const mediaserver = mediaservers[0];
    logger.info(`selected freeswitch media server at ${mediaserver.address}`);
    mediaserver.locals = {};
    const conference_handler = new ConferenceHandler({ logger, mediaserver, req, res });
    try {
      conference_handler.exec();
      conference_handler
        .on('conference::empty', (meeting_id) => {
          logger.info('last participant left conference');
          // update API end-transaction
          api_end_transcription(meeting_id);
        })
        .on('conference::utterance', (event) => {
          logger.info('received utterance. Sending to API.');
          const meeting_pin = event.meeting_pin;
          const utterance = event.utterance;
          api_add_utterance(meeting_pin, utterance);
        })
        .on('conference::audio_fork_failed', (meeting_pin) => {
          logger.info(`audio_fork failed in conference ${meeting_pin}`);
          // what to do here? 
          // Play audio to conference participants
          // Destroy conference
          // send email/alert
        });
    } catch (error) {
      logger.error(`ERROR: ${error}`);
      console.error(error);
    }
});
