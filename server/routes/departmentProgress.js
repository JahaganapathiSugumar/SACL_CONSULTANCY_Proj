import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as departmentProgressController from '../controllers/departmentProgress.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(departmentProgressController.createProgress));
router.put('/update-department', verifyToken, asyncErrorHandler(departmentProgressController.updateDepartment));
router.put('/update-role', verifyToken, asyncErrorHandler(departmentProgressController.updateRole));
router.put('/approve', verifyToken, asyncErrorHandler(departmentProgressController.approveProgress));
router.get('/get-progress', verifyToken, asyncErrorHandler(departmentProgressController.getProgress));
router.get('/get-completed-trials', verifyToken, asyncErrorHandler(departmentProgressController.getCompletedTrials));

export default router;