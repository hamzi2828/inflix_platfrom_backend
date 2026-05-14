const mongoose = require('mongoose');

/**
 * Permission catalog written into each tenant DB.
 * Mirrors the POS tenant Permission model exactly so POS RBAC checks work
 * against permissions seeded by the platform on tenant creation.
 */
const tenantPermissionSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: { type: String, default: '' },
    group: { type: String, default: 'Other' }
}, {
    timestamps: true,
    collection: 'permissions'
});

tenantPermissionSchema.index({ group: 1 });

module.exports = tenantPermissionSchema;
