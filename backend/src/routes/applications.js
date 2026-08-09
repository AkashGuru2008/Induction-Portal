const express = require('express');
const pool = require('../config/db');
const { sendEmail } = require('../utils/email');

const router = express.Router();

const VALID_DOMAINS = ['DevOps', 'Corporate Communications', 'Creatives'];

// POST /api/applications — public submission (Module A - Basic)
router.post('/', async (req, res) => {
  const { name, rollNumber, email, phone, pref1, pref2 } = req.body;

  // Basic validation
  const errors = [];
  if (!name || !name.trim()) errors.push('Name is required.');
  if (!rollNumber || !rollNumber.trim()) errors.push('Roll number is required.');
  if (!email || !email.trim()) errors.push('Email is required.');
  if (!phone || !phone.trim()) errors.push('Phone/contact is required.');
  if (!pref1 || !VALID_DOMAINS.includes(pref1)) errors.push('First domain preference is required and must be valid.');
  if (!pref2 || !VALID_DOMAINS.includes(pref2)) errors.push('Second domain preference is required and must be valid.');
  if (pref1 && pref2 && pref1 === pref2) errors.push('First and second domain preferences must be different.');

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const existing = await pool.query('SELECT id FROM inductees WHERE roll_number = $1', [rollNumber.trim()]);
    if (existing.rows.length) {
      return res.status(409).json({ errors: ['An application with this roll number already exists.'] });
    }

    const result = await pool.query(
      `INSERT INTO inductees (name, roll_number, email, phone, pref1, pref2)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name.trim(), rollNumber.trim(), email.trim(), phone.trim(), pref1, pref2]
    );
    const inductee = result.rows[0];

    // Confirmation email (Module A - Basic)
    await sendEmail({
      to: inductee.email,
      subject: 'Induction Application Received',
      text: `Hi ${inductee.name},\n\nYour induction application has been received.\n\nRoll number: ${inductee.roll_number}\nPreferences: 1) ${inductee.pref1}  2) ${inductee.pref2}\n\nYou can log in to the portal anytime using your roll number and the email/phone you applied with to check your status.\n\n— Induction Team`,
    });

    res.status(201).json({
      message: 'Application submitted successfully.',
      inductee: {
        id: inductee.id,
        name: inductee.name,
        rollNumber: inductee.roll_number,
        pref1: inductee.pref1,
        pref2: inductee.pref2,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while submitting application.' });
  }
});

module.exports = router;
