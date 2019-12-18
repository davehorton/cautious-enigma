//=============================================================================
// Setup
//=============================================================================
const config = require('config');
const express = require('express');
const app = express();
const logger = require('./utils/logger');
const Srf = require('drachtio-srf');
const srf = new Srf();
const Mrf = require('drachtio-fsmrf');
const mrf = new Mrf(srf);
const { LoadBalancer } = require('drachtio-fn-fsmrf-sugar');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//=============================================================================
// Routes
//=============================================================================
app.use('/api', require('./api'));

//=============================================================================
// Listen for requests
//=============================================================================
app.listen(config.get('port'), () => {
  console.log('#==========================================================');
  logger.info(`# API started on port ${config.get('port')}`);
  console.log('#==========================================================');

  // start telephony service
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


  srf.invite(require('./drachtio-conference/invite')({logger}));
});
