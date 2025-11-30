import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';
import Pool from '../config/connection.js';

const verifyToken = asyncErrorHandler(async (req, res, next) => {
    let token = req.get('Authorization') || req.get('authorization');
    if (!token) {
        throw new CustomError('Token not found', 401);
    }
    if (token.startsWith('Bearer ')) token = token.slice(7);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET is not configured');
        throw new CustomError('Server misconfiguration: JWT secret missing', 500);
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, secret);
    } catch (err) {
        console.error('Token verification failed:', err.message);
        throw new CustomError('Invalid token', 401);
    }

    const username = decodedToken.username || decodedToken.user?.username || decodedToken.user;
    if (!username) throw new CustomError('Invalid token payload', 401);

    const [rows] = await Pool.execute(
      'SELECT user_id, username, department_id, role FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows || rows.length === 0) {
        throw new CustomError('User not found. Invalid token.', 404);
    }

    const user = rows[0];
    req.user = user;

    return next();
});

export default verifyToken;