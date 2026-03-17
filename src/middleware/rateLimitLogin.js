const rateLimit = require('express-rate-limit');

/** 5 attempts per minute per IP for platform login to reduce brute force */
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many login attempts. Try again in a minute.' },
    standardHeaders: true
});

module.exports = { loginLimiter };
