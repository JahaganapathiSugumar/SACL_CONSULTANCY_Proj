import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';
import Client from '../config/connection.js';

const verifyToken = asyncErrorHandler(async(req, res, next) => {
    let token = req.get("Authorization");
    
    if(!token){
        const error = new CustomError("Token not found", 401);
        return next(error);
    }
    if (token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
    }
    
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return next(new CustomError("Invalid token", 401));
    }
    const response = await Client.query(
      'SELECT * FROM users WHERE username=$1 LIMIT 1',
      [decodedToken.username]
    );
    if(response.rowCount==0){
        const error = new CustomError('User not found. Invalid token.', 404);
        return next(error);
    }
    const {user_id, username, role_id, base_id} = response.rows[0];
    req.user = {user_id, username, role_id, base_id};
    next();
})

export default verifyToken;