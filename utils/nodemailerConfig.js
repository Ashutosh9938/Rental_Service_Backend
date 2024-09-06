require('dotenv').config();
module.exports = {
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user:process.env.EMAIL , // Replace with your Gmail address
    pass: process.env.PASSWORD, // Replace with your App Password or Gmail password
  },
  secure: false, // true for 465, false for other ports
};
