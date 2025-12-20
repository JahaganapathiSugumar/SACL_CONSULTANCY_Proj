import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

router.get('/dashboard', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { role, username, department_id } = req.query;
    const userId = req.user.user_id;
    const userDepartmentId = req.user.department_id;

    let stats = [];

    if (role === 'Admin') {
        const [totalUsersResult] = await Client.query(
            `SELECT COUNT(*) as count FROM users WHERE is_active = 1`
        );
        const totalUsers = totalUsersResult[0].count;

        const [totalTrialsResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log WHERE action = 'Trial created' AND trial_id IS NOT NULL`
        );
        const totalTrials = totalTrialsResult[0].count;

        const [ongoingResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE trial_id IS NOT NULL 
             AND trial_id NOT IN (
                SELECT DISTINCT trial_id FROM audit_log 
                WHERE action = 'Department progress approved' 
                AND trial_id IS NOT NULL
             )`
        );
        const ongoing = ongoingResult[0].count;

        const [pendingTasksResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE action = 'Department progress updated' 
             AND trial_id IS NOT NULL
             AND trial_id NOT IN (
                SELECT DISTINCT trial_id FROM audit_log 
                WHERE action = 'Department progress approved' 
                AND trial_id IS NOT NULL
             )`
        );
        const pendingTasks = pendingTasksResult[0].count;

        stats = [
            { label: 'Total Users', value: totalUsers.toString(), color: '#007bff', description: 'System users' },
            { label: 'Total Trials', value: totalTrials.toString(), color: '#28a745', description: 'All trials created' },
            { label: 'Ongoing Trials', value: ongoing.toString(), color: '#20c997', description: 'Not yet approved' },
            { label: 'Pending Tasks', value: pendingTasks.toString(), color: '#ffc107', description: 'Awaiting action' }
        ];
    }
    else if (role === 'Methods') {
        const [processReviewsResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE department_id = ? AND trial_id IS NOT NULL`,
            [userDepartmentId]
        );
        const processReviews = processReviewsResult[0].count;

        const [ongoingResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE department_id = ? 
             AND trial_id IS NOT NULL
             AND trial_id NOT IN (
                SELECT DISTINCT trial_id FROM audit_log 
                WHERE department_id = ? 
                AND action = 'Department progress approved' 
                AND trial_id IS NOT NULL
             )`,
            [userDepartmentId, userDepartmentId]
        );
        const ongoing = ongoingResult[0].count;

        const [teamMembersResult] = await Client.query(
            `SELECT COUNT(*) as count FROM users WHERE department_id = ? AND is_active = 1`,
            [userDepartmentId]
        );
        const teamMembers = teamMembersResult[0].count;

        const [completedResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE department_id = ? 
             AND action = 'Department progress approved' 
             AND trial_id IS NOT NULL`,
            [userDepartmentId]
        );
        const completed = completedResult[0].count;

        stats = [
            { label: 'Process Reviews', value: processReviews.toString(), color: '#007bff', description: 'Total trials in department' },
            { label: 'Completed Trials', value: completed.toString(), color: '#28a745', description: 'Approved trials' },
            { label: 'Ongoing Trials', value: ongoing.toString(), color: '#20c997', description: 'Not yet approved' },
            { label: 'Team Members', value: teamMembers.toString(), color: '#6f42c1', description: 'Methods team' }
        ];
    }
    else if (role === 'HOD') {
        const [deptTrialsResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE department_id = ? AND trial_id IS NOT NULL`,
            [userDepartmentId]
        );
        const deptTrials = deptTrialsResult[0].count;

        const [pendingReviewResult] = await Client.query(
            `SELECT COUNT(*) as count FROM department_progress WHERE department_id = ? AND approval_status = 'pending'`,
            [userDepartmentId]
        );
        const pendingReview = pendingReviewResult[0].count;

        const [approvedResult] = await Client.query(
            `SELECT COUNT(*) as count FROM department_progress WHERE department_id = ? AND approval_status = 'approved'`,
            [userDepartmentId]
        );
        const approved = approvedResult[0].count;

        stats = [
            { label: 'Department Ideas', value: deptTrials.toString(), color: '#007bff', description: 'Total ideas submitted' },
            { label: 'Pending Review', value: pendingReview.toString(), color: '#ffc107', description: 'Awaiting approval' },
            { label: 'Approved', value: approved.toString(), color: '#28a745', description: 'Implemented ideas' }
        ];
    }
    else if (role === 'User') {
        const [myTasksResult] = await Client.query(
            `SELECT COUNT(*) as count FROM department_progress WHERE username = ? AND approval_status = 'pending'`,
            [username]
        );
        const myTasks = myTasksResult[0].count;

        const [completedResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE user_id = ? AND action = 'Department progress approved'`,
            [userId]
        );
        const completed = completedResult[0].count;

        const pending = myTasks;

        stats = [
            { label: 'My Tasks', value: myTasks.toString(), color: '#007bff', description: 'Assigned tasks' },
            { label: 'Completed', value: completed.toString(), color: '#28a745', description: 'Finished tasks' },
            { label: 'Pending', value: pending.toString(), color: '#ffc107', description: 'Awaiting review' }
        ];
    }

    if (req.query.statsType === 'admin_trials') {
        const [totalTrialsResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log WHERE action = 'Trial created' AND trial_id IS NOT NULL`
        );
        const totalTrials = totalTrialsResult[0].count;

        const [ongoingResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE trial_id IS NOT NULL 
             AND trial_id NOT IN (
                SELECT DISTINCT trial_id FROM audit_log 
                WHERE action = 'Department progress approved' 
                AND trial_id IS NOT NULL
             )`
        );
        const ongoing = ongoingResult[0].count;

        const [approvedResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE action = 'Department progress approved' AND trial_id IS NOT NULL`
        );
        const approved = approvedResult[0].count;

        stats = [
            { label: 'Total Trials', value: totalTrials.toString(), color: '#007bff' },
            { label: 'Ongoing', value: ongoing.toString(), color: '#17a2b8' },
            { label: 'Approved', value: approved.toString(), color: '#28a745' }
        ];
    }

    if (req.query.statsType === 'methods_dashboard') {
        const [processReviewsResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE department_id = ? AND trial_id IS NOT NULL`,
            [userDepartmentId]
        );
        const processReviews = processReviewsResult[0].count;

        const [ongoingResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE department_id = ? 
             AND trial_id IS NOT NULL
             AND trial_id NOT IN (
                SELECT DISTINCT trial_id FROM audit_log 
                WHERE department_id = ? 
                AND action = 'Department progress approved' 
                AND trial_id IS NOT NULL
             )`,
            [userDepartmentId, userDepartmentId]
        );
        const ongoing = ongoingResult[0].count;

        const [completedResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM audit_log 
             WHERE department_id = ? 
             AND action = 'Department progress approved' 
             AND trial_id IS NOT NULL`,
            [userDepartmentId]
        );
        const completed = completedResult[0].count;

        const [teamMembersResult] = await Client.query(
            `SELECT COUNT(*) as count FROM users WHERE department_id = ? AND is_active = 1`,
            [userDepartmentId]
        );
        const teamMembers = teamMembersResult[0].count;

        const activeProjects = ongoing;

        stats = [
            { label: 'Process Reviews', value: processReviews.toString(), color: '#007bff', description: 'Total trials in department' },
            { label: 'Completed Trials', value: completed.toString(), color: '#28a745', description: 'Approved trials' },
            { label: 'Team Members', value: teamMembers.toString(), color: '#6f42c1', description: 'Methods team' },
            { label: 'Active Projects', value: activeProjects.toString(), color: '#fd7e14', description: 'In progress' }
        ];
    }

    res.status(200).json({
        success: true,
        data: { stats }
    });
}));

export default router;
