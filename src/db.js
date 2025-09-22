const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL not set in environment');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

module.exports = { pool };
