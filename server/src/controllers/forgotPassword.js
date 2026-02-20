import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import sendMail from '../utils/mailSender.js';
import bcrypt from 'bcrypt';
import logger from '../config/logger.js';

const otpStore = {};

export const requestReset = async (req, res, next) => {
    const { username, email } = req.body;
    if (!username || !email) {
        throw new CustomError('Username and email are required', 400);
    }
    const [rows] = await Client.query('SELECT * FROM dtc_users WHERE username = @username AND email = @email', { username, email });
    if (!rows || rows.length === 0) {
        logger.warn('Password reset requested for invalid user', { username, email });
        throw new CustomError('User not found with provided username and email', 404);
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[username] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    sendMail({
        to: email,
        subject: 'Password Reset OTP',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #2950bb; padding: 25px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 20px;">SACL Security Verification</h2>
                </div>
                <div style="padding: 35px; color: #333333; text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 25px;">Hello <strong>${username}</strong>,</p>
                    <p style="font-size: 15px; color: #666666;">Requested a password reset? Use the verification code below to proceed. This code is valid for 10 minutes.</p>
                    
                    <div style="background-color: #f0f4ff; border: 2px dashed #2950bb; padding: 15px; border-radius: 8px; margin: 30px 0; display: inline-block;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2950bb;">${otp}</span>
                    </div>

                    <p style="font-size: 14px; color: #999999; margin-top: 20px;">If you did not request this, please ignore this email or contact the administrator.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; color: #aaaaaa; font-size: 11px; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0;">Automated System - Please do not reply.</p>
                </div>
            </div>
        `
    });

    logger.info('Password reset OTP requested', { username, email });
    res.json({ success: true, message: 'OTP sent to your email.' });
};

export const resetPassword = async (req, res, next) => {
    const { username, otp, newPassword } = req.body;
    if (!username || !otp || !newPassword) {
        throw new CustomError('All fields are required', 400);
    }
    const record = otpStore[username];
    if (!record || record.otp !== otp || record.expires < Date.now()) {
        logger.warn('Password reset failed: Invalid OTP', { username });
        throw new CustomError('Invalid or expired OTP', 400);
    }
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hash = await bcrypt.hash(newPassword, saltRounds);
    await Client.query('UPDATE dtc_users SET password_hash = @hash, email_verified = 1 WHERE username = @username', { hash, username });
    delete otpStore[username];

    logger.info('Password reset successful', { username });
    res.json({ success: true, message: 'Password updated successfully.' });
};
