const jwt = require('jsonwebtoken');
const PlatformUser = require('../models/PlatformUser');
const config = require('../config');

/** Platform console: valid platform JWT only. */
const requirePlatformAuth = async (req, res, next) => {
    let token;
    const platformHeader = req.headers['x-platform-auth'];
    if (platformHeader && platformHeader.startsWith('Bearer ')) {
        token = platformHeader.split(' ')[1];
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'Platform authentication required' });
    }
    const secret = config.platformJwtSecret || config.jwtSecret;
    try {
        const decoded = jwt.verify(token, secret);
        if (decoded.aud !== 'platform') {
            return res.status(401).json({ success: false, message: 'Invalid platform token' });
        }
        const platformUser = await PlatformUser.findById(decoded.id).select('email role isActive');
        if (!platformUser) {
            return res.status(401).json({ success: false, message: 'Platform user not found' });
        }
        if (!platformUser.isActive) {
            return res.status(401).json({ success: false, message: 'Platform account is deactivated' });
        }
        req.platformUser = platformUser;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

/** Tenant APIs: require X-Platform-Secret or Authorization Bearer matching PLATFORM_SHARED_SECRET. */
const requireSharedSecret = (req, res, next) => {
    const secret = config.platformSharedSecret;
    if (!secret) {
        return res.status(503).json({ success: false, message: 'Tenant API not configured' });
    }
    const provided = req.headers['x-platform-secret'] || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (provided !== secret) {
        return res.status(401).json({ success: false, message: 'Invalid or missing tenant app secret' });
    }
    next();
};

module.exports = { requirePlatformAuth, requireSharedSecret };
