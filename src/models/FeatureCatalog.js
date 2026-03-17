const mongoose = require('mongoose');

const featureCatalogSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, trim: true, maxlength: [64] },
    name: { type: String, required: true, trim: true, maxlength: [120] },
    description: { type: String, trim: true, default: '', maxlength: [500] },
    category: { type: String, trim: true, default: 'Core', maxlength: [64] },
    defaultEnabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAtUtc: { type: Date, default: Date.now },
    updatedAtUtc: { type: Date, default: Date.now }
}, { timestamps: false, collection: 'feature_catalog' });

featureCatalogSchema.index({ isActive: 1, category: 1 });
featureCatalogSchema.pre('save', function (next) {
    this.updatedAtUtc = new Date();
    next();
});

module.exports = mongoose.model('FeatureCatalog', featureCatalogSchema);
