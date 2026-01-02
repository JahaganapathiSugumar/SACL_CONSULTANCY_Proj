import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as sandPropertiesController from '../controllers/sandProperties.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(sandPropertiesController.createSandProperties));
router.put('/', verifyToken, asyncErrorHandler(sandPropertiesController.updateSandProperties));
router.get('/', verifyToken, asyncErrorHandler(sandPropertiesController.getSandProperties));
router.get('/trial_id', verifyToken, asyncErrorHandler(sandPropertiesController.getSandPropertiesByTrialId));

export default router;