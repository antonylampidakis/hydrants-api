const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Missing DATABASE_URL env var');
}

const pool = new Pool({
  connectionString,
  // ΣΗΜΑΝΤΙΚΟ: μην κάνεις verify του cert (Supabase pooler δίνει self-signed)
  ssl: { rejectUnauthorized: false }
});

module.exports = { pool };
