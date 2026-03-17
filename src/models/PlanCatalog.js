const mongoose = require('mongoose');

const planCatalogSchema = new mongoose.Schema({
    planKey: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: [64] },
    name: { type: String, required: true, trim: true, maxlength: [120] },
    description: { type: String, trim: true, default: '', maxlength: [500] },
    priceMetadata: { type: mongoose.Schema.Types.Mixed, default: null },
    features: { type: Map, of: Boolean, default: () => new Map() },
    limits: { type: Map, of: mongoose.Schema.Types.Mixed, default: () => new Map() },
    isActive: { type: Boolean, default: true },
    createdAtUtc: { type: Date, default: Date.now },
    updatedAtUtc: { type: Date, default: Date.now }
}, { timestamps: false, collection: 'plan_catalog' });

planCatalogSchema.index({ isActive: 1 });
planCatalogSchema.pre('save', function (next) {
    this.updatedAtUtc = new Date();
    next();
});

module.exports = mongoose.model('PlanCatalog', planCatalogSchema);
