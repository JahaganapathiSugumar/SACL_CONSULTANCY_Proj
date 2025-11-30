import CustomError from "../utils/customError.js";

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const role_id = req.user?.role_id;
        if(!roles.includes(role_id)){
            const error = new CustomError('Access Denied', 403);
            return next(error);
        }
        next();
    }
}

export default authorizeRoles;