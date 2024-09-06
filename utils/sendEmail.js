const nodemailer = require('nodemailer');
const nodemailerConfig = require('./nodemailerConfig'); // Ensure this has Gmail SMTP config

const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport(nodemailerConfig);

  return transporter.sendMail({
    from: '"Having Trouble" <trouble.9954@gmail.com>', // Replace with your Gmail address
    to,
    subject,
    html,
    attachments
  });
};

module.exports = sendEmail;
