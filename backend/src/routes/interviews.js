const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

const VALID_DOMAINS = ['DevOps', 'Corporate Communications', 'Creatives'];
const VALID_STATUSES = ['Scheduled', 'Completed', 'No-show'];

router.use(verifyToken);

router.post('/slots', requireRole('admin'), async (req, res) => {
  const { domain, panelist, startTime, endTime } = req.body;
  if (!VALID_DOMAINS.includes(domain)) return res.status(400).json({ error: 'Invalid domain.' });
  if (!startTime || !endTime) return res.status(400).json({ error: 'startTime and endTime are required.' });
  if (new Date(startTime) >= new Date(endTime)) return res.status(400).json({ error: 'startTime must be before endTime.' });

  try {
    const result = await pool.query(
      `INSERT INTO interview_slots (domain, panelist, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *`,
      [domain, panelist || null, startTime, endTime]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating slot.' });
  }
});

router.get('/slots', async (req, res) => {
  const { domain, onlyAvailable } = req.query;
  const conditions = [];
  const params = [];

  if (domain) {
    params.push(domain);
    conditions.push(`s.domain = $${params.length}`);
  }
  if (onlyAvailable === 'true') {
    conditions.push('b.id IS NULL');
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT s.*, b.id AS booking_id, b.inductee_id AS booked_by
       FROM interview_slots s
       LEFT JOIN interview_bookings b ON b.slot_id = s.id
       ${where}
       ORDER BY s.start_time ASC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching slots.' });
  }
});

router.post('/book', requireRole('inductee'), async (req, res) => {
  const { slotId } = req.body;
  if (!slotId) return res.status(400).json({ error: 'slotId is required.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingBooking = await client.query(
      'SELECT id FROM interview_bookings WHERE inductee_id = $1',
      [req.user.id]
    );
    if (existingBooking.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already have an interview booked. Cancel it before booking another.' });
    }

    const slotTaken = await client.query('SELECT id FROM interview_bookings WHERE slot_id = $1', [slotId]);
    if (slotTaken.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This slot has just been booked by someone else. Please pick another.' });
    }

    const slotResult = await client.query('SELECT * FROM interview_slots WHERE id = $1', [slotId]);
    if (!slotResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Slot not found.' });
    }

    const bookingResult = await client.query(
      `INSERT INTO interview_bookings (slot_id, inductee_id) VALUES ($1, $2) RETURNING *`,
      [slotId, req.user.id]
    );
    await client.query('COMMIT');

    const slot = slotResult.rows[0];
    const inducteeResult = await pool.query('SELECT name, email FROM inductees WHERE id = $1', [req.user.id]);
    const inductee = inducteeResult.rows[0];

    await sendEmail({
      to: inductee.email,
      subject: 'Interview Scheduled',
      text: `Hi ${inductee.name},\n\nYour interview is scheduled for ${new Date(slot.start_time).toLocaleString()} - ${new Date(slot.end_time).toLocaleString()}.\n\nWe'll send you a reminder ahead of time. Good luck!\n\n— Induction Team`,
    });

    res.status(201).json(bookingResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Booking conflict — slot or inductee already booked.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error booking interview.' });
  } finally {
    client.release();
  }
});

router.get('/my-booking', requireRole('inductee'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.status, s.domain, s.panelist, s.start_time, s.end_time
       FROM interview_bookings b JOIN interview_slots s ON s.id = b.slot_id
       WHERE b.inductee_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching your booking.' });
  }
});

router.delete('/my-booking', requireRole('inductee'), async (req, res) => {
  try {
    await pool.query('DELETE FROM interview_bookings WHERE inductee_id = $1', [req.user.id]);
    res.json({ message: 'Booking cancelled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error cancelling booking.' });
  }
});

router.get('/admin/bookings', requireRole('admin'), async (req, res) => {
  const { domain } = req.query;
  const params = [];
  let where = '';
  if (domain) {
    params.push(domain);
    where = `WHERE s.domain = $1`;
  }
  try {
    const result = await pool.query(
      `SELECT b.id AS booking_id, b.status, b.notes, b.rating, b.reminder_sent,
              s.domain, s.panelist, s.start_time, s.end_time,
              i.id AS inductee_id, i.name, i.roll_number, i.email
       FROM interview_bookings b
       JOIN interview_slots s ON s.id = b.slot_id
       JOIN inductees i ON i.id = b.inductee_id
       ${where}
       ORDER BY s.start_time ASC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching bookings.' });
  }
});

router.patch('/admin/bookings/:id', requireRole('admin'), async (req, res) => {
  const { status, notes, rating } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  const fields = [];
  const params = [];
  if (status !== undefined) { params.push(status); fields.push(`status = $${params.length}`); }
  if (notes !== undefined) { params.push(notes); fields.push(`notes = $${params.length}`); }
  if (rating !== undefined) { params.push(rating); fields.push(`rating = $${params.length}`); }

  if (!fields.length) return res.status(400).json({ error: 'Nothing to update.' });

  params.push(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE interview_bookings SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating booking.' });
  }
});

module.exports = router;
