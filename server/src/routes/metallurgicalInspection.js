import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as metallurgicalInspectionController from '../controllers/metallurgicalInspection.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 9), asyncErrorHandler(metallurgicalInspectionController.createInspection));
router.put('/', verifyToken, authorizeDepartments(1, 9), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(metallurgicalInspectionController.updateInspection));
router.get('/', verifyToken, asyncErrorHandler(metallurgicalInspectionController.getInspections));
router.get('/trial_id', verifyToken, asyncErrorHandler(metallurgicalInspectionController.getInspectionByTrialId));

export default router;