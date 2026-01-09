import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as materialCorrectionController from '../controllers/materialCorrection.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(materialCorrectionController.createMaterialCorrection));
router.put('/', verifyToken, asyncErrorHandler(materialCorrectionController.updateMaterialCorrection));
router.get('/', verifyToken, asyncErrorHandler(materialCorrectionController.getMaterialCorrections));
router.get('/trial_id', verifyToken, asyncErrorHandler(materialCorrectionController.getMaterialCorrectionByTrialId));

export default router;