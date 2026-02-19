import Client from '../config/connection.js';
import logger from '../config/logger.js';

export const uploadDocument = async (req, res, next) => {
    const { trial_id, document_type, file_name, file_base64, remarks } = req.body;
    await Client.query(
        `INSERT INTO documents (trial_id, document_type, file_name, file_base64, uploaded_by, remarks) VALUES (@trial_id, @document_type, @file_name, @file_base64, @uploaded_by, @remarks)`,
        { trial_id, document_type, file_name, file_base64, uploaded_by: req.user.user_id, remarks }
    );
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Document uploaded',
        remarks: `Document ${file_name} uploaded by ${req.user.username} (IP: ${req.ip}) with trial id ${trial_id} for ${document_type}`
    });

    logger.info('Document uploaded', { trial_id, document_type, file_name, uploadedBy: req.user.username });

    res.status(201).json({
        message: "Document uploaded successfully.",
        success: true
    });
};

export const getDocuments = async (req, res, next) => {
    const { trial_id } = req.query;
    const [documents] = await Client.query(
        `SELECT d.*, u.username as uploaded_by_username 
         FROM documents d 
         LEFT JOIN dtc_users u ON d.uploaded_by = u.user_id 
         WHERE d.trial_id = @trial_id 
         ORDER BY d.document_id`,
        { trial_id }
    );
    res.status(200).json({
        success: true,
        data: documents || []
    });
};

export const viewDocument = async (req, res, next) => {
    const { id } = req.params;

    const [rows] = await Client.query(
        `SELECT file_base64, file_name FROM documents WHERE document_id = @id`,
        { id }
    );

    if (!rows || rows.length === 0) {
        return res.status(404).send("Document not found");
    }

    const doc = rows[0];
    const base64Data = doc.file_base64.replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = doc.file_name.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'gif') mimeType = 'image/gif';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
    res.send(buffer);
};
