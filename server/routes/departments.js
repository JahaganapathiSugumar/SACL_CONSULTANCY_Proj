import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Pool from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

const router = express.Router();

// Get all departments
router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [departments] = await Pool.execute(
        `SELECT department_id, department_name FROM departments ORDER BY department_id`
    );
    res.status(200).json({
        success: true,
        data: departments || []
    });
}));

export default router;