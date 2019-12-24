const config = require('config');
const express = require('express');
const app = express();
const logger = require('./utils/logger');
const cors = require('cors');
const path = require('path');
const Srf = require('drachtio-srf');
const {getMS} = require('./telephony/middleware')(logger);
const CallSession = require('./telephony/call-session');
let srf;
if (process.env.NODE_ENV !== 'test') {
  srf = new Srf();
  const { LoadBalancer } = require('drachtio-fn-fsmrf-sugar');
  srf.locals.lb = new LoadBalancer();
}

//=============================================================================
// Telephony stuff
//=============================================================================
if (process.env.NODE_ENV !== 'test') {
  srf.connect(config.get('drachtio'));
  srf
    .on('connect', async(err, hp) => {
      if (err) { throw err; }
      logger.info(`Started drachtio listening on ${hp}`);
      try {
        await srf.locals.lb.start({servers: config.get('freeswitch'), logger, srf});
      } catch (error) {
        logger.error(error);
      }
    })
    .on('error', (err) => logger.error(err, 'Error connecting to drachtio'));

  srf.invite(getMS, (req, res) => {
    const callSession = new CallSession(logger, req, res);
    callSession.exec();
  });
}


//=============================================================================
// Web stuff
//=============================================================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.static(path.join(__dirname, 'client', 'build')));

//=============================================================================
// Routes
//=============================================================================
app.use('/api', require('./api'));

// Front end React client
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  // res.redirect(`http://localhost:3000${req.originalUrl}`
});

//=============================================================================
// Listen for requests
//=============================================================================
app.listen(config.get('port'), () => {
  logger.info(`# API started on port ${config.get('port')}`);
});

module.exports = app;
