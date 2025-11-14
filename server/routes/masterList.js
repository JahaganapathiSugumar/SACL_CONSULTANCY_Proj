import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Pool from '../config/connection.js';
const router = express.Router();

router.get('/', asyncErrorHandler(async(req, res, next)=>{
    const response = await Pool.query(
        `SELECT * FROM master_card`
    )
    console.log(response[0]);
    res.status(200).json(response[0]);
}))

export default router;