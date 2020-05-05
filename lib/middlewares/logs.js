
const logger = () => (req, res, next) => {
    // console.log(`request arrived for ${req.method} ${req.originalUrl}`);
    return next();
};

module.exports = logger;
