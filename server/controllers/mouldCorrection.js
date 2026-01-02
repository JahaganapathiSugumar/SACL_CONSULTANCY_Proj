import Client from '../config/connection.js';

export const createCorrection = async (req, res, next) => {
    const { trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks, date } = req.body || {};
    if (!trial_id || !mould_thickness || !compressability || !squeeze_pressure || !mould_hardness || !remarks || !date) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO mould_correction (trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks, date) VALUES (@trial_id, @mould_thickness, @compressability, @squeeze_pressure, @mould_hardness, @remarks, @date)';
    await Client.query(sql, { trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks, date });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Mould correction created',
        remarks: `Mould correction ${trial_id} created by ${req.user.username} with trial id ${trial_id}`
    });
    res.status(201).json({ success: true, message: 'Mould correction created successfully.' });
};

export const getCorrections = async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM mould_correction');
    res.status(200).json({ success: true, data: rows });
};

export const getCorrectionByTrialId = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM mould_correction WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
};
