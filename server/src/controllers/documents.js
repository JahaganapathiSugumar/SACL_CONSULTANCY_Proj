import Client from '../config/connection.js';
import logger from '../config/logger.js';

export const uploadDocument = async (req, res, next) => {
    const { trial_id, pattern_code, document_type, file_name, file_base64, remarks, is_confidential } = req.body;
    await Client.query(
        `INSERT INTO documents (trial_id, pattern_code, document_type, file_name, file_base64, uploaded_by, remarks, is_confidential) 
         VALUES (@trial_id, @pattern_code, @document_type, @file_name, @file_base64, @uploaded_by, @remarks, @is_confidential)`,
        { trial_id, pattern_code, document_type, file_name, file_base64, uploaded_by: req.user.user_id, remarks, is_confidential: is_confidential ? 1 : 0 }
    );
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Document uploaded',
        remarks: `Document ${file_name} uploaded by ${req.user.username} (IP: ${req.ip}) for ${document_type} (Trial: ${trial_id || '-'}, Pattern: ${pattern_code || '-'})`
    });

    logger.info('Document uploaded', { trial_id, document_type, file_name, uploadedBy: req.user.username });

    res.status(201).json({
        message: "Document uploaded successfully.",
        success: true
    });
};

export const getDocuments = async (req, res, next) => {
    const { trial_id, pattern_code } = req.query;
    let rows;
    
    let whereClause = '';
    const params = { user_dept_id: req.user.department_id };
    
    if (trial_id) {
        whereClause = 'd.trial_id = @trial_id';
        params.trial_id = trial_id;
    } else if (pattern_code) {
        whereClause = 'd.pattern_code = @pattern_code';
        params.pattern_code = pattern_code;
    } else {
        return res.status(400).json({ success: false, message: 'trial_id or pattern_code is required' });
    }

    const baseQuery = `
        SELECT d.*, u.username as uploaded_by_username 
        FROM documents d 
        LEFT JOIN dtc_users u ON d.uploaded_by = u.user_id 
        WHERE ${whereClause} 
    `;

    if (req.user.role === 'Admin') {
        [rows] = await Client.query(
            `${baseQuery} ORDER BY d.document_id`,
            params
        )
    } else {
        [rows] = await Client.query(
            `${baseQuery} AND (d.is_confidential = 0 OR d.is_confidential IS NULL OR u.department_id = @user_dept_id)
             ORDER BY d.document_id`,
            params
        )
    }
    res.status(200).json({
        success: true,
        data: rows || []
    });
};

export const viewDocument = async (req, res, next) => {
    const { id } = req.params;

    const [rows] = await Client.query(
        `SELECT file_base64, file_name, is_confidential FROM documents WHERE document_id = @id`,
        { id }
    );

    if (!rows || rows.length === 0) {
        return res.status(404).send("Document not found");
    }

    const doc = rows[0];

    if (doc.is_confidential === 1 && req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: "Access denied. Confidential document restricted to Admin only."
        });
    }
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

export const deleteDocument = async (req, res, next) => {
    const { id } = req.params;

    const [docs] = await Client.query(`SELECT file_name, document_type, trial_id, pattern_code, uploaded_by FROM documents WHERE document_id = @id`, { id });
    if (!docs || docs.length === 0) {
        return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = docs[0];

    const isUploader = doc.uploaded_by == req.user.user_id;
    const isAdminOrHOD = req.user.role === 'Admin' || req.user.role === 'HOD';

    if (!isUploader && !isAdminOrHOD) {
        return res.status(403).json({ success: false, message: "Permission denied. You can only delete your own uploads." });
    }

    await Client.query(`DELETE FROM documents WHERE document_id = @id`, { id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id: doc.trial_id,
        action: 'Document deleted',
        remarks: `Document ${doc.file_name} (${doc.document_type}) deleted by ${req.user.username} (Trial: ${doc.trial_id || '-'}, Pattern: ${doc.pattern_code || '-'})`
    });

    logger.info('Document deleted', { document_id: id, fileName: doc.file_name, deletedBy: req.user.username });

    res.status(200).json({ success: true, message: "Document deleted successfully" });
};
