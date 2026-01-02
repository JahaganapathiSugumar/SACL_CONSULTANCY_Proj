import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as mouldCorrectionController from '../controllers/mouldCorrection.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(mouldCorrectionController.createCorrection));
router.get('/', verifyToken, asyncErrorHandler(mouldCorrectionController.getCorrections));
router.get('/trial_id', verifyToken, asyncErrorHandler(mouldCorrectionController.getCorrectionByTrialId));

export default router;