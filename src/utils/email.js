const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1 Create transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2 Define email options
  const mailOptions = {
    from: 'Natours <hoangzxje0901@natour.io>',
    ...options,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };