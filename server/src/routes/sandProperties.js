import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as sandPropertiesController from '../controllers/sandProperties.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import validateTrial from '../middlewares/validateTrial.js';
import { validate } from '../middlewares/validate.js';
import { sandPropertiesSchema, updateSandPropertiesSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', verifyToken, validateTrial, authorizeDepartments(1, 4), validate(sandPropertiesSchema), asyncErrorHandler(sandPropertiesController.createSandProperties));
router.put('/', verifyToken, validateTrial, authorizeDepartments(1, 4), validate(updateSandPropertiesSchema), asyncErrorHandler(sandPropertiesController.updateSandProperties));
router.get('/', verifyToken, asyncErrorHandler(sandPropertiesController.getSandProperties));
router.get('/trial_id', verifyToken, asyncErrorHandler(sandPropertiesController.getSandPropertiesByTrialId));

export default router;