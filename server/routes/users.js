import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import authorizeRoles from '../utils/authorizeRoles.js';
import * as usersController from '../controllers/users.js';

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(usersController.getAllUsers));
router.post('/', verifyToken, asyncErrorHandler(usersController.createUser));
router.post('/send-otp', verifyToken, asyncErrorHandler(usersController.sendOtp));
router.post('/verify-otp', verifyToken, asyncErrorHandler(usersController.verifyOtp));
router.post('/change-password', verifyToken, asyncErrorHandler(usersController.changePassword));
router.put('/change-status', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(usersController.changeStatus));

export default router;