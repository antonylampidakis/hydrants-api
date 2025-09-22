const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./src/db');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// DB test: απλή ερώτηση προς τη βάση
app.get('/dbtest', async (req, res) => {
  try {
    const r = await pool.query('select now() as now');
    res.json({ ok: true, now: r.rows[0].now });
  } catch (err) {
    console.error('DBTEST ERROR:', err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Όλοι οι κρουνοί (βασικό)
app.get('/hydrants', async (req, res) => {
  try {
    const q = `
      select id, code, name, address, status, municipality,
             ST_X(geom::geometry) as lon, ST_Y(geom::geometry) as lat,
             created_at
      from hydrants
      order by created_at desc
      limit 50;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (err) {
    console.error('HYDRANTS ERROR:', err);
    res.status(500).json({ error: 'server_error', detail: String(err.message || err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on port ${port}`));
