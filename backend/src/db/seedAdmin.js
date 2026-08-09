require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('❌ ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  try {
    const existing = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing.rows.length > 0) {
      await pool.query('UPDATE admins SET password_hash = $1 WHERE username = $2', [passwordHash, username]);
      console.log(`✅ Updated password for existing admin "${username}".`);
    } else {
      await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', [username, passwordHash]);
      console.log(`✅ Created admin "${username}".`);
    }
  } catch (err) {
    console.error('❌ Failed to seed admin:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedAdmin();
