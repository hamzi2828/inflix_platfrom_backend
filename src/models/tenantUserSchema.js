/**
 * User schema for tenant DBs (used with tenant connection).
 * Same shape as POS User: name, email, password, role, roles, tenantId, etc.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const tenantUserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: [50] },
    email: { type: String, required: true, unique: true, lowercase: true, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] },
    password: { type: String, required: true, minlength: [8], select: false },
    role: { type: String, enum: ['admin', 'manager', 'cashier', 'staff', 'warehouse'], default: 'cashier' },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    assignedLocationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    defaultLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    tenantId: { type: String, required: true, default: 'default', trim: true, maxlength: [128] }
}, { timestamps: true });

tenantUserSchema.index({ tenantId: 1 });

tenantUserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(config.bcryptSaltRounds || 10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = tenantUserSchema;
