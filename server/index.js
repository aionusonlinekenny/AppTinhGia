require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2/promise');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── MySQL connection pool ─────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               process.env.DB_PORT || 3306,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
});

function adminOnly(req, res, next) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// ── POST /api/validate ────────────────────────────────────────────
app.post('/api/validate', async (req, res) => {
  const { key, deviceId } = req.body;
  if (!key || !deviceId) {
    return res.status(400).json({ valid: false, message: 'Missing key or deviceId' });
  }

  const clean = key.trim().toUpperCase();
  const db = await pool.getConnection();
  try {
    // Look up key
    const [[entry]] = await db.execute(
      'SELECT * FROM license_keys WHERE key_code = ?', [clean]
    );
    if (!entry) return res.json({ valid: false, message: 'License key not found' });
    if (!entry.active) return res.json({ valid: false, message: 'License key has been deactivated' });

    // Check if device already activated
    const [[existing]] = await db.execute(
      'SELECT * FROM device_activations WHERE key_code = ? AND device_id = ?',
      [clean, deviceId]
    );

    if (existing) {
      // Known device — update last seen
      await db.execute(
        'UPDATE device_activations SET last_seen = NOW() WHERE key_code = ? AND device_id = ?',
        [clean, deviceId]
      );
      return res.json({ valid: true, message: 'License valid', customer: entry.customer });
    }

    // New device — check limit
    const [[{ count }]] = await db.execute(
      'SELECT COUNT(*) as count FROM device_activations WHERE key_code = ?', [clean]
    );
    if (count >= entry.max_devices) {
      return res.json({
        valid: false,
        message: `Key already used on ${entry.max_devices} device(s). Contact support to transfer.`,
      });
    }

    // Register new device
    await db.execute(
      'INSERT INTO device_activations (key_code, device_id) VALUES (?, ?)',
      [clean, deviceId]
    );
    console.log(`✅ Activated: ${clean} → ${deviceId} (${entry.customer})`);
    return res.json({ valid: true, message: 'License activated', customer: entry.customer });

  } finally {
    db.release();
  }
});

// ── GET /api/keys ─────────────────────────────────────────────────
app.get('/api/keys', adminOnly, async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT k.*, COUNT(d.id) as activated_count
    FROM license_keys k
    LEFT JOIN device_activations d ON k.key_code = d.key_code
    GROUP BY k.id ORDER BY k.created_at DESC
  `);
  res.json(rows);
});

// ── POST /api/keys — add new key ──────────────────────────────────
app.post('/api/keys', adminOnly, async (req, res) => {
  const { key, customer, maxDevices = 1, notes = '' } = req.body;
  if (!key || !customer) return res.status(400).json({ error: 'key and customer required' });
  const clean = key.trim().toUpperCase();
  try {
    await pool.execute(
      'INSERT INTO license_keys (key_code, customer, max_devices, notes) VALUES (?, ?, ?, ?)',
      [clean, customer, maxDevices, notes]
    );
    console.log(`➕ New key: ${clean} (${customer})`);
    res.json({ success: true, key: clean });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Key already exists' });
    throw e;
  }
});

// ── POST /api/keys/:key/deactivate ────────────────────────────────
app.post('/api/keys/:key/deactivate', adminOnly, async (req, res) => {
  const clean = req.params.key.trim().toUpperCase();
  await pool.execute('UPDATE license_keys SET active = 0 WHERE key_code = ?', [clean]);
  res.json({ success: true });
});

// ── POST /api/keys/:key/activate ─────────────────────────────────
app.post('/api/keys/:key/activate', adminOnly, async (req, res) => {
  const clean = req.params.key.trim().toUpperCase();
  await pool.execute('UPDATE license_keys SET active = 1 WHERE key_code = ?', [clean]);
  res.json({ success: true });
});

// ── POST /api/keys/:key/reset-devices ────────────────────────────
app.post('/api/keys/:key/reset-devices', adminOnly, async (req, res) => {
  const clean = req.params.key.trim().toUpperCase();
  await pool.execute('DELETE FROM device_activations WHERE key_code = ?', [clean]);
  console.log(`🔄 Reset devices: ${clean}`);
  res.json({ success: true });
});

// ── Health check ──────────────────────────────────────────────────
app.get('/health', async (_, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.listen(PORT, () => console.log(`🚀 License server on port ${PORT}`));
