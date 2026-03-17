const mongoose = require('mongoose');

const tenantSubscriptionSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: [128]
    },
    planKey: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        default: 'starter',
        maxlength: [64]
    },
    overrides: {
        features: { type: Map, of: Boolean, default: () => new Map() },
        limits: { type: Map, of: mongoose.Schema.Types.Mixed, default: () => new Map() }
    },
    startDate: { type: Date, default: null },
    expireDate: { type: Date, default: null },
    createdAtUtc: { type: Date, default: Date.now },
    updatedAtUtc: { type: Date, default: Date.now }
}, { timestamps: false, collection: 'tenant_subscriptions' });

tenantSubscriptionSchema.index({ planKey: 1 });
tenantSubscriptionSchema.pre('save', function (next) {
    this.updatedAtUtc = new Date();
    next();
});

module.exports = mongoose.model('TenantSubscription', tenantSubscriptionSchema);
