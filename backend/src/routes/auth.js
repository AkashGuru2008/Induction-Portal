const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = signToken({ id: admin.id, username: admin.username, role: 'admin' });
    res.json({ token, username: admin.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/inductee-login
// Inductees authenticate with roll number + the email or phone they applied with.
router.post('/inductee-login', async (req, res) => {
  const { rollNumber, contact } = req.body;
  if (!rollNumber || !contact) {
    return res.status(400).json({ error: 'Roll number and contact (email or phone) are required.' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM inductees WHERE roll_number = $1 AND (email = $2 OR phone = $2)`,
      [rollNumber.trim(), contact.trim()]
    );
    const inductee = result.rows[0];
    if (!inductee) return res.status(401).json({ error: 'No matching application found. Check your roll number and contact details.' });

    const token = signToken({ id: inductee.id, role: 'inductee' });
    res.json({
      token,
      inductee: {
        id: inductee.id,
        name: inductee.name,
        rollNumber: inductee.roll_number,
        assignedDomain: inductee.assigned_domain,
        status: inductee.status,
        round: inductee.round,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;
