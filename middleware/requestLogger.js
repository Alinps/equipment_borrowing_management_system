const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {

    const start = Date.now();

    res.on('finish', () => {

        logger.info('API Request', {

            method: req.method,

            endpoint: req.originalUrl,

            statusCode: res.statusCode,

            duration: Date.now() - start,

            userId: req.user?._id || null,

            ip: req.ip

        });

    });

    next();

};

module.exports = requestLogger;