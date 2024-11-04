import dotenv from "dotenv";
dotenv.config();
import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (options) => {
  // Initialize mailgen instance with default theme and brand configuration
  const mailGnerator = new Mailgen({
    theme: "default",
    product: {
      // Appears in header & footer of e-mails
      name: "Notebook",
      link: process.env.CORS_ORIGIN,
      // Optional product logo
      // logo: 'https://mailgen.js/img/logo.png'
    },
  });

  // For more info on how mailgen content work visit https://github.com/eladnava/mailgen#readme
  // Generate the plaintext version of the e-mail (for clients that do not support HTML)
  const emailTextual = mailGnerator.generatePlaintext(options.mailgenContent);

  // Generate an HTML email with the provided contents
  const emailHtml = mailGnerator.generate(options.mailgenContent);

  // Create a nodemailer transporter instance which is responsible to send a mail
  const transporter =  nodemailer.createTransport({
    service: "gmail",
      auth: {
        user: process.env.GMAIL_SMTP_USER,
        pass: process.env.GMAIL_SMTP_PASS,
      },
  })

  const mail = {
    from: "anishtanvar@gmail.com",
    to: options.email, // receiver's mail
    subject: options.subject, // mail subject
    text: emailTextual, // mailgen content textual variant
    html: emailHtml, // mailgen content html variant
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.log(
        "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
    );
    console.error("Error: ", error);
  }
};


/**
 *
 * @param {string} username
 * @param {string} verificationUrl
 * @returns {Mailgen.Content}
 * @description It designs the email verification mail
 */
const emailVerificationMailgenContent = (fullName, verificationUrl) => {
    return {
      body: {
        name: fullName,
        intro: "Welcome to Notebook! We're very excited to have you on board.",
        action: {
          instructions:
            "To verify your email please click on the following button:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Verify your email",
            link: verificationUrl,
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
};


/**
 *
 * @param {string} username
 * @param {string} verificationUrl
 * @returns {Mailgen.Content}
 * @description It designs the forgot password mail
 */
const forgotPasswordMailgenContent = (fullName, passwordResetUrl) => {
  return {
    body: {
      name: fullName,
      intro: "We got a request to reset the password of your account.",
      action: {
        instructions: "To reset your password click on tyhe following button",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro : 
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export { sendMail, emailVerificationMailgenContent, forgotPasswordMailgenContent}