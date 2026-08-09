const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    // No SMTP configured — fall back to logging emails to the console.
    // This keeps the app fully runnable in dev without real credentials.
    transporter = {
      sendMail: async (opts) => {
        console.log('\n----- 📧 [DEV EMAIL - not actually sent] -----');
        console.log('To:', opts.to);
        console.log('Subject:', opts.subject);
        console.log('Body:\n', opts.text || opts.html);
        console.log('-----------------------------------------------\n');
        return { messageId: 'dev-console' };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || 'Induction Portal <no-reply@example.com>',
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('Failed to send email to', to, err.message);
  }
}

module.exports = { sendEmail };
