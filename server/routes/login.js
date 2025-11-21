import express from 'express';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import CustomError from '../utils/customError.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
dotenv.config();
<<<<<<< HEAD

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
=======
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

const generateToken = (user_id, username, department_id = null, role = null) => {
    const payload = {
        user_id,
        username,
        department_id,
        role,
        iat: Math.floor(Date.now() / 1000)
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030

const generateRefreshToken = (user_id, username) => {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh');
    return jwt.sign({ user_id, username }, refreshSecret, { expiresIn: '7d' });
<<<<<<< HEAD
}

router.post('/', asyncErrorHandler(async (req, res, next) => {
    console.log('🔐 Login attempt for user:', req.body.username);
    
    const { username, password, role, department_id } = req.body;
    
    // Validate input
    if (!username || !password) {
        const error = new CustomError('Username and password are required', 400);
        return next(error);
    }
    
    if (!role) {
        const error = new CustomError('Role is required', 400);
        return next(error);
    }

    // Validate department is provided for HOD and User roles
    if ((role === 'HOD' || role === 'User') && !department_id) {
        const error = new CustomError('Department is required for HOD and User roles', 400);
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

        // Validate department for HOD and User roles
        if ((role === 'HOD' || role === 'User') && department_id) {
            const deptIdNum = parseInt(department_id);
            console.log('🔍 Department validation:', {
                userDepartmentId: user.department_id,
                userDepartmentIdType: typeof user.department_id,
                requestedDepartmentId: deptIdNum,
                requestedDepartmentIdType: typeof deptIdNum,
                match: user.department_id === deptIdNum
            });
            if (user.department_id !== deptIdNum) {
                console.log('❌ Department mismatch: user department_id is', user.department_id, 'but requested department_id is', deptIdNum);
                const error = new CustomError('User does not belong to the selected department', 403);
                return next(error);
=======
};

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { username, password, role, department_id } = req.body || {};

    if (!username || !password) {
        return next(new CustomError('Username and password are required', 400));
    }

    if (!role) {
        return next(new CustomError('Role is required', 400));
    }

    if ((role === 'HOD' || role === 'User') && !department_id) {
        return next(new CustomError('Department is required for HOD and User roles', 400));
    }

    try {
        const [rows] = await Client.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

        if (!rows || rows.length === 0) {
            return next(new CustomError('Invalid credentials', 401));
        }

        const user = rows[0];

        if (user.role !== role) {
            return next(new CustomError(`Invalid role. User role is ${user.role}`, 403));
        }

        if ((role === 'HOD' || role === 'User') && department_id) {
            const deptIdNum = parseInt(department_id, 10);
            if (user.department_id !== deptIdNum) {
                return next(new CustomError('User does not belong to the selected department', 403));
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
            }
        }

        const match = await bcrypt.compare(password, user.password_hash);
<<<<<<< HEAD
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
=======

        if (!match) {
            return next(new CustomError('Invalid credentials', 401));
        }

        const token = generateToken(user.user_id, user.username, user.department_id, user.role);
        const refreshToken = generateRefreshToken(user.user_id, user.username);

        return res.status(200).json({
            success: true,
            token,
            refreshToken,
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
    } catch (err) {
        return next(new CustomError('Server error during login', 500));
    }
}));

>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
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

<<<<<<< HEAD
    // payload should contain user_id and username
    const { user_id, username } = payload;
    // create new access token
    const newToken = generateToken(user_id, username);
    res.json({ success: true, token: newToken });
}));
=======
    const { user_id, username } = payload;
    const newToken = generateToken(user_id, username);
    return res.json({ success: true, token: newToken });
}));

export default router;
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
