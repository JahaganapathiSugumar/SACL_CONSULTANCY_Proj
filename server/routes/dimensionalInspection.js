import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as dimensionalInspectionController from '../controllers/dimensionalInspection.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(dimensionalInspectionController.createInspection));
router.put('/', verifyToken, asyncErrorHandler(dimensionalInspectionController.updateInspection));
router.get('/', verifyToken, asyncErrorHandler(dimensionalInspectionController.getInspections));
router.get('/trial_id', verifyToken, asyncErrorHandler(dimensionalInspectionController.getInspectionByTrialId));

export default router;