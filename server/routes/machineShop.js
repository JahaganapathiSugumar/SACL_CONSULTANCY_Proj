import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as machineShopController from '../controllers/machineShop.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(machineShopController.createMachineShop));
router.put('/', verifyToken, asyncErrorHandler(machineShopController.updateMachineShop));
router.get('/', verifyToken, asyncErrorHandler(machineShopController.getMachineShops));
router.get('/trial_id', verifyToken, asyncErrorHandler(machineShopController.getMachineShopByTrialId));

export default router;