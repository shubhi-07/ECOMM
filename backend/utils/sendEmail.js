const nodeMailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({  //   fake mail generation.
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    service: process.env.SMPT_SERVICE,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMPT_MAIL,     //upar jo auth m user h uski mail
    to: options.email,    //jo user h usko bhejni h
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions); //isse mail jayegi.
};

module.exports = sendEmail;
