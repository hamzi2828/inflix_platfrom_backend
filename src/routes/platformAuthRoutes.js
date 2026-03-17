const express = require('express');
const router = express.Router();
const { requirePlatformAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimitLogin');
const platformAuthController = require('../controllers/platformAuthController');

router.post('/login', loginLimiter, platformAuthController.login);
router.post('/logout', requirePlatformAuth, platformAuthController.logout);
router.get('/me', requirePlatformAuth, platformAuthController.me);

module.exports = router;
