/**
 * Get Mongoose connection to a tenant's database (same cluster, different dbName).
 * Used for: __init write on provision, User CRUD for tenant users.
 * Builds URI with tenant DB name so we always hit the correct database.
 */
const mongoose = require('mongoose');
const config = require('../config');

const connectionCache = new Map();

function getTenantDbName(tenantId) {
    return (config.tenantDbPrefix || 'tenant_') + String(tenantId).trim();
}

/** Build URI pointing to the given database (same host as master). */
function buildTenantUri(dbName) {
    const uri = config.masterMongoUri;
    if (!uri) return null;
    const encoded = encodeURIComponent(dbName);
    // Replace database in URI so we connect to tenant_<id> not master
    const withDb = uri.replace(/\/([^/?]+)(\?.*)?$/, (_, _db, q) => `/${encoded}${q || ''}`);
    if (withDb !== uri) return withDb;
    // No database in URI — append /dbName and preserve query string
    const [base, qs] = uri.split('?');
    const path = base.endsWith('/') ? base + encoded : base + '/' + encoded;
    return qs ? `${path}?${qs}` : path;
}

function getTenantConnection(tenantId) {
    const tid = String(tenantId).trim();
    if (!tid) return null;
    if (connectionCache.has(tid)) {
        return connectionCache.get(tid);
    }
    const dbName = getTenantDbName(tid);
    const tenantUri = buildTenantUri(dbName);
    if (!tenantUri) return null;
    const conn = mongoose.createConnection(tenantUri);
    connectionCache.set(tid, conn);
    return conn;
}

module.exports = { getTenantConnection, getTenantDbName };
