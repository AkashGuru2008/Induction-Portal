const pool = require('../config/db');
const { sendEmail } = require('./email');

// Sends a reminder email for any Scheduled interview starting within the next
// 24 hours that hasn't already had a reminder sent. Intended to be run on an
// interval (see server.js) so reminders go out automatically ahead of time.
async function sendUpcomingReminders() {
  try {
    const result = await pool.query(
      `SELECT b.id AS booking_id, s.start_time, s.end_time, s.domain, s.panelist,
              i.name, i.email
       FROM interview_bookings b
       JOIN interview_slots s ON s.id = b.slot_id
       JOIN inductees i ON i.id = b.inductee_id
       WHERE b.status = 'Scheduled'
         AND b.reminder_sent = false
         AND s.start_time BETWEEN now() AND now() + interval '24 hours'`
    );

    for (const row of result.rows) {
      await sendEmail({
        to: row.email,
        subject: 'Reminder: Your Interview is Coming Up',
        text: `Hi ${row.name},\n\nThis is a reminder that your ${row.domain} interview is scheduled for ${new Date(row.start_time).toLocaleString()}.\n\nPlease be on time. Good luck!\n\n— Induction Team`,
      });
      await pool.query('UPDATE interview_bookings SET reminder_sent = true WHERE id = $1', [row.booking_id]);
    }

    if (result.rows.length) {
      console.log(`📨 Sent ${result.rows.length} interview reminder(s).`);
    }
  } catch (err) {
    console.error('Reminder job failed:', err.message);
  }
}

module.exports = { sendUpcomingReminders };
