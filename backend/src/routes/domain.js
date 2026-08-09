const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const VALID_DOMAINS = ['DevOps', 'Corporate Communications', 'Creatives'];

async function getInducteeDomain(inducteeId) {
  const result = await pool.query('SELECT assigned_domain FROM inductees WHERE id = $1', [inducteeId]);
  return result.rows[0] ? result.rows[0].assigned_domain : null;
}

// Middleware: inductee must be assigned to the :domain in the URL (Module C - Basic access control)
async function requireOwnDomain(req, res, next) {
  const { domain } = req.params;
  if (!VALID_DOMAINS.includes(domain)) return res.status(400).json({ error: 'Invalid domain.' });

  if (req.user.role === 'admin') return next(); // admins can access any domain page

  const assigned = await getInducteeDomain(req.user.id);
  if (!assigned) return res.status(403).json({ error: 'You have not yet been assigned a domain.' });
  if (assigned !== domain) return res.status(403).json({ error: 'You do not have access to this domain.' });
  next();
}

router.use(verifyToken);

// ---- Tasks ----

// GET /api/domain/:domain/tasks — inductee (own domain) or admin
router.get('/:domain/tasks', requireOwnDomain, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE domain = $1 ORDER BY deadline NULLS LAST, created_at DESC',
      [req.params.domain]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching tasks.' });
  }
});

// POST /api/domain/:domain/tasks — admin only (Module C - Basic)
router.post('/:domain/tasks', requireRole('admin'), async (req, res) => {
  const { domain } = req.params;
  const { title, description, deadline } = req.body;
  if (!VALID_DOMAINS.includes(domain)) return res.status(400).json({ error: 'Invalid domain.' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required.' });

  try {
    const result = await pool.query(
      `INSERT INTO tasks (domain, title, description, deadline) VALUES ($1, $2, $3, $4) RETURNING *`,
      [domain, title.trim(), description || null, deadline || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating task.' });
  }
});

// ---- Q&A ----

// GET /api/domain/:domain/qna — inductee (own domain, sees all Q&A on that domain) or admin
router.get('/:domain/qna', requireOwnDomain, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT qna.*, inductees.name AS inductee_name, inductees.roll_number
       FROM qna JOIN inductees ON inductees.id = qna.inductee_id
       WHERE qna.domain = $1 ORDER BY qna.created_at DESC`,
      [req.params.domain]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching Q&A.' });
  }
});

// POST /api/domain/:domain/qna — inductee posts a question on their own domain (Module C - Basic)
router.post('/:domain/qna', requireOwnDomain, requireRole('inductee'), async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) return res.status(400).json({ error: 'Question text is required.' });

  try {
    const result = await pool.query(
      `INSERT INTO qna (domain, inductee_id, question) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.domain, req.user.id, question.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error posting question.' });
  }
});

// POST /api/domain/:domain/qna/:qnaId/answer — admin responds (Module C - Basic)
router.post('/:domain/qna/:qnaId/answer', requireRole('admin'), async (req, res) => {
  const { answer } = req.body;
  if (!answer || !answer.trim()) return res.status(400).json({ error: 'Answer text is required.' });

  try {
    const result = await pool.query(
      `UPDATE qna SET answer = $1, answered_at = now() WHERE id = $2 AND domain = $3 RETURNING *`,
      [answer.trim(), req.params.qnaId, req.params.domain]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Question not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error posting answer.' });
  }
});

module.exports = router;
