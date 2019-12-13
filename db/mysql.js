const util = require('util');
const mysql = require('mysql');
const config = require('config');
const pool = mysql.createPool(config.get('mysql'));

exports.query = util.promisify(pool.query).bind(pool);
