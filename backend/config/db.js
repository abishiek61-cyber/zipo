const mysql = require('mysql2/promise');
require('dotenv').config();
const pool = mysql.createPool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  waitForConnections: true, connectionLimit: 10
});
pool.getConnection().then(c => { console.log('  ✓ MySQL connected'); c.release(); }).catch(e => console.error('  ✗ MySQL:', e.message));
module.exports = pool;
