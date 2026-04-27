import sql from "mssql/msnodesqlv8.js";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import CustomError from '../utils/customError.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const serverString = process.env.DB_SERVER || 'localhost';

const config = {
  driver: 'msnodesqlv8',
  connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${serverString};Database=${process.env.DB_DATABASE};Trusted_Connection=Yes;Encrypt=Yes;TrustServerCertificate=Yes;`,
  options: {
    useUTC: false
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    logger.info('Connected to SQL Server successfully!');
    return pool;
  })
  .catch(err => {
    logger.error('Database Connection Failed:', err);
    throw err;
  });

const prepareRequest = (request, params = {}) => {
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value === undefined ? null : value);
    }
  }
};

const client = {
  query: async (sqlText, params = {}) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      prepareRequest(request, params);

      const result = await request.query(sqlText);
      return [result.recordset || result.rowsAffected, result.output];
    } catch (error) {
      logger.error('SQL Execution Error:', error);
      throw new CustomError(error);
    }
  },

  transaction: async (callback) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const trx = {
        query: async (sqlText, params = {}) => {
          const request = new sql.Request(transaction);
          prepareRequest(request, params);
          const result = await request.query(sqlText);
          return [result.recordset || result.rowsAffected, result.output];
        }
      };

      const result = await callback(trx);

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error('Transaction Rolled Back:', error);
      throw new CustomError(error);
    }
  }
};

client.execute = client.query;

export default client;