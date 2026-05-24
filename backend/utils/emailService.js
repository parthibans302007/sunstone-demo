const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    // Standard configuration for Gmail or SMTP from process.env
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    // If credentials aren't set, we mock the email send rather than crashing the request
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[Email Mocked] To: ${to} | Subject: ${subject}`);
        return true;
    }

    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: `"Sunstone Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // Non-blocking, so we return false instead of throwing
    return false;
  }
};

module.exports = {
  sendEmail
};
