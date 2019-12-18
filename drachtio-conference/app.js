const config = require('config');
const logger = require('../utils/logger');
const Srf = require('drachtio-srf');
const srf = new Srf();
const Mrf = require('drachtio-fsmrf');
const mrf = new Mrf(srf);
const { LoadBalancer } = require('drachtio-fn-fsmrf-sugar');

srf.connect(config.get('drachtio'));
srf.on('connect', async(err, hp) => {
  if (err) throw err;
  console.log('#==========================================================');
  logger.info(`# Started drachtio listening on ${hp}`);
  console.log('#==========================================================');
  srf.local.hostport = hp;
  const lb = srf.locals.lb = new LoadBalancer();
  try {
    await lb.start({servers: config.get('freeswitch'), logger, mrf});
  } catch (error) {
    logger.error(error);
    console.error(error);
  }
});

srf.on('error', (err) => logger.error(err));


srf.invite(require('./drachtio-conference/lib/invite')({logger}));
