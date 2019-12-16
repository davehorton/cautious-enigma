const util = require('util');
const mysql = require('mysql2/promise');
const config = require('config');
const pool = mysql.createPool(config.get('mysql'));

module.exports = pool;
