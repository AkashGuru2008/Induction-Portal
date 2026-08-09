const express = require('express');
const { Parser } = require('json2csv');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();
router.use(verifyToken, requireRole('admin'));

const VALID_DOMAINS = ['DevOps', 'Corporate Communications', 'Creatives'];

// GET /api/admin/inductees?domain=&prefRank=1|2&status=&round=
// Module B - Basic: filterable list by domain and preference rank
router.get('/', async (req, res) => {
  const { domain, prefRank, status, round } = req.query;
  const conditions = [];
  const params = [];

  if (domain) {
    params.push(domain);
    if (prefRank === '1') {
      conditions.push(`pref1 = $${params.length}`);
    } else if (prefRank === '2') {
      conditions.push(`pref2 = $${params.length}`);
    } else {
      conditions.push(`(pref1 = $${params.length} OR pref2 = $${params.length})`);
    }
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (round) {
    params.push(round);
    conditions.push(`round = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT id, name, roll_number, email, phone, pref1, pref2, assigned_domain, round, status, created_at
       FROM inductees ${where} ORDER BY created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching inductees.' });
  }
});

// GET /api/admin/inductees/export/csv?domain=&prefRank=&status=&round=
// Module B - Brownie: export filtered list as CSV
router.get('/export/csv', async (req, res) => {
  const { domain, prefRank, status, round } = req.query;
  const conditions = [];
  const params = [];

  if (domain) {
    params.push(domain);
    if (prefRank === '1') conditions.push(`pref1 = $${params.length}`);
    else if (prefRank === '2') conditions.push(`pref2 = $${params.length}`);
    else conditions.push(`(pref1 = $${params.length} OR pref2 = $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (round) {
    params.push(round);
    conditions.push(`round = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT id, name, roll_number, email, phone, pref1, pref2, assigned_domain, round, status, created_at
       FROM inductees ${where} ORDER BY created_at DESC`,
      params
    );
    const parser = new Parser();
    const csv = parser.parse(result.rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('inductees_export.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error exporting CSV.' });
  }
});

// GET /api/admin/inductees/:id — full individual application (Module B - Basic)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inductees WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Inductee not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching inductee.' });
  }
});

// PATCH /api/admin/inductees/:id/assign-domain — Module C - Basic
router.patch('/:id/assign-domain', async (req, res) => {
  const { domain } = req.body;
  if (!domain || !VALID_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: 'A valid domain is required.' });
  }
  try {
    const result = await pool.query(
      `UPDATE inductees SET assigned_domain = $1 WHERE id = $2 RETURNING *`,
      [domain, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Inductee not found.' });

    const inductee = result.rows[0];
    await sendEmail({
      to: inductee.email,
      subject: 'Domain Assigned',
      text: `Hi ${inductee.name},\n\nYou have been assigned to the ${domain} domain. Log in to the portal to access your domain page, tasks, and Q&A board.\n\n— Induction Team`,
    });

    res.json(inductee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error assigning domain.' });
  }
});

module.exports = router;
