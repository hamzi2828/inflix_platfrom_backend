const express = require('express');
const router = express.Router();
const platformAuthRoutes = require('./platformAuthRoutes');
const platformRoutes = require('./platformRoutes');
const tenantRoutes = require('./tenantRoutes');

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Inflix Platform API',
        endpoints: {
            platformAuth: '/api/platform-auth',
            platform: '/api/platform',
            tenant: '/api/tenant (entitlements, events)'
        }
    });
});

router.use('/platform-auth', platformAuthRoutes);
router.use('/platform', platformRoutes);
router.use('/tenant', tenantRoutes);

module.exports = router;
