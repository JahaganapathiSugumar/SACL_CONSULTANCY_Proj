import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, document_type, file_name, file_base64, uploaded_by, remarks } = req.body;
    const [result] = await Client.query(
        `INSERT INTO documents (trial_id, document_type, file_name, file_base64, uploaded_by, remarks) VALUES (?, ?, ?, ?, ?, ?)`,
        [trial_id, document_type, file_name, file_base64, uploaded_by, remarks]
    );
    res.status(201).json({
        success: true,
        data: "Document uploaded successfully"
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id } = req.query;
    const [documents] = await Client.query(
        `SELECT * FROM documents WHERE trial_id = ? ORDER BY document_id`,
        [trial_id]
    );
    res.status(200).json({
        success: true,
        data: documents || []
    });
}));

export default router;

// CREATE TABLE documents (
//     document_id SERIAL PRIMARY KEY,
//     trial_id INT REFERENCES trial_cards(trial_id) ON DELETE CASCADE,
//     document_type VARCHAR(50) NOT NULL,
//     file_name VARCHAR(255) NOT NULL,
//     file_base64 TEXT,
//     uploaded_by INT REFERENCES users(user_id),
//     uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     remarks TEXT
// );