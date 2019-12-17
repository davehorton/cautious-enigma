//=============================================================================
// Setup
//=============================================================================
const config = require('config');
const express = require('express');
const app = express();
const logger = require('./utils/logger');
const cors = require('cors');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

//=============================================================================
// Routes
//=============================================================================
app.use('/api', require('./api'));

// Front end React client
app.get('*', (req, res) => res.redirect(`http://localhost:3000${req.originalUrl}`));

//=============================================================================
// Listen for requests
//=============================================================================
app.listen(config.get('port'), () => {
  console.log('#==========================================================');
  logger.info(`# API started on port ${config.get('port')}`);
  console.log('#==========================================================');
});

module.exports = app;
