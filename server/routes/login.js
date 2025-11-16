import express from 'express';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import CustomError from '../utils/customError.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
dotenv.config();

const router = express.Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

const generateToken = (user_id, username, department_id, role) => {
    const token = jwt.sign(
        { 
            user_id, 
            username, 
            department_id, 
            role,
            iat: Math.floor(Date.now() / 1000)
        }, 
        JWT_SECRET, 
        { 
            expiresIn: '24h' 
        }
    );
    return token;
}

const generateRefreshToken = (user_id, username) => {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh');
    return jwt.sign({ user_id, username }, refreshSecret, { expiresIn: '7d' });
}

router.post('/', asyncErrorHandler(async (req, res, next) => {
    console.log('🔐 Login attempt for user:', req.body.username);
    
    const { username, password, role } = req.body;
    
    // Validate input
    if (!username || !password) {
        const error = new CustomError('Username and password are required', 400);
        return next(error);
    }
    
    if (!role) {
        const error = new CustomError('Role is required', 400);
        return next(error);
    }

    try {
        const [rows] = await Client.query(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [username]
        );
        
        if (rows.length === 0) {
            console.log('❌ User not found:', username);
            const error = new CustomError('Invalid credentials', 401);
            return next(error);
        }

        const user = rows[0];
        console.log('✅ User found:', user.username, 'Role:', user.role);

        // Validate role matches
        if (user.role !== role) {
            console.log('❌ Role mismatch: user role is', user.role, 'but requested role is', role);
            const error = new CustomError(`Invalid role. User role is ${user.role}`, 403);
            return next(error);
        }

        const match = await bcrypt.compare(password, user.password_hash);
        console.log('🔑 Password match:', match);

        if (match) {
            const token = generateToken(
                user.user_id, 
                user.username, 
                user.department_id, 
                user.role
            );
            const refreshToken = generateRefreshToken(user.user_id, user.username);

            console.log('✅ Login successful for user:', user.username, 'with role:', user.role);

            res.status(200).json({
                success: true,
                token: token,
                refreshToken: refreshToken,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    department_id: user.department_id,
                    role: user.role
                },
                expiresIn: '24h',
                message: `Login successful as ${user.role}`
            });
        } else {
            console.log('❌ Invalid password for user:', username);
            const error = new CustomError('Invalid credentials', 401);
            return next(error);
        }
    } catch (error) {
        console.error('💥 Login error:', error);
        const err = new CustomError('Server error during login', 500);
        return next(err);
    }
}));

// Make sure this is at the end
export default router;

// Refresh token endpoint
router.post('/refresh-token', asyncErrorHandler(async (req, res, next) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh');
    let payload;
    try {
        payload = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // payload should contain user_id and username
    const { user_id, username } = payload;
    // create new access token
    const newToken = generateToken(user_id, username);
    res.json({ success: true, token: newToken });
}));