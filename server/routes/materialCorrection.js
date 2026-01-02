import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as materialCorrectionController from '../controllers/materialCorrection.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(materialCorrectionController.createCorrection));
router.put('/', verifyToken, asyncErrorHandler(materialCorrectionController.updateCorrection));
router.get('/', verifyToken, asyncErrorHandler(materialCorrectionController.getCorrections));
router.get('/trial_id', verifyToken, asyncErrorHandler(materialCorrectionController.getCorrectionByTrialId));

export default router;