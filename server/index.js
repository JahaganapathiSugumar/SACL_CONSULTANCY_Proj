import express from 'express';
import cors from 'cors';
<<<<<<< HEAD
import Pool from './config/connection.js';
=======
import Client from './config/connection.js';
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
import dotenv from 'dotenv';
dotenv.config();

import CustomError from './utils/customError.js';
import masterListRoutes from './routes/masterList.js';
<<<<<<< HEAD
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
=======
import userRoutes from './routes/users.js';
import loginRoutes from './routes/login.js';
import departmentRoutes from './routes/departments.js';
import trial from './routes/trial.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(cors({
    origin: "*"
}))

app.use('/api/master-list', masterListRoutes);
app.use('/api/users', userRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/trial', trial);
app.use('/health', (req, res) => {
    res.status(200).json({status: 'OK'});
});
// app.all('*', (req, res, next)=>{
//     const err = new CustomError(`Can't find the ${req.originalUrl} on the server!`, 404);
//     next(err);
// });

>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
app.use((error, req, res, next) => {
    console.error(error.stack);
    error.statusCode = error.statusCode || 500;
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
<<<<<<< HEAD
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
=======
        error: process.env.NODE_ENV == 'production'?{}:error
    });
});

async function query(arg){
    try {
        const res = await Client.query(arg);
        return res;
    } catch (err) {
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
        throw err;
    }
}

<<<<<<< HEAD
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
=======
const port = process.env.PORT || 3000;

app.listen(port, 'localhost', async ()=>{
    try {
        const res = await query('SELECT NOW()');
        console.log(res[0]);
    } catch (err) {
        console.error(`${err}`);
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
    }
    console.log(`Server is listening on port ${port}`);
});