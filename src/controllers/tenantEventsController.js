/**
 * POST /api/tenant/events — tenant apps send usage events.
 * Auth: PLATFORM_SHARED_SECRET (X-Platform-Secret or Authorization: Bearer <secret>).
 * Body: { tenantId, type, delta?, meta? }
 * Types: USER_CREATED, USER_DELETED, LOCATION_CREATED, LOCATION_ARCHIVED, REPAIR_CREATED
 */
const TenantUsage = require('../models/TenantUsage');
const asyncHandler = require('../middleware/asyncHandler');

const EVENT_UPDATES = {
    USER_CREATED: { usersUsed: 1 },
    USER_DELETED: { usersUsed: -1 },
    LOCATION_CREATED: { locationsUsed: 1 },
    LOCATION_ARCHIVED: { locationsUsed: -1 },
    REPAIR_CREATED: { repairsThisMonthUsed: 1 }
};

exports.postEvent = asyncHandler(async (req, res) => {
    const { tenantId, type, delta = 1, meta } = req.body || {};
    if (!tenantId || !type) {
        return res.status(400).json({ success: false, message: 'tenantId and type are required' });
    }
    const update = EVENT_UPDATES[type];
    if (!update) {
        return res.status(400).json({ success: false, message: `Unknown event type: ${type}. Allowed: USER_CREATED, USER_DELETED, LOCATION_CREATED, LOCATION_ARCHIVED, REPAIR_CREATED` });
    }
    const now = new Date();
    const $inc = {};
    if (update.usersUsed !== undefined) $inc.usersUsed = (update.usersUsed > 0 ? delta : -Math.abs(delta)) || update.usersUsed;
    if (update.locationsUsed !== undefined) $inc.locationsUsed = (update.locationsUsed > 0 ? delta : -Math.abs(delta)) || update.locationsUsed;
    if (update.repairsThisMonthUsed !== undefined) $inc.repairsThisMonthUsed = (update.repairsThisMonthUsed > 0 ? delta : -Math.abs(delta)) || update.repairsThisMonthUsed;

    await TenantUsage.findOneAndUpdate(
        { tenantId: String(tenantId).trim() },
        { $inc, $set: { updatedAtUtc: now } },
        { upsert: true }
    );
    res.status(200).json({ success: true, message: 'Event recorded' });
});
