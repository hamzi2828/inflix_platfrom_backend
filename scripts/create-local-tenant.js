/**
 * Creates a local-testing tenant directly in MongoDB.
 *
 * Usage:  node scripts/create-local-tenant.js
 *
 * Result:
 *   tenantId      = "localhost"
 *   subdomain     = "localhost"
 *   tenantUrl     = "http://localhost:3001"
 *   DB name       = "tenant_localhost"
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const MASTER_URI = process.env.MASTER_MONGODB_URI;
const TENANT_DB_PREFIX = process.env.TENANT_DB_PREFIX || 'tenant_';

const TENANT_ID = 'localhost';
const TENANT_SUBDOMAIN = 'localhost';
const TENANT_URL = 'http://localhost:3001';
const TENANT_DB_NAME = TENANT_DB_PREFIX + TENANT_ID;

async function main() {
  console.log('Connecting to master DB …');
  await mongoose.connect(MASTER_URI);
  const db = mongoose.connection.db;

  // Check if tenant already exists
  const existing = await db.collection('tenants').findOne({ tenantId: TENANT_ID });
  if (existing) {
    console.log(`Tenant "${TENANT_ID}" already exists — updating tenantUrl to ${TENANT_URL}`);
    await db.collection('tenants').updateOne(
      { tenantId: TENANT_ID },
      { $set: { tenantUrl: TENANT_URL, updatedAtUtc: new Date() } }
    );
    console.log('Updated.');
    await mongoose.disconnect();
    return;
  }

  const now = new Date();

  // 1. Create tenant record
  await db.collection('tenants').insertOne({
    tenantId: TENANT_ID,
    tenantSubdomain: TENANT_SUBDOMAIN,
    tenantUrl: TENANT_URL,
    name: 'Local Dev',
    companyName: 'Local Dev',
    email: '',
    phone: '',
    billingAddress: '',
    billingEmail: '',
    billingAmount: null,
    billingCycle: 'monthly',
    currency: 'GBP',
    status: 'active',
    createdAtUtc: now,
    updatedAtUtc: now,
  });
  console.log('✓ Tenant record created in master DB');

  // 2. Create subscription
  await db.collection('tenantsubscriptions').insertOne({
    tenantId: TENANT_ID,
    subscriptionType: 'plan',
    planKey: 'starter',
    overrides: { features: {}, limits: {} },
    startDate: now,
    createdAtUtc: now,
    updatedAtUtc: now,
  });
  console.log('✓ Subscription created (plan: starter)');

  // 3. Initialise tenant database
  const tenantUri = MASTER_URI.replace(
    /\/([^/?]+)(\?.*)?$/,
    (_, _db, q) => `/${encodeURIComponent(TENANT_DB_NAME)}${q || ''}`
  );
  const tenantConn = mongoose.createConnection(tenantUri);
  await tenantConn.asPromise();
  await tenantConn.db.collection('__init').insertOne({
    tenantId: TENANT_ID,
    createdAtUtc: now,
  });
  console.log(`✓ Tenant DB "${TENANT_DB_NAME}" initialised`);

  await tenantConn.close();
  await mongoose.disconnect();

  console.log('\n=== Tenant created ===');
  console.log(`  Tenant ID   : ${TENANT_ID}`);
  console.log(`  Subdomain   : ${TENANT_SUBDOMAIN}`);
  console.log(`  Tenant URL  : ${TENANT_URL}`);
  console.log(`  DB name     : ${TENANT_DB_NAME}`);
  console.log(`  Plan        : starter`);
  console.log(`  Status      : active`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
