// Run once: node migrate.js
// Creates the license_keys and device_activations tables
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS license_keys (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      key_code    VARCHAR(24) NOT NULL UNIQUE,
      customer    VARCHAR(255) NOT NULL,
      max_devices INT NOT NULL DEFAULT 1,
      active      TINYINT(1) NOT NULL DEFAULT 1,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes       TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS device_activations (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      key_code     VARCHAR(24) NOT NULL,
      device_id    VARCHAR(64) NOT NULL,
      activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen    DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_device (key_code, device_id),
      FOREIGN KEY (key_code) REFERENCES license_keys(key_code) ON DELETE CASCADE
    )
  `);

  console.log('✅ Tables created successfully');
  await db.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });
