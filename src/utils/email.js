const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the button below to reset your password.</p>
      <p>This link expires in <strong>10 minutes</strong>.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p style="margin-top:20px;color:#888;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: email, subject: 'Password Reset Request', html });
};

module.exports = { sendEmail, sendPasswordResetEmail };
