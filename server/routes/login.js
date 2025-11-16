import express from 'express';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import CustomError from '../utils/customError.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
dotenv.config();
const router = express.Router();

const generateToken = (user_id, username, department_id, role) => {
    const token = jwt.sign({user_id, username, department_id, role}, process.env.JWT_SECRET);
    return token;
}

router.post('/', asyncErrorHandler(async(req, res, next) => {
    const {username, password} = req.body;
    const [rows] = await Client.query(
      'SELECT * FROM users WHERE username=? LIMIT 1',
      [username]
    );
    if (!rows.length === 0) {
      const error = new CustomError('User not found', 404);
      return next(error);
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if(match){
        const token = generateToken(user.user_id, user.username, user.department_id, user.role);
        res.status(200).json(
          {token: token,
           user: {
            user_id: user.user_id,
            username: user.username, 
            department_id: user.department_id, 
            role: user.role
           }
          }
        );
    } else{
        const error = new CustomError('Invalid credentials', 400);
        return next(error);
    }
}));

export default router;