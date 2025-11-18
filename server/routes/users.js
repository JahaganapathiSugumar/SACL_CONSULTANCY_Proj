import express from 'express';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(async (req, res, next) => {
  const [rows] = await Client.query('SELECT user_id, username, full_name, email, department_id, role, created_at FROM users');
  res.status(200).json({ users: rows });
}));

router.post('/', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(async (req, res, next) => {
  const { username, full_name, password, email, department_id, role } = req.body;
  if (!username || !password || !email) {
    throw new CustomError('Missing required fields', 400);
  }
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hash = await bcrypt.hash(password, saltRounds);
  const sql = 'INSERT INTO users (username, full_name, password_hash, email, department_id, role) VALUES (?, ?, ?, ?, ?, ?)';
  const [result] = await Client.query(sql, [username, full_name, hash, email, department_id || null, role || null]);
  res.status(201).json({ userId: result.insertId });
}));

export default router;