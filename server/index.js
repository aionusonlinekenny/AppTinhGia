const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const PORT     = process.env.PORT || 3000;
const KEYS_FILE = path.join(__dirname, 'keys.json');

app.use(cors());
app.use(express.json());

function loadKeys() {
  return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
}

function saveKeys(data) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}

// ── POST /api/validate ────────────────────────────────────────────
// Body: { key: string, deviceId: string }
// Response: { valid: bool, message: string }
app.post('/api/validate', (req, res) => {
  const { key, deviceId } = req.body;

  if (!key || !deviceId) {
    return res.status(400).json({ valid: false, message: 'Missing key or deviceId' });
  }

  const keys = loadKeys();
  const entry = keys[key.trim().toUpperCase()];

  if (!entry) {
    return res.json({ valid: false, message: 'License key not found' });
  }

  if (!entry.active) {
    return res.json({ valid: false, message: 'License key has been deactivated' });
  }

  // Check if this device is already registered
  const devices = entry.activatedDevices || [];
  if (devices.includes(deviceId)) {
    // Same device re-validating → always OK
    return res.json({ valid: true, message: 'License valid', customer: entry.customer });
  }

  // New device — check max device limit
  if (devices.length >= entry.maxDevices) {
    return res.json({
      valid: false,
      message: `This key is already activated on ${entry.maxDevices} device(s). Contact support to transfer.`,
    });
  }

  // Register this device
  entry.activatedDevices = [...devices, deviceId];
  entry.lastActivated = new Date().toISOString();
  keys[key.trim().toUpperCase()] = entry;
  saveKeys(keys);

  console.log(`✅ Activated: ${key} → device ${deviceId} (${entry.customer})`);
  return res.json({ valid: true, message: 'License activated successfully', customer: entry.customer });
});

// ── GET /api/keys — list all keys (for your admin use) ────────────
// Protect this with a simple secret header in production
app.get('/api/keys', (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(loadKeys());
});

// ── POST /api/keys — add a new license key ────────────────────────
app.post('/api/keys', (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { key, customer, maxDevices = 1 } = req.body;
  if (!key || !customer) return res.status(400).json({ error: 'key and customer required' });

  const keys = loadKeys();
  const clean = key.trim().toUpperCase();
  if (keys[clean]) return res.status(409).json({ error: 'Key already exists' });

  keys[clean] = { customer, maxDevices, active: true, activatedDevices: [], createdAt: new Date().toISOString() };
  saveKeys(keys);
  console.log(`➕ New key added: ${clean} (${customer})`);
  res.json({ success: true, key: clean });
});

// ── POST /api/keys/:key/deactivate — revoke a key ─────────────────
app.post('/api/keys/:key/deactivate', (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const keys = loadKeys();
  const clean = req.params.key.trim().toUpperCase();
  if (!keys[clean]) return res.status(404).json({ error: 'Key not found' });
  keys[clean].active = false;
  saveKeys(keys);
  res.json({ success: true });
});

// ── POST /api/keys/:key/reset-devices — allow re-activation ───────
app.post('/api/keys/:key/reset-devices', (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const keys = loadKeys();
  const clean = req.params.key.trim().toUpperCase();
  if (!keys[clean]) return res.status(404).json({ error: 'Key not found' });
  keys[clean].activatedDevices = [];
  saveKeys(keys);
  console.log(`🔄 Reset devices for: ${clean}`);
  res.json({ success: true });
});

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 License server running on port ${PORT}`);
  console.log(`   Set ADMIN_SECRET env var to protect admin endpoints`);
});
