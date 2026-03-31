const mongoose = require('mongoose');

const healthCheckerSchema = new mongoose.Schema({
    method: { type: String },
    url: { type: String },
    status: { type: Number },
    duration: { type: Number },
    tenant: { type: String },
    user: { type: String },
    ip: { type: String },
    level: { type: String },
    error: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date }
}, {
    timestamps: false,
    collection: 'healthchecks'
});

module.exports = healthCheckerSchema;
