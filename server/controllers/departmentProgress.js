import Client from '../config/connection.js';

export const getProgress = async (req, res, next) => {
    const username = req.query.username;
    const [result] = await Client.query(
        `SELECT department_progress.*, departments.department_name, t.part_name, t.pattern_code, t.disa, t.date_of_sampling FROM department_progress 
         JOIN departments ON department_progress.department_id = departments.department_id 
         JOIN trial_cards t ON department_progress.trial_id = t.trial_id 
         WHERE department_progress.username = @username AND department_progress.approval_status = 'pending'`,
        { username }
    );
    res.status(200).json({
        success: true,
        data: result
    });
};

export const getCompletedTrials = async (req, res, next) => {
    const [result] = await Client.query(
        `SELECT DISTINCT 
            a.trial_id,
            a.department_id,
            a.action_timestamp as completed_at,
            a.remarks,
            d.department_name,
            t.part_name,
            t.pattern_code,
            t.disa,
            t.date_of_sampling,
            t.status
         FROM audit_log a
         JOIN trial_cards t ON a.trial_id = t.trial_id
         JOIN departments d ON a.department_id = d.department_id
         WHERE a.department_id = @department_id 
         AND (a.action = 'Department progress approved' OR a.action = 'Department progress completed')
         AND a.trial_id IS NOT NULL
         ORDER BY a.action_timestamp DESC`,
        { department_id: req.user.department_id }
    );

    res.status(200).json({
        success: true,
        data: result
    });
};

export const getProgressByTrialId = async (req, res, next) => {
    const trial_id = req.query.trial_id;
    const [result] = await Client.query(
        `SELECT dp.*, d.department_name FROM department_progress dp JOIN departments d ON dp.department_id = d.department_id WHERE dp.trial_id = @trial_id AND dp.approval_status = 'approved';`,
        { trial_id }
    );
    res.status(200).json({
        success: true,
        data: result
    });
};
