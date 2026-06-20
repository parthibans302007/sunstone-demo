const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    // Handle specific DB errors gracefully
    if (!statusCode) {
        if (err.name === 'ValidationError') {
            statusCode = 400;
            message = Object.values(err.errors).map(val => val.message).join(', ');
        } else if (err.name === 'CastError') {
            statusCode = 400;
            message = `Invalid field path: ${err.path}`;
        } else if (err.code === 11000) {
            statusCode = 400;
            message = `${Object.keys(err.keyValue).join(', ')} already exists`;
        } else {
            statusCode = 500;
            message = err.message || 'Internal Server Error';
        }
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = errorHandler;
