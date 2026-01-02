import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as mechanicalPropertiesController from '../controllers/mechanicalProperties.js';

const router = express.Router();

router.get('/by-trial', verifyToken, asyncErrorHandler(mechanicalPropertiesController.getByTrialId));
router.post('/', verifyToken, asyncErrorHandler(mechanicalPropertiesController.createProperties));
router.put('/', verifyToken, asyncErrorHandler(mechanicalPropertiesController.updateProperties));

export default router;