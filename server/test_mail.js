import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from same directory (server folder)
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- Mail Configuration ---');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('-------------------------\n');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

const mailOptions = {
    from: `"SACL Test" <${process.env.SMTP_USER}>`,
    to: 'trackkumaran@gmail.com',
    subject: 'SMTP Test Mail',
    text: 'This is a test email sent from the SACL project test script.',
    html: '<b>This is a test email sent from the SACL project test script.</b>'
};

console.log('Attempting to send mail...');

try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
} catch (error) {
    console.error('Error occurred while sending mail:');
    console.error(error.message);
    if (error.code === 'EAUTH') {
        console.error('Authentication failed. Please check your SMTP_USER and SMTP_PASS.');
    } else if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused. Please check your SMTP_HOST and SMTP_PORT.');
    }
}
