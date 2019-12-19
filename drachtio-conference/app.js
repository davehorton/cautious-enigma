const config = require('config');
const logger = require('../utils/logger');
const Srf = require('drachtio-srf');
const srf = new Srf();
const Mrf = require('drachtio-fsmrf');
const mrf = new Mrf(srf);
const { LoadBalancer } = require('drachtio-fn-fsmrf-sugar');
const api_end_transcription = require('./lib/api-end-transcription');
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
    logger.info(`selected freeswitch media server at ${this.mediaserver.address}`);
    this.mediaserver.locals = {};
    const conference_handler = new ConferenceHandler({ logger, mediaserver, req, res });
    try {
      conference_handler.exec();
      conference_handler
        .on('conference::empty', async(meeting_id) => {
          logger.info('last participant left conference');
          // update API end-transaction
          await api_end_transcription(meeting_id);
        });
    } catch (error) {
      logger.error(`ERROR: ${error}`);
      console.error(error);
    }
});
