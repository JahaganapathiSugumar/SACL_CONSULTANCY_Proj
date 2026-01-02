import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as visualInspectionController from '../controllers/visualInspection.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(visualInspectionController.createInspection));
router.put('/', verifyToken, asyncErrorHandler(visualInspectionController.updateInspection));
router.get('/', verifyToken, asyncErrorHandler(visualInspectionController.getInspections));
router.get('/trial_id', verifyToken, asyncErrorHandler(visualInspectionController.getInspectionByTrialId));

export default router;