import express from 'express';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

/*
  GET /users
  - Admins: return all users, or filter by ?department_id if provided.
  - Non-admins: return only users that belong to the same department as the requester.
  Notes:
    - verifyToken is expected to attach requester info to req.user (including role and department_id).
    - POST (create user) remains Admin-only.
*/
router.get(
  '/',
  verifyToken,
  asyncErrorHandler(async (req, res, next) => {
    const requester = req.user;

    if (!requester) {
      throw new CustomError('Unauthorized', 401);
    }

    // Allow admin to optionally filter by query param ?department_id
    if (requester.role === 'Admin') {
      const { department_id } = req.query;
      let rows;
      if (department_id !== undefined) {
        // Return users for a specific department (admin requested)
        const [result] = await Client.query(
          'SELECT user_id, username, full_name, email, department_id, role, created_at FROM users WHERE department_id = ?',
          [department_id]
        );
        rows = result;
      } else {
        // Return all users
        const [result] = await Client.query(
          'SELECT user_id, username, full_name, email, department_id, role, created_at FROM users'
        );
        rows = result;
      }

      return res.status(200).json({ users: rows });
    }

    // Non-admin users: filter by their department_id
    const requesterDeptId = requester.department_id || null;

    // If requester has no department assigned, return empty list (or change behaviour if needed)
    if (!requesterDeptId) {
      return res.status(200).json({ users: [] });
    }

    const [rows] = await Client.query(
      'SELECT user_id, username, full_name, email, department_id, role, created_at FROM users WHERE department_id = ?',
      [requesterDeptId]
    );

    return res.status(200).json({ users: rows });
  })
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Admin'),
  asyncErrorHandler(async (req, res, next) => {
    const { username, full_name, password, email, department_id, role } = req.body;
    if (!username || !password || !email) {
      throw new CustomError('Missing required fields', 400);
    }
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hash = await bcrypt.hash(password, saltRounds);
    const sql = 'INSERT INTO users (username, full_name, password_hash, email, department_id, role) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [username, full_name, hash, email, department_id || null, role || null]);
    res.status(201).json({ userId: result.insertId });
  })
);

export default router;