const mongoose = require('mongoose');

const limitCatalogSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, trim: true, maxlength: [64] },
    name: { type: String, required: true, trim: true, maxlength: [120] },
    description: { type: String, trim: true, default: '', maxlength: [500] },
    unit: { type: String, trim: true, default: 'count', maxlength: [32] },
    defaultValue: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    createdAtUtc: { type: Date, default: Date.now },
    updatedAtUtc: { type: Date, default: Date.now }
}, { timestamps: false, collection: 'limit_catalog' });

limitCatalogSchema.index({ isActive: 1 });
limitCatalogSchema.pre('save', function (next) {
    this.updatedAtUtc = new Date();
    next();
});

module.exports = mongoose.model('LimitCatalog', limitCatalogSchema);
