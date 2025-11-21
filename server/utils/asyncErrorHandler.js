<<<<<<< HEAD
const asyncErrorHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

export default asyncErrorHandler;
=======
export default (func) => {
    return (req, res, next) => {
        func(req, res, next).catch(err => next(err));
    }
}
>>>>>>> 34cd5aa040aa847d79734b64fa1ffaf348004030
