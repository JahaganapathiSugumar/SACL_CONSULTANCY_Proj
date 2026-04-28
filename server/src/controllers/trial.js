import Client from '../config/connection.js';
import { createDepartmentProgress, updateDepartment, updateRole } from '../services/departmentProgress.js';
import logger from '../config/logger.js';
import sendMail from '../utils/mailSender.js';
import { generateAndStoreConsolidatedReport, fetchAllTrialsDataForMasterCard } from '../services/consolidatedReportGenerator.js';

export const createTrial = async (req, res, next) => {
    const { master_card_id, trial_type, material_grade, initiated_by, date_of_sampling, plan_moulds, actual_moulds, reason_for_sampling, status, disa, sample_traceability, mould_correction, tooling_modification, remarks } = req.body || {};
    if (!master_card_id || !trial_type || !material_grade || !initiated_by || !date_of_sampling || !plan_moulds || !reason_for_sampling || !disa || !sample_traceability) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const mouldJson = JSON.stringify(mould_correction);

    let trial_id;
    let next_trial_no;
    let part_name;
    let pattern_code;

    await Client.transaction(async (trx) => {

        const [masterRows] = await trx.query('SELECT pattern_code, part_name FROM master_card WHERE id = @master_card_id', { master_card_id });
        if (masterRows.length === 0) {
            throw new Error('Master card not found');
        }
        pattern_code = masterRows[0].pattern_code;
        part_name = masterRows[0].part_name;

        const [countRows] = await trx.query(
            'SELECT COUNT(*) AS count FROM trial_cards WITH (UPDLOCK, HOLDLOCK) WHERE master_card_id = @master_card_id',
            { master_card_id }
        );
        next_trial_no = countRows[0].count + 1;

        const sql = 'INSERT INTO trial_cards (trial_no, master_card_id, trial_type, material_grade, initiated_by, date_of_sampling, plan_moulds, actual_moulds, reason_for_sampling, status, current_department_id, disa, sample_traceability, mould_correction, tooling_modification, remarks) VALUES (@trial_no, @master_card_id, @trial_type, @material_grade, @initiated_by, @date_of_sampling, @plan_moulds, @actual_moulds, @reason_for_sampling, @status, @current_department_id, @disa, @sample_traceability, @mould_correction, @tooling_modification, @remarks); SELECT SCOPE_IDENTITY() AS trial_id;';
        const result = await trx.query(sql, {
            trial_no: next_trial_no,
            master_card_id,
            trial_type,
            material_grade,
            initiated_by,
            date_of_sampling,
            plan_moulds,
            actual_moulds,
            reason_for_sampling,
            status: status || 'CREATED',
            current_department_id: 2,
            disa,
            sample_traceability,
            mould_correction: mouldJson,
            tooling_modification: tooling_modification,
            remarks: remarks
        });

        trial_id = result[0][0].trial_id;

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Trial created',
            remarks: `Trial (No: ${next_trial_no}) created by ${req.user.username} (IP: ${req.ip}) for part name ${part_name}`
        });

        await createDepartmentProgress(trial_id, req.user, part_name, trx, req.ip);
        if (req.user.role !== 'Admin') {
            await updateRole(trial_id, req.user, trx, req.ip);
        }
    });

    logger.info('Trial created successfully', { trial_id, part_name, trial_no: next_trial_no, createdBy: req.user.username });
    return res.status(201).json({ success: true, message: 'Trial created successfully.', trial_id, trial_no: next_trial_no });
};

export const getTrials = async (req, res, next) => {
    const [rows] = await Client.query(`
        SELECT t.*, m.part_name, m.pattern_code 
        FROM trial_cards t 
        JOIN master_card m ON t.master_card_id = m.id 
        WHERE t.deleted_at IS NULL
    `);
    res.status(200).json({ success: true, data: rows });
};

export const getTrialById = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    const [rows] = await Client.query(`
        SELECT t.*, m.part_name, m.pattern_code 
        FROM trial_cards t 
        JOIN master_card m ON t.master_card_id = m.id 
        WHERE t.trial_id = @trial_id AND t.deleted_at IS NULL
    `, { trial_id });
    res.status(200).json({ success: true, data: rows });
};

export const getTrialReports = async (req, res, next) => {
    const [rows] = await Client.query(`
        SELECT 
            tr.document_id, tr.file_name, 
            tc.trial_id, tc.trial_no, 
            m.part_name, m.pattern_code, 
            d.department_name AS department, 
            tc.current_department_id, tc.material_grade, tc.date_of_sampling, tc.status, tc.trial_type 
        FROM trial_cards tc 
        JOIN master_card m ON tc.master_card_id = m.id
        LEFT JOIN trial_reports tr ON tc.trial_id = tr.trial_id AND tr.deleted_at IS NULL 
        LEFT JOIN departments d ON tc.current_department_id = d.department_id 
        WHERE tc.deleted_at IS NULL
    `);
    res.status(200).json({ success: true, data: rows });
};

export const getConsolidatedReports = async (req, res, next) => {
    const [rows] = await Client.query("SELECT c.document_id, c.file_name, c.master_card_id, m.pattern_code, m.part_name FROM consolidated_reports c JOIN master_card m ON c.master_card_id = m.id");
    res.status(200).json({ success: true, data: rows });
};

export const getConsolidatedReportFile = async (req, res, next) => {
    const { master_card_id } = req.params;
    if (!master_card_id) {
        return res.status(400).json({ success: false, message: 'Master card ID is required' });
    }
    const [rows] = await Client.query("SELECT file_base64, file_name FROM consolidated_reports WHERE master_card_id = @master_card_id", { master_card_id });
    if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Consolidated report file not found' });
    }
    res.status(200).json({ success: true, data: rows[0] });
};

export const getPatternFullData = async (req, res, next) => {
    const { master_card_id } = req.params;
    if (!master_card_id) {
        return res.status(400).json({ success: false, message: 'Master card ID is required' });
    }
    const allTrialsData = await fetchAllTrialsDataForMasterCard(master_card_id, Client);
    res.status(200).json({ success: true, data: allTrialsData });
};

export const getRecentTrialReports = async (req, res, next) => {
    const [rows] = await Client.query(`
        SELECT TOP 10 
            tr.document_id, tr.file_name, 
            tc.trial_id, tc.trial_no, 
            m.part_name, m.pattern_code, 
            d.department_name AS department, 
            tc.current_department_id, tc.material_grade, tc.date_of_sampling, tc.status, tc.trial_type 
        FROM trial_cards tc 
        JOIN master_card m ON tc.master_card_id = m.id
        LEFT JOIN trial_reports tr ON tc.trial_id = tr.trial_id AND tr.deleted_at IS NULL 
        LEFT JOIN departments d ON tc.current_department_id = d.department_id 
        WHERE tc.deleted_at IS NULL 
        ORDER BY tc.date_of_sampling DESC
    `);
    res.status(200).json({ success: true, data: rows });
};

export const generateTrialNo = async (req, res, next) => {
    let master_card_id = req.query.master_card_id;
    if (!master_card_id) {
        return res.status(400).json({ success: false, message: 'master_card_id query parameter is required' });
    }
    const [rows] = await Client.query('SELECT COUNT(*) AS count FROM trial_cards WHERE master_card_id = @master_card_id', { master_card_id });

    const count = rows[0].count + 1;
    res.status(200).json({ success: true, data: count });
};

export const updateTrial = async (req, res, next) => {
    const {
        trial_id,
        master_card_id,
        trial_no,
        trial_type,
        material_grade,
        date_of_sampling,
        plan_moulds,
        actual_moulds,
        reason_for_sampling,
        disa,
        sample_traceability,
        mould_correction,
        tooling_modification,
        remarks,
        is_edit
    } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required to update the trial' });
    }

    const mouldJson = mould_correction ? JSON.stringify(mould_correction) : null;

    await Client.transaction(async (trx) => {
        if (is_edit) {
            const sql = `UPDATE trial_cards SET 
                master_card_id = COALESCE(@master_card_id, master_card_id),
                trial_no = COALESCE(@trial_no, trial_no),
                trial_type = COALESCE(@trial_type, trial_type),
                material_grade = COALESCE(@material_grade, material_grade),
                date_of_sampling = COALESCE(@date_of_sampling, date_of_sampling),
                plan_moulds = COALESCE(@plan_moulds, plan_moulds),
                actual_moulds = COALESCE(@actual_moulds, actual_moulds),
                reason_for_sampling = COALESCE(@reason_for_sampling, reason_for_sampling),
                disa = COALESCE(@disa, disa),
                sample_traceability = COALESCE(@sample_traceability, sample_traceability),
                mould_correction = COALESCE(@mould_correction, mould_correction),
                tooling_modification = COALESCE(@tooling_modification, tooling_modification),
                remarks = COALESCE(@remarks, remarks)
                WHERE trial_id = @trial_id`;

            await trx.query(sql, {
                master_card_id,
                trial_no,
                trial_type,
                material_grade,
                date_of_sampling,
                plan_moulds,
                actual_moulds,
                reason_for_sampling,
                disa,
                sample_traceability,
                mould_correction: mouldJson,
                tooling_modification,
                remarks,
                trial_id
            });

            const [infoRows] = await trx.query(`
                SELECT tc.trial_no, m.part_name, m.pattern_code 
                FROM trial_cards tc 
                JOIN master_card m ON tc.master_card_id = m.id 
                WHERE tc.trial_id = @trial_id
            `, { trial_id });
            const { part_name, pattern_code } = infoRows[0];

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id,
                action: 'Trial updated',
                remarks: `Trial ID: ${trial_id}, Trial No: ${trial_no} updated by ${req.user.username} (IP: ${req.ip})`
            });
            logger.info('Trial updated', { trial_id, updatedBy: req.user.username });

            const [userRows] = await trx.query(
                'SELECT email FROM dtc_users WHERE department_id IN (4, 6, 7) AND is_active = 1 AND email IS NOT NULL'
            );

            const emails = [...new Set(userRows.map(u => u.email))];

            if (emails.length > 0) {
                sendMail({
                    to: emails,
                    subject: `Trial Updated: ${part_name} - ${trial_no}`,
                    text: `The trial card Trial No: ${trial_no} (Part: ${part_name}) has been updated by ${req.user.username}.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #E67E22;">Trial Card Update Notification</h2>
                            <p>The following trial card has been updated:</p>
                            <ul style="list-style: none; padding: 0;">
                                <li><strong>Trial No:</strong> ${trial_no}</li>
                                <li><strong>Part Name:</strong> ${part_name}</li>
                                <li><strong>Pattern Code:</strong> ${pattern_code}</li>
                            </ul>
                            <p style="margin-top: 20px;">Please log in to the system to view the details.</p>
                            <hr style="border: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 11px; color: #888;">This is an automated notification from SACL Digital Trial Card system.</p>
                        </div>
                    `
                });
            }
        }

        if (req.user.role !== 'Admin') {
            await updateDepartment(trial_id, req.user, trx, req.ip);
        }
    });

    res.status(200).json({ success: true, message: 'Trial updated successfully.' });
};

export const deleteTrialReports = async (req, res, next) => {
    const { trial_id } = req.body;

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided for deletion.' });
    }

    const sql = `UPDATE trial_reports SET deleted_at = GETDATE(), deleted_by = @username WHERE trial_id = @trial_id AND deleted_at IS NULL`;

    await Client.query(sql, { trial_id, username: req.user.username });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Trial report deleted',
        remarks: `Trial report soft deleted by ${req.user.username} (IP: ${req.ip}): ${trial_id}`
    });

    logger.info('Trial report deleted', { trial_id, deletedBy: req.user.username });

    res.status(200).json({ success: true, message: 'Trial report deleted successfully.' });
};

export const getDeletedTrialReports = async (req, res, next) => {
    const [rows] = await Client.query(`
        SELECT 
            tr.document_id, tr.file_name, tr.deleted_at, tr.deleted_by, 
            tc.trial_id, tc.trial_no, 
            m.part_name, m.pattern_code, 
            d.department_name AS department, 
            tc.current_department_id, tc.material_grade, tc.date_of_sampling, tc.status 
        FROM trial_cards tc 
        JOIN master_card m ON tc.master_card_id = m.id
        JOIN trial_reports tr ON tc.trial_id = tr.trial_id AND tr.deleted_at IS NOT NULL 
        LEFT JOIN departments d ON tc.current_department_id = d.department_id 
        WHERE tc.deleted_at IS NULL
    `);
    res.status(200).json({ success: true, data: rows });
};

export const getTrialReportFile = async (req, res, next) => {
    const { trial_id } = req.params;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }
    const [rows] = await Client.query("SELECT file_base64, file_name, document_type FROM trial_reports WHERE trial_id = @trial_id AND deleted_at IS NULL", { trial_id });
    if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Report file not found' });
    }
    res.status(200).json({ success: true, data: rows[0] });
};

export const deleteTrialCard = async (req, res, next) => {
    const { trial_id, pattern_code } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided.' });
    }

    const trialIds = Array.isArray(trial_id) ? trial_id : [trial_id];
    const patternCodes = Array.isArray(pattern_code) ? pattern_code : [pattern_code];

    if (trialIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No trial IDs provided.' });
    }

    await Client.transaction(async (trx) => {
        const masterCardIdsToRegenerate = new Set();

        for (const id of trialIds) {
            const [trialRows] = await trx.query('SELECT master_card_id FROM trial_cards WHERE trial_id = @trial_id', { trial_id: id });
            if (trialRows[0]) {
                masterCardIdsToRegenerate.add(trialRows[0].master_card_id);
            }

            const sql = `UPDATE trial_cards SET deleted_at = GETDATE(), deleted_by = @username WHERE trial_id = @trial_id AND deleted_at IS NULL`;
            await trx.query(sql, { trial_id: id, username: req.user.username });

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id: id,
                action: 'Trial card deleted',
                remarks: `Trial card ${id} soft deleted by ${req.user.username} (IP: ${req.ip}) (Bulk Delete)`
            });
        }

        for (const masterId of masterCardIdsToRegenerate) {
            await generateAndStoreConsolidatedReport(masterId, trx);
        }
    });

    logger.info('Trial cards soft deleted', { trialIds, deletedBy: req.user.username });
    res.status(200).json({ success: true, message: `${trialIds.length} trial card(s) deleted successfully.` });
};

export const getDeletedTrialCards = async (req, res, next) => {
    const sql = `
        SELECT 
            tc.trial_id, tc.trial_no, 
            m.part_name, m.pattern_code, 
            tc.material_grade, tc.date_of_sampling, tc.status, 
            tc.deleted_at, tc.deleted_by, 
            d.department_name AS department 
        FROM trial_cards tc 
        JOIN master_card m ON tc.master_card_id = m.id
        LEFT JOIN departments d ON tc.current_department_id = d.department_id 
        WHERE tc.deleted_at IS NOT NULL
    `;
    const [rows] = await Client.query(sql);
    res.status(200).json({ success: true, data: rows });
};

export const restoreTrialCard = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided.' });
    }

    await Client.transaction(async (trx) => {
        const sql = `UPDATE trial_cards SET deleted_at = NULL, deleted_by = NULL WHERE trial_id = @trial_id`;
        await trx.query(sql, { trial_id });

        const [master_result] = await trx.query(
            `SELECT master_card_id
             FROM trial_cards 
             WHERE trial_id = @trial_id`,
            { trial_id }
        );
        if (master_result && master_result.length > 0) {
            const masterId = master_result[0].master_card_id;
            await generateAndStoreConsolidatedReport(masterId, trx);
        }
    });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Trial card restored',
        remarks: `Trial card ${trial_id} restored by ${req.user.username} (IP: ${req.ip})`
    });

    logger.info('Trial card restored', { trial_id, restoredBy: req.user.username });
    res.status(200).json({ success: true, message: 'Trial card restored successfully.' });
};

export const permanentlyDeleteTrialCard = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided.' });
    }

    await Client.transaction(async (trx) => {
        await trx.query('DELETE FROM trial_cards WHERE trial_id = @trial_id AND deleted_at IS NOT NULL', { trial_id });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Trial card permanently deleted',
            remarks: `Trial card ${trial_id} permanently deleted by ${req.user.username} (IP: ${req.ip})`
        });
    });

    logger.info('Trial card permanently deleted', { trial_id, deletedBy: req.user.username });
    res.status(200).json({ success: true, message: 'Trial card permanently deleted.' });
};

export const restoreTrialReport = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided for restoration.' });
    }

    const sql = `UPDATE trial_reports SET deleted_at = NULL, deleted_by = NULL WHERE trial_id = @trial_id`;
    await Client.query(sql, { trial_id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Trial report restored',
        remarks: `Trial report restored by ${req.user.username} (IP: ${req.ip}): ${trial_id}`
    });

    logger.info('Trial report restored', { trial_id, restoredBy: req.user.username });
    res.status(200).json({ success: true, message: 'Trial report restored successfully.' });
};

export const permanentlyDeleteTrialReport = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided for permanent deletion.' });
    }

    const sql = `DELETE FROM trial_reports WHERE trial_id = @trial_id AND deleted_at IS NOT NULL`;
    await Client.query(sql, { trial_id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Trial report permanently deleted',
        remarks: `Trial report permanently deleted by ${req.user.username} (IP: ${req.ip}): ${trial_id}`
    });

    logger.info('Trial report permanently deleted', { trial_id, deletedBy: req.user.username });
    res.status(200).json({ success: true, message: 'Trial report permanently deleted.' });
};

export const getProgressingTrials = async (req, res, next) => {
    const sql = `
        SELECT 
            t.trial_id, t.trial_no, 
            m.part_name, m.pattern_code, 
            t.current_department_id,
            t.date_of_sampling, t.plan_moulds, t.disa, t.reason_for_sampling, 
            t.sample_traceability, t.trial_type
        FROM trial_cards t
        JOIN master_card m ON t.master_card_id = m.id
        WHERE t.status = 'IN_PROGRESS' AND t.deleted_at IS NULL
        AND NOT EXISTS (
            SELECT 1
            FROM department_progress dp
            WHERE dp.department_id = @department_id AND dp.approval_status = 'approved'
            AND dp.trial_id = t.trial_id
        );
    `;
    const [rows] = await Client.query(sql, { department_id: req.user.department_id });
    res.status(200).json({ success: true, data: rows });
};

export const getCavityNumbers = async (req, res, next) => {
    const { trial_id } = req.query;

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }

    try {
        const sql = `
            SELECT t.cavity_identification 
            FROM tooling_pattern_data t
            JOIN master_card m ON t.master_card_id = m.id
            JOIN trial_cards tc ON m.id = tc.master_card_id
            WHERE tc.trial_id = @trial_id
        `;

        const [rows] = await Client.query(sql, { trial_id });

        if (!rows || rows.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const cavityStr = rows[0].cavity_identification || '';
        const cavityNumbers = cavityStr.split(/[,\s;]+/).filter(item => item.trim() !== '');

        res.status(200).json({ success: true, data: cavityNumbers });
    } catch (error) {
        logger.error('Error fetching cavity numbers', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
