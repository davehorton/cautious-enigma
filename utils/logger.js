const config = require('config');
const pino = require('pino')

module.exports = pino({
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  ...config.get('logging'),
});
