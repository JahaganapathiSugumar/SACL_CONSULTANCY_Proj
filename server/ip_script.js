import client from './src/config/connection.js';

const trial_id = 2054;
const department_id = 8;

async function fetchAuditLog() {
    try {
        console.log(`Fetching audit logs for Trial ID: ${trial_id}, Dept ID: ${department_id}...`);
        const [rows] = await client.query(
            'SELECT * FROM audit_log WHERE trial_id = @trial_id',
            { trial_id }
        );

        if (rows && rows.length > 0) {
            console.table(rows);
        } else {
            console.log('No audit logs found for the given criteria.');
        }
    } catch (error) {
        console.error('Error fetching audit log:', error);
    } finally {
        process.exit();
    }
}

fetchAuditLog();
