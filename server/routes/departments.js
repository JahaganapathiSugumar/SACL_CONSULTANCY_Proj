import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
<<<<<<< HEAD
import verifyToken from '../utils/verifyToken.js';
=======
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030

const router = express.Router();

// Get all departments
<<<<<<< HEAD
router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
=======
router.get('/', asyncErrorHandler(async (req, res, next) => {
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
    const [departments] = await Client.query(
        `SELECT department_id, department_name FROM departments ORDER BY department_id`
    );
    res.status(200).json({
        success: true,
        data: departments || []
    });
}));

export default router;
