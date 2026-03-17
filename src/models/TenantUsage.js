/**
 * Centralised usage per tenant (master DB only).
 * Updated by POST /api/tenant/events from tenant apps.
 */
const mongoose = require('mongoose');

const tenantUsageSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: [128]
    },
    usersUsed: { type: Number, default: 0 },
    locationsUsed: { type: Number, default: 0 },
    repairsThisMonthUsed: { type: Number, default: 0 },
    updatedAtUtc: { type: Date, default: Date.now }
}, { timestamps: false, collection: 'tenant_usage' });

tenantUsageSchema.index({ tenantId: 1 });

module.exports = mongoose.model('TenantUsage', tenantUsageSchema);
