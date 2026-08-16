const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();
router.use(verifyToken, requireRole('admin'));

router.post('/advance', async (req, res) => {
  const { advanceIds = [], rejectIds = [] } = req.body;
  if (!advanceIds.length && !rejectIds.length) {
    return res.status(400).json({ error: 'Provide at least one of advanceIds or rejectIds.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let advanced = [];
    if (advanceIds.length) {
      const result = await client.query(
        `UPDATE inductees SET status = 'advanced', round = round + 1
         WHERE id = ANY($1::int[]) RETURNING *`,
        [advanceIds]
      );
      advanced = result.rows;
    }

    let rejected = [];
    if (rejectIds.length) {
      const result = await client.query(
        `UPDATE inductees SET status = 'rejected' WHERE id = ANY($1::int[]) RETURNING *`,
        [rejectIds]
      );
      rejected = result.rows;
    }

    await client.query('COMMIT');

    for (const inductee of advanced) {
      sendEmail({
        to: inductee.email,
        subject: 'You have advanced to the next round!',
        text: `Hi ${inductee.name},\n\nCongratulations — you've been moved forward to round ${inductee.round} of the induction process. Watch your email/portal for interview scheduling and next steps.\n\n— Induction Team`,
      });
    }
    for (const inductee of rejected) {
      sendEmail({
        to: inductee.email,
        subject: 'Induction Process Update',
        text: `Hi ${inductee.name},\n\nThank you for your interest and effort throughout the induction process. Unfortunately, you have not been moved forward this round. We encourage you to apply again in the future.\n\n— Induction Team`,
      });
    }

    res.json({ advanced, rejected });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error advancing rounds.' });
  } finally {
    client.release();
  }
});

router.post('/announce-final', async (req, res) => {
  const { selectedIds = [], rejectedIds = [] } = req.body;
  if (!selectedIds.length && !rejectedIds.length) {
    return res.status(400).json({ error: 'Provide at least one of selectedIds or rejectedIds.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let selected = [];
    if (selectedIds.length) {
      const result = await client.query(
        `UPDATE inductees SET status = 'selected' WHERE id = ANY($1::int[]) RETURNING *`,
        [selectedIds]
      );
      selected = result.rows;
    }

    let rejected = [];
    if (rejectedIds.length) {
      const result = await client.query(
        `UPDATE inductees SET status = 'rejected' WHERE id = ANY($1::int[]) RETURNING *`,
        [rejectedIds]
      );
      rejected = result.rows;
    }

    await client.query('COMMIT');

    for (const inductee of selected) {
      sendEmail({
        to: inductee.email,
        subject: '🎉 Congratulations — You Have Been Selected!',
        text: `Hi ${inductee.name},\n\nCongratulations! You have been officially selected as part of the induction cohort in the ${inductee.assigned_domain || 'assigned'} domain.\n\nWelcome aboard!\n\n— Induction Team`,
      });
    }
    for (const inductee of rejected) {
      sendEmail({
        to: inductee.email,
        subject: 'Induction Process — Final Results',
        text: `Hi ${inductee.name},\n\nThank you for participating in our induction process this year. After careful consideration, we will not be moving forward with your application this time. We truly appreciate your effort and hope you'll consider applying again.\n\n— Induction Team`,
      });
    }

    res.json({ selected, rejected });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error announcing final results.' });
  } finally {
    client.release();
  }
});

module.exports = router;
