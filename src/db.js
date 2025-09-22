const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('Missing DATABASE_URL env var');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // κρατά το no-verify συμπεριφορά
});

module.exports = { pool };
