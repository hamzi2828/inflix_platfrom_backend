/**
 * Tenant-facing APIs: entitlements (read-only) and usage events.
 * Auth: PLATFORM_SHARED_SECRET, not platform login.
 */
const express = require('express');
const router = express.Router();
const { requireSharedSecret } = require('../middleware/auth');
const tenantEntitlementsController = require('../controllers/tenantEntitlementsController');
const tenantEventsController = require('../controllers/tenantEventsController');

router.use(requireSharedSecret);

router.get('/entitlements', tenantEntitlementsController.getEntitlements);
router.post('/events', tenantEventsController.postEvent);

module.exports = router;
