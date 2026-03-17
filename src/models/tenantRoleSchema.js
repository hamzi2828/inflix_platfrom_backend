const mongoose = require('mongoose');

const tenantRoleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
}, { timestamps: true, collection: 'roles' });

module.exports = tenantRoleSchema;
