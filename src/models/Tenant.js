const mongoose = require('mongoose');

// Subdomain: lowercase, a-z 0-9 hyphen, 3-30 chars, cannot start/end with hyphen
const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
function validateSubdomain(v) {
    if (typeof v !== 'string') return false;
    const s = v.trim().toLowerCase();
    return s.length >= 3 && s.length <= 30 && SUBDOMAIN_REGEX.test(s);
}

const tenantSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: [128, 'Tenant ID cannot exceed 128 characters']
    },
    tenantSubdomain: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Subdomain must be 3–30 characters'],
        maxlength: [30, 'Subdomain must be 3–30 characters'],
        validate: {
            validator: function (v) { return validateSubdomain(v); },
            message: 'Subdomain must be lowercase letters, numbers, and hyphens only (3–30 chars, no leading/trailing hyphen)'
        }
    },
    tenantUrl: { type: String, trim: true, default: '', maxlength: [256] },
    name: { type: String, trim: true, default: '', maxlength: [200] },
    companyName: { type: String, trim: true, default: '', maxlength: [200] },
    email: { type: String, trim: true, lowercase: true, default: '', maxlength: [254] },
    phone: { type: String, trim: true, default: '', maxlength: [50] },
    billingAddress: { type: String, trim: true, default: '', maxlength: [500] },
    billingEmail: { type: String, trim: true, lowercase: true, default: '', maxlength: [254] },
    billingAmount: { type: Number, default: null, min: 0 },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly', trim: true },
    currency: { type: String, trim: true, default: 'GBP', maxlength: [10] },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', trim: true },
    createdAtUtc: { type: Date, default: Date.now },
    updatedAtUtc: { type: Date, default: Date.now }
}, { timestamps: false, collection: 'tenants' });

tenantSchema.index({ status: 1 });
tenantSchema.index({ tenantSubdomain: 1 }, { unique: true });
tenantSchema.pre('save', function (next) {
    this.updatedAtUtc = new Date();
    next();
});

tenantSchema.statics.validateSubdomainFormat = function (v) {
    return validateSubdomain(v);
};

module.exports = mongoose.model('Tenant', tenantSchema);
module.exports.validateSubdomainFormat = validateSubdomain;
