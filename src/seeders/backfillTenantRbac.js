/**
 * Backfill the tenant RBAC catalogue into every existing tenant DB.
 * Use this when new permissions (e.g. invoice.*) are added to TENANT_PERMISSIONS
 * so they become available on tenants that were provisioned earlier.
 *
 * Run: node src/seeders/backfillTenantRbac.js (with MONGODB_URI set).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const { getTenantConnection } = require('../services/tenantConnection');
const { seedTenantRbac } = require('./seedTenantRbac');

async function run() {
    await connectDB();
    const tenants = await Tenant.find({}).select('tenantId name status').lean();
    if (tenants.length === 0) {
        console.log('No tenants found.');
    }
    for (const t of tenants) {
        try {
            const conn = getTenantConnection(t.tenantId);
            if (!conn) {
                console.warn('Skip', t.tenantId, '(no connection)');
                continue;
            }
            await seedTenantRbac(conn);
            console.log('Seeded RBAC for tenant:', t.tenantId, t.name ? `(${t.name})` : '');
        } catch (err) {
            console.error('Failed for tenant', t.tenantId, '-', err.message);
        }
    }
    await mongoose.disconnect();
    console.log('Backfill done.');
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
