import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as getAllDepartmentDataController from '../controllers/getAllDepartmentData.js';

const router = express.Router();

router.get('/', verifyToken, asyncErrorHandler(getAllDepartmentDataController.getAllData));

export default router;