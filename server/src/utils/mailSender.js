import nodemailer from 'nodemailer';
import CustomError from './customError.js';
import logger from '../config/logger.js';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

const sendMail = async ({ to, cc, bcc, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"SACL Digital Trial Card" <${process.env.SMTP_USER}>`,
      to,
      cc,
      bcc,
      subject,
      text,
      html
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending error:', error.message);
    return { success: false, error: error.message };
  }
};

export default sendMail;
