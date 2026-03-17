/**
 * GET /api/tenant/entitlements — tenant apps get plan + features + limits + usage + status + billing (read-only).
 * Auth: tenant app secret (X-Platform-Secret or Authorization: Bearer PLATFORM_SHARED_SECRET).
 * Query: tenantId=xxx (or X-Tenant-Id header).
 * Includes tenant status and billing/subscription so POS billing page matches platform tenant detail.
 */
const Tenant = require('../models/Tenant');
const TenantSubscription = require('../models/TenantSubscription');
const entitlementsService = require('../services/entitlementsService');
const asyncHandler = require('../middleware/asyncHandler');

exports.getEntitlements = asyncHandler(async (req, res) => {
    const tenantId = req.query.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'tenantId required (query or X-Tenant-Id header)' });
    }
    const [entitlements, usage, tenant, subscription] = await Promise.all([
        entitlementsService.getEntitlements(tenantId),
        entitlementsService.getUsage(tenantId),
        Tenant.findOne({ tenantId }).select('status billingAmount billingCycle currency billingEmail billingAddress').lean(),
        TenantSubscription.findOne({ tenantId }).select('startDate expireDate').lean()
    ]);
    const status = (tenant && tenant.status === 'suspended') ? 'suspended' : 'active';
    res.status(200).json({
        success: true,
        data: {
            planKey: entitlements.planKey,
            enabledFeatures: entitlements.enabledFeatures,
            limits: entitlements.limits,
            usage,
            status,
            billingAmount: tenant?.billingAmount ?? null,
            billingCycle: tenant?.billingCycle ?? 'monthly',
            currency: tenant?.currency ?? 'GBP',
            billingEmail: tenant?.billingEmail ?? '',
            billingAddress: tenant?.billingAddress ?? '',
            startDate: subscription?.startDate ?? null,
            expireDate: subscription?.expireDate ?? null
        }
    });
});
