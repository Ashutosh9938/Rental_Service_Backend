const sendEmail = require('./sendEmail');

const sendVerificationEmail = async ({
  name,
  email,
  verificationToken,
  origin,
}) => {
  try {
    const verifyEmail = `${origin}/user/verify-email?token=${verificationToken}&email=${email}`;

    const message = `<p>Please confirm your email by clicking on the following link: 
    <a href="${verifyEmail}">Verify Email</a></p>`;

    await sendEmail({
      to: email,
      subject: 'Email Confirmation',
      html: `<h4>Hello, ${name}</h4>
      ${message}
      <p>If you did not request this, please ignore this email.</p>`,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Optionally, handle the error or rethrow it
  }
};

module.exports = sendVerificationEmail;
