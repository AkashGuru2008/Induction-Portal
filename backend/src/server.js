require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const adminInducteeRoutes = require('./routes/adminInductees');
const domainRoutes = require('./routes/domain');
const interviewRoutes = require('./routes/interviews');
const roundRoutes = require('./routes/rounds');
const { sendUpcomingReminders } = require('./utils/reminders');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin/inductees', adminInducteeRoutes);
app.use('/api/domain', domainRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/rounds', roundRoutes);


app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Induction Portal API running on port ${PORT}`);

  // Check for interview reminders periodically (Module D - Basic).
  sendUpcomingReminders();
  setInterval(sendUpcomingReminders, 15 * 60 * 1000); // every 15 minutes
});
