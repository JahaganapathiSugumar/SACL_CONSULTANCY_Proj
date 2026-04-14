import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import CustomError from './customError.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      rateLimit: {
        max: 10,
        time: 60 * 1000
      }
    });
  }
  return transporter;
};

const sendMail = async ({ to, cc, bcc, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"Digital Trial Card" <${process.env.SMTP_USER}>`,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments: [{
        filename: 'SACL-LOGO.jpg',
        path: path.resolve(__dirname, '../../assets/SACL-LOGO.jpg'),
        cid: 'sacllogo'
      }]
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