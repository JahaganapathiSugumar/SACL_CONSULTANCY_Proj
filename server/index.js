import express from 'express';
import cors from 'cors';
import Pool from './config/connection.js';
import dotenv from 'dotenv';
dotenv.config();

import CustomError from './utils/customError.js';
import masterListRoutes from './routes/masterList.js';
import authRoutes from './routes/login.js';
import usersRoutes from './routes/users.js';
import departmentsRoutes from './routes/departments.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: "*"
}));

// Routes
app.use('/api/master-list', masterListRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/login', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/departments', departmentsRoutes);

app.use('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error.stack);
    error.statusCode = error.statusCode || 500;
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV == 'production' ? {} : error
    });
});

// Database query helper function for MySQL
async function query(sql, params = []) {
    try {
        let formattedSql = sql;
        
        // Replace @parameter with ? for MySQL
        if (params.length > 0) {
            params.forEach((param, index) => {
                formattedSql = formattedSql.replace(`@${Object.keys(param)[0]}`, '?');
            });
        }
        
        const [results] = await Pool.execute(formattedSql, params.map(p => Object.values(p)[0]));
        return results;
    } catch (err) {
        console.error('Database query error:', err);
        throw err;
    }
}

// Export the query function for use in other files
export { query };

const port = process.env.PORT || 3000;

app.listen(port, 'localhost', async () => {
    try {
        const res = await query('SELECT NOW()');
        // mysql2 returns rows in different shapes depending on query; log first value
        console.log('MySQL Database connected at:', res[0]);
    } catch (err) {
        console.error('Database connection error:', err);
    }
    console.log(`Server is listening on port ${port}`);
});