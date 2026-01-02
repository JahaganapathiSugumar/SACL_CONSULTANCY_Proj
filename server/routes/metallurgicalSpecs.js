import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as metallurgicalSpecsController from '../controllers/metallurgicalSpecs.js';

const router = express.Router();

router.get('/by-trial', verifyToken, asyncErrorHandler(metallurgicalSpecsController.getSpecsByTrial));
router.post('/', verifyToken, asyncErrorHandler(metallurgicalSpecsController.createSpecs));
router.put('/', verifyToken, asyncErrorHandler(metallurgicalSpecsController.updateSpecs));

export default router;