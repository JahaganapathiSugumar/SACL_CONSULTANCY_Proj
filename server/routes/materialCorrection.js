import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import { createMaterialCorrection, updateMaterialCorrection, getMaterialCorrections, getMaterialCorrectionByTrialId } from '../controllers/materialCorrection.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(createMaterialCorrection));
router.put('/', verifyToken, asyncErrorHandler(updateMaterialCorrection));
router.get('/', verifyToken, asyncErrorHandler(getMaterialCorrections));
router.get('/trial_id', verifyToken, asyncErrorHandler(getMaterialCorrectionByTrialId));

export default router;