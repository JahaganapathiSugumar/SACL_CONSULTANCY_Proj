import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as metallurgicalInspectionController from '../controllers/metallurgicalInspection.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(metallurgicalInspectionController.createInspection));
router.put('/', verifyToken, asyncErrorHandler(metallurgicalInspectionController.updateInspection));
router.get('/', verifyToken, asyncErrorHandler(metallurgicalInspectionController.getInspections));
router.get('/trial_id', verifyToken, asyncErrorHandler(metallurgicalInspectionController.getInspectionByTrialId));

export default router;