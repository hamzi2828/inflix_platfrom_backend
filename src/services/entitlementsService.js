/**
 * Entitlements from plan + overrides. Usage from TenantUsage (master DB).
 */
const FeatureCatalog = require('../models/FeatureCatalog');
const LimitCatalog = require('../models/LimitCatalog');
const PlanCatalog = require('../models/PlanCatalog');
const TenantSubscription = require('../models/TenantSubscription');
const TenantUsage = require('../models/TenantUsage');

function mapToObject(m) {
    if (!m) return {};
    if (typeof m.toObject === 'function') m = m.toObject();
    if (m instanceof Map) return Object.fromEntries(m);
    if (typeof m === 'object' && m !== null) return m;
    return {};
}

async function getEntitlements(tenantId) {
    const tid = tenantId || 'default';
    const [subscription, featureCatalog, limitCatalog] = await Promise.all([
        TenantSubscription.findOne({ tenantId: tid }).lean(),
        FeatureCatalog.find({ isActive: true }).select('key defaultEnabled').lean(),
        LimitCatalog.find({ isActive: true }).select('key defaultValue').lean()
    ]);
    const planKey = subscription?.planKey || 'starter';
    const planDoc = await PlanCatalog.findOne({ planKey, isActive: true }).lean();
    const planFeatures = mapToObject(planDoc?.features);
    const planLimits = mapToObject(planDoc?.limits);
    const overrideFeatures = mapToObject(subscription?.overrides?.features);
    const overrideLimits = mapToObject(subscription?.overrides?.limits);

    const enabledFeatures = {};
    featureCatalog.forEach((f) => {
        if (overrideFeatures[f.key] !== undefined) {
            enabledFeatures[f.key] = !!overrideFeatures[f.key];
        } else if (planFeatures[f.key] !== undefined) {
            enabledFeatures[f.key] = !!planFeatures[f.key];
        } else {
            enabledFeatures[f.key] = !!f.defaultEnabled;
        }
    });

    const limits = {};
    limitCatalog.forEach((l) => {
        if (overrideLimits[l.key] !== undefined && overrideLimits[l.key] !== null) {
            const v = overrideLimits[l.key];
            limits[l.key] = typeof v === 'number' ? v : null;
        } else if (planLimits[l.key] !== undefined && planLimits[l.key] !== null) {
            const v = planLimits[l.key];
            limits[l.key] = typeof v === 'number' ? v : null;
        } else {
            limits[l.key] = l.defaultValue != null ? Number(l.defaultValue) : null;
        }
    });

    return { enabledFeatures, limits, planKey };
}

async function getUsage(tenantId) {
    const tid = tenantId || 'default';
    const usage = await TenantUsage.findOne({ tenantId: tid }).lean();
    if (!usage) {
        return { maxUsers: 0, maxLocations: 0, maxRepairsPerMonth: 0 };
    }
    return {
        maxUsers: usage.usersUsed ?? 0,
        maxLocations: usage.locationsUsed ?? 0,
        maxRepairsPerMonth: usage.repairsThisMonthUsed ?? 0
    };
}

module.exports = {
    getEntitlements,
    getUsage,
    mapToObject
};
