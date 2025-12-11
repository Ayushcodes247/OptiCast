const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to,
      subject,
      text,
    });
    console.info(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error while sending email to ${to}:`, error);
  }
}

module.exports = sendEmail;
