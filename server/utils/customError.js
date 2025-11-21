class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
        this.isOperational = true;
<<<<<<< HEAD

=======
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
        Error.captureStackTrace(this, this.constructor);
    }
}

export default CustomError;