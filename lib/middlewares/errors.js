
const errors = (error, req, res, next) => {
    const status = error.status || 500;
    res.status(status);
    res.json({
        error: {
            code: status,
            message: error.message,
            details: error.details
        }
    });
    next({ error, status, req, res });
};

module.exports = errors;
