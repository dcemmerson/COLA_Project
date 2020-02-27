require('dotenv').config();
var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : 'Subwaysurf96!',
  database        : 'cola'
});

module.exports.pool = pool;