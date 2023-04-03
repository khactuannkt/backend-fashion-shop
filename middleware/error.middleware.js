const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    const message = err.message || 'Something went wrong';
    if (statusCode == 500) {
        console.log(err.stack);
        res.status(500).json({
            message: 'Internal server error',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    } else {
        res.status(statusCode).json({
            message: message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }
};

export { notFound, errorHandler };
