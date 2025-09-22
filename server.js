const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./src/db');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// list hydrants
app.get('/hydrants', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM hydrants LIMIT 50;');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on port ${port}`));
