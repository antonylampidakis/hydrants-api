const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./src/db');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// DB test
app.get('/dbtest', async (req, res) => {
  try {
    const r = await pool.query('select now() as now');
    res.json({ ok: true, now: r.rows[0].now });
  } catch (err) {
    console.error('DBTEST ERROR:', err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Όλοι οι κρουνοί
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

// Κοντινοί κρουνοί
app.get('/hydrants/near', async (req, res) => {
  try {
    const { lon, lat } = req.query;
    const radius = parseInt(req.query.radius || '1000', 10);
    if (lon === undefined || lat === undefined) {
      return res.status(400).json({ error: 'lon and lat are required' });
    }
    const q = `
      with p as (select ST_SetSRID(ST_MakePoint($1,$2),4326)::geography as c)
      select id, code, name, address, status, municipality,
             ST_X(geom::geometry) as lon, ST_Y(geom::geometry) as lat,
             ST_Distance(geom,(select c from p)) as meters_away
      from hydrants
      where ST_DWithin(geom,(select c from p), $3)
      order by meters_away asc
      limit 200;
    `;
    const { rows } = await pool.query(q, [Number(lon), Number(lat), radius]);
    res.json(rows);
  } catch (err) {
    console.error('NEAR ERROR:', err);
    res.status(500).json({ error: 'server_error', detail: String(err.message || err) });
  }
});

// BBox για χάρτη
app.get('/hydrants/bbox', async (req, res) => {
  try {
    const { minLon, minLat, maxLon, maxLat } = req.query;
    const nums = [minLon, minLat, maxLon, maxLat].map(Number);
    if (nums.some(n => Number.isNaN(n))) {
      return res.status(400).json({ error: 'minLon, minLat, maxLon, maxLat are required (numbers)' });
    }
    const q = `
      select id, code, name, address, status, municipality,
             ST_X(geom::geometry) as lon, ST_Y(geom::geometry) as lat,
             created_at
      from hydrants
      where ST_Intersects(
        geom::geometry,
        ST_MakeEnvelope($1,$2,$3,$4,4326)
      )
      limit 1000;
    `;
    const { rows } = await pool.query(q, nums);
    res.json(rows);
  } catch (err) {
    console.error('BBOX ERROR:', err);
    res.status(500).json({ error: 'server_error', detail: String(err.message || err) });
  }
});

// Insert νέου κρουνού
app.post('/hydrants', async (req, res) => {
  try {
    const { code, name, address, status = 'active', lon, lat, municipality } = req.body || {};
    if (lon === undefined || lat === undefined) {
      return res.status(400).json({ error: 'lon and lat are required' });
    }
    const q = `
      insert into hydrants (code, name, address, status, geom, municipality)
      values ($1,$2,$3,$4, ST_SetSRID(ST_MakePoint($5,$6),4326)::geography, $7)
      returning id;
    `;
    const { rows } = await pool.query(q, [
      code || null, name || null, address || null, status,
      Number(lon), Number(lat), municipality || null
    ]);
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    console.error('INSERT ERROR:', err);
    res.status(400).json({ error: 'bad_request', detail: String(err.message || err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on port ${port}`));
