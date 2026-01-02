import Client from '../config/connection.js';

async function test() {
    try {
        console.log("Starting verification...");

        // Let's check the schema of the documents table using a query.
        const [columns] = await Client.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'documents'
        `);
        console.log("Documents Table Schema:");
        columns.forEach(col => {
            console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });

        // Also check if there are ANY documents for the trial ID from the screenshot
        // trial_id=W601%20FRONT%20KNUCKLE-1 -> Decoded: W601 FRONT KNUCKLE-1
        const trialId = 'W601 FRONT KNUCKLE-1';
        const [docs] = await Client.query(
            `SELECT * FROM documents WHERE trial_id = @trialId`,
            { trialId }
        );
        console.log(`\nDocuments for '${trialId}':`, docs.length);
        if (docs.length > 0) {
            console.log("First doc uploaded_by:", docs[0].uploaded_by);
            console.log("First doc file_base64 prefix:", docs[0].file_base64 ? docs[0].file_base64.substring(0, 30) : "NULL");
        }

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

test();
