const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    const message = err.message || 'Something went wrong';
    // if (statusCode == 500) {
    //     console.log(err);
    //     res.status(500).json({
    //         message: 'Internal server error',
    //         stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    //     });
    // } else {
    //     console.log(err);
    //     res.status(statusCode).json({
    //         message: message,
    //         stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    //     });
    // }
    console.log(err);

    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };
