import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as pouringDetailsController from '../controllers/pouringDetails.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(pouringDetailsController.createPouringDetails));
router.put('/', verifyToken, asyncErrorHandler(pouringDetailsController.updatePouringDetails));
router.get('/', verifyToken, asyncErrorHandler(pouringDetailsController.getPouringDetails));
router.get('/trial_id', verifyToken, asyncErrorHandler(pouringDetailsController.getPouringDetailsByTrialId));

export default router;