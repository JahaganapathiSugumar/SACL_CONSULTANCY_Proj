import express from 'express';
import cors from 'cors';
import Pool from './config/connection.js';
import dotenv from 'dotenv';
dotenv.config();

// Routes
import masterListRoutes from './routes/masterList.js';
import authRoutes from './routes/login.js';
import trialNovemberRoutes from './routes/trial_november.js';
import usersRoutes from './routes/users.js';
import departmentsRoutes from './routes/departments.js';
import trial from './routes/trial.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: "*"
}));

// Register API Routes
app.use('/api/master-list', masterListRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/login', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/trial-november', trialNovemberRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/trial', trial);

// Health check
app.use('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error(error.stack);
    error.statusCode = error.statusCode || 500;
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'production' ? {} : error
    });
});

// MySQL Query Helper
async function query(sql, params = []) {
    try {
        const [results] = await Pool.execute(sql, params);
        return results;
    } catch (err) {
        console.error("Database query error:", err);
        throw err;
    }
}

export { query };

// Start Server
const port = process.env.PORT || 3000;

app.listen(port, 'localhost', async () => {
    try {
        const res = await query('SELECT NOW()');
        console.log('MySQL Database connected at:', res[0]);
    } catch (err) {
        console.error('Database connection error:', err);
    }
    console.log(`Server is listening on port ${port}`);
});
