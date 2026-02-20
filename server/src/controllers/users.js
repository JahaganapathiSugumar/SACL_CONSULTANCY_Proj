import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import sendMail from '../utils/mailSender.js';
import logger from '../config/logger.js';

export const getAllUsers = async (req, res, next) => {
    const [rows] = await Client.execute(`
    SELECT u.user_id, u.username, u.full_name, u.email, u.department_id, 
           d.department_name, u.role, u.is_active, u.created_at 
    FROM dtc_users u 
    LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.role NOT IN ('Admin')
  `);
    res.status(200).json({ users: rows });
};

export const createUser = async (req, res, next) => {
    const { username, password, full_name, department_id, role, machine_shop_user_type } = req.body;
    if (!username || !password || !full_name || !department_id || !role || !machine_shop_user_type) {
        throw new CustomError('Missing required fields', 400);
    }
    const [existing] = await Client.query('SELECT TOP 1 user_id FROM dtc_users WHERE username = @username', { username });
    if (existing && existing.length > 0) {
        logger.warn('User creation failed: Username exists', { username });
        throw new CustomError('Username already in use', 409);
    }
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hash = await bcrypt.hash(password, saltRounds);
    const sql = 'INSERT INTO dtc_users (username, full_name, password_hash, department_id, role, needs_password_change, email_verified, machine_shop_user_type) VALUES (@username, @full_name, @password_hash, @department_id, @role, 1, 0, @machine_shop_user_type)';
    await Client.query(sql, { username, full_name, password_hash: hash, department_id, role, machine_shop_user_type });
    logger.info('User created', { username, createdBy: req.user.username });
    res.status(201).json({ success: true, message: 'User created successfully.' });
};

export const deleteUser = async (req, res, next) => {
    const { userId } = req.params;
    const user = req.user;
    if (!userId) throw new CustomError('User ID is required', 400);
    const sql = 'DELETE FROM dtc_users WHERE user_id = @user_id';
    await Client.query(sql, { user_id: userId });
    logger.info('User deleted', { userId, deletedBy: user.username });
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
};

export const sendOtp = async (req, res, next) => {
    const { email } = req.body || {};
    const user = req.user;
    if (!email) throw new CustomError('Email is required', 400);

    const [existing] = await Client.query('SELECT TOP 1 user_id FROM dtc_users WHERE email = @email AND user_id != @user_id', { email, user_id: user.user_id });
    if (existing && existing.length > 0) {
        throw new CustomError('Email already in use by another account', 409);
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const sql = `INSERT INTO email_otps (user_id, email, otp_code, expires_at) VALUES (@user_id, @email, @otp_code, DATEADD(minute, 5, GETDATE()))`;
    try {
        await Client.query(sql, { user_id: user.user_id || null, email, otp_code: otp });
    } catch (err) {
        logger.error('Error storing OTP', err);
        throw new CustomError('Server error storing OTP', 500);
    }

    sendMail({
        to: email,
        subject: 'Email Verification Code',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #2950bb; padding: 25px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Email Verification</h2>
                </div>
                <div style="padding: 35px; color: #333333; text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 25px;">Hello,</p>
                    <p style="font-size: 15px; color: #666666;">Use the verification code below to confirm your new email address. This code will expire in 5 minutes.</p>
                    
                    <div style="background-color: #f0f4ff; border: 2px dashed #2950bb; padding: 15px; border-radius: 8px; margin: 30px 0; display: inline-block;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2950bb;">${otp}</span>
                    </div>

                    <p style="font-size: 14px; color: #999999; margin-top: 20px;">If you did not initiate this change, please ignore this email.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; color: #aaaaaa; font-size: 11px; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0;">Automated System - SACL Digital Trial Card</p>
                </div>
            </div>
        `
    });

    logger.info('OTP requested', { email, userId: user.user_id });
    return res.json({ success: true, message: 'OTP sent' });
};

export const verifyOtp = async (req, res, next) => {
    const { email, otp } = req.body || {};
    const user = req.user;
    if (!email || !otp) throw new CustomError('Email and OTP are required', 400);
    const selectSql = `SELECT TOP 1 otp_id, otp_code, attempts, expires_at FROM email_otps
    WHERE user_id = @user_id AND email = @email AND used = 0 AND expires_at > GETDATE()
    ORDER BY created_at DESC`;
    const [rows] = await Client.query(selectSql, { user_id: user.user_id || null, email });
    if (!rows || rows.length === 0) {
        logger.warn('OTP verification failed: Not found or expired', { email, userId: user.user_id });
        throw new CustomError('OTP not found or expired', 400);
    }

    const record = rows[0];
    const otpId = record.otp_id;

    if (String(record.otp_code) !== String(otp)) {
        await Client.query('UPDATE email_otps SET attempts = attempts + 1 WHERE otp_id = @otp_id', { otp_id: otpId });
        const attempts = (record.attempts || 0) + 1;
        if (attempts >= 5) {
            await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });
            logger.warn('OTP invalidated due to max attempts', { otpId });
        }
        throw new CustomError('Invalid OTP', 400);
    }

    try {
        await Client.query('UPDATE dtc_users SET email = @email, email_verified = 1 WHERE user_id = @user_id', { email, user_id: user.user_id });
    } catch (err) {
        await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });
        logger.error('Error updating user email', err);
        return next(new CustomError('Email already in use', 409));
    }

    await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });

    logger.info('Email verified and updated', { userId: user.user_id, email });
    return res.json({ success: true, message: 'Email verified and updated' });
};

export const changePassword = async (req, res, next) => {
    const { newPassword } = req.body || {};
    const user = req.user;
    if (!newPassword) throw new CustomError('New password is required', 400);
    if (typeof newPassword !== 'string' || newPassword.length < 6) throw new CustomError('Password must be at least 6 characters', 400);

    if (newPassword === user.username) throw new CustomError('New password must not be your username', 400);

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hash = await bcrypt.hash(newPassword, saltRounds);

    await Client.query('UPDATE dtc_users SET password_hash = @password_hash, needs_password_change = 0 WHERE user_id = @user_id', { password_hash: hash, user_id: user.user_id });

    logger.info('Password updated', { userId: user.user_id });
    return res.json({ success: true, message: 'Password updated' });
};

export const updateUsername = async (req, res, next) => {
    const { username } = req.body || {};
    const user = req.user;

    if (!username) throw new CustomError('Username is required', 400);
    if (typeof username !== 'string' || username.trim().length === 0) throw new CustomError('Username cannot be empty', 400);
    if (username === user.username) throw new CustomError('New username must be different from current username', 400);

    const [existing] = await Client.query('SELECT TOP 1 user_id FROM dtc_users WHERE username = @username', { username });
    if (existing && existing.length > 0) {
        throw new CustomError('Username already in use', 409);
    }

    await Client.query('UPDATE dtc_users SET username = @username WHERE user_id = @user_id', { username, user_id: user.user_id });

    logger.info('Username updated', { userId: user.user_id, oldUsername: user.username, newUsername: username });
    return res.json({ success: true, message: 'Username updated successfully' });
};

export const changeStatus = async (req, res, next) => {
    const { userId, status } = req.body || {};
    if (!userId) throw new CustomError('User ID and status are required', 400);
    if (typeof status !== 'boolean') throw new CustomError('Status must be a boolean', 400);

    await Client.query('UPDATE dtc_users SET is_active = @is_active WHERE user_id = @user_id', { is_active: status, user_id: userId });

    logger.info('User status updated', { userId, status, updatedBy: req.user.username });
    return res.json({ success: true, message: 'User status updated' });
};

export const uploadProfilePhoto = async (req, res, next) => {
    const { photoBase64 } = req.body || {};
    const user = req.user;

    if (!photoBase64) throw new CustomError('Photo is required', 400);
    if (typeof photoBase64 !== 'string') throw new CustomError('Photo must be a base64 string', 400);

    if (!photoBase64.startsWith('data:image')) throw new CustomError('Invalid image format. Please upload a valid image.', 400);

    const maxPhotoSize = 5242880;
    if (photoBase64.length > maxPhotoSize) {
        throw new CustomError('Photo size exceeds maximum limit of 5MB', 400);
    }

    await Client.query('UPDATE dtc_users SET profile_photo = @profile_photo WHERE user_id = @user_id', {
        profile_photo: photoBase64,
        user_id: user.user_id
    });

    logger.info('Profile photo updated', { userId: user.user_id });
    return res.json({ success: true, message: 'Profile photo uploaded successfully' });
};

export const getProfilePhoto = async (req, res, next) => {
    const user = req.user;

    const [rows] = await Client.query('SELECT profile_photo FROM dtc_users WHERE user_id = @user_id', { user_id: user.user_id });

    if (!rows || rows.length === 0) {
        throw new CustomError('User not found', 404);
    }

    const profilePhoto = rows[0]?.profile_photo ?? null;

    return res.json({ success: true, profilePhoto: profilePhoto });
};

export const adminUpdateUser = async (req, res, next) => {
    const { userId } = req.params;
    const { username, full_name, email, department_id, role, password } = req.body;

    if (!userId || isNaN(userId)) {
        throw new CustomError('Valid User ID is required', 400);
    }
    const [existingUser] = await Client.query('SELECT * FROM dtc_users WHERE user_id = @userId', { userId });
    if (!existingUser || existingUser.length === 0) {
        throw new CustomError('User not found', 404);
    }

    if (username && username !== existingUser[0].username) {
        const [duplicate] = await Client.query('SELECT user_id FROM dtc_users WHERE username = @username AND user_id != @userId', { username, userId });
        if (duplicate && duplicate.length > 0) {
            throw new CustomError('Username already in use', 409);
        }
    }

    let passwordHash = null;
    let needsChange = null;
    if (password) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        passwordHash = await bcrypt.hash(password, saltRounds);
        needsChange = 1;
    }

    let emailVerified = existingUser[0].email_verified;
    if (email !== undefined && email !== existingUser[0].email) {
        emailVerified = 0;
    }

    const sql = `
        UPDATE dtc_users 
        SET username = COALESCE(@username, username),
            full_name = COALESCE(@full_name, full_name),
            email = COALESCE(@email, email),
            email_verified = @email_verified,
            department_id = COALESCE(@department_id, department_id),
            role = COALESCE(@role, role),
            password_hash = COALESCE(@password_hash, password_hash),
            needs_password_change = COALESCE(@needs_password_change, needs_password_change)
        WHERE user_id = @userId
    `;

    await Client.query(sql, {
        userId,
        username: username || null,
        full_name: full_name || null,
        email: email === undefined ? null : email,
        email_verified: emailVerified,
        department_id: department_id || null,
        role: role || null,
        password_hash: passwordHash,
        needs_password_change: needsChange
    });

    logger.info('Admin updated user', { adminId: req.user.user_id, targetUserId: userId });

    res.json({ success: true, message: 'User updated successfully' });
};
