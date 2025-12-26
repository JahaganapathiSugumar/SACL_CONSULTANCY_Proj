import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  connectionTimeout: 30000
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server successfully!');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed:', err);
    throw err;
  });

const client = {
  query: async (sqlText, params = []) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      let paramIndex = 0;
      const safeParams = Array.isArray(params) ? params : [params];

      let transformedSql = sqlText.replace(/\?/g, () => {
        const pName = `p${paramIndex}`;
        let val = safeParams[paramIndex];
        request.input(pName, val === undefined ? null : val);
        paramIndex++;
        return `@${pName}`;
      });

      // If it's an INSERT, we might need the ID.
      // A simple way to get it is SCOPE_IDENTITY()
      const isInsert = transformedSql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert) {
        transformedSql += '; SELECT SCOPE_IDENTITY() AS insertId;';
      }

      const result = await request.query(transformedSql);

      // Mimic MySQL ResultSetHeader for non-SELECT queries
      const resultSetHeader = {
        affectedRows: result.rowsAffected[0],
        insertId: isInsert && result.recordset ? result.recordset[0].insertId : null,
        warningStatus: 0,
      };

      // If it's an INSERT with SCOPE_IDENTITY, the primary recordset is the dummy one.
      // We should return the header as the first element if it's not a SELECT.
      // But routes expect [rows] for SELECT and [result] for INSERT.
      if (transformedSql.trim().toUpperCase().startsWith('SELECT')) {
        return [result.recordset, result.output];
      } else {
        return [resultSetHeader, result.output];
      }
    } catch (error) {
      console.error('SQL Execution Error:', error);
      throw error;
    }
  }
};

client.execute = client.query;

export default client;