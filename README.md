# Inflix Platform Backend

Standalone API for subscription/plan/feature management. Connects to **one master MongoDB** (`inflix_master`). Tenant operational data lives in **separate tenant DBs** on the same cluster (`tenant_<tenantId>`).

## Env vars

Copy `.env.example` to `.env` and set:

- **MASTER_MONGODB_URI** – Atlas cluster URI (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/inflix_master` or without DB name; `MASTER_DB_NAME` is used).
- **MASTER_DB_NAME** – `inflix_master` (default).
- **TENANT_DB_PREFIX** – `tenant_` (default). Tenant DBs are created as `tenant_<tenantId>`.
- **PLATFORM_SHARED_SECRET** – Long random string for tenant app APIs (entitlements + events). Not used for platform login.
- **JWT_SECRET** / **PLATFORM_JWT_SECRET** – For platform console JWT.
- **CORS_ORIGIN** – e.g. `http://localhost:3001` (platform frontend).

## Scripts

- `npm run dev` – Start with nodemon.
- `npm run start` – Production.
- `npm run seed:entitlements` – Seed FeatureCatalog, LimitCatalog, PlanCatalog.
- `npm run seed:platform-admin` – Create/update platform admin:  
  `node src/seeders/seedPlatformAdmin.js --email you@example.com --password "YourPass1!"`

## APIs

- **Platform console** (auth: `X-Platform-Auth: Bearer <platform JWT>`):
  - `POST /api/platform-auth/login`, `GET /api/platform-auth/me`
  - `GET/POST/PUT /api/platform/feature-catalog`, `limit-catalog`, `plan-catalog`
  - `GET/POST/PUT/DELETE /api/platform/tenants`, `.../tenants/:tenantId/subscription`, `.../tenants/:tenantId/users`, etc.
  - `GET/POST/PUT/DELETE /api/platform/admin-accounts`

- **Tenant apps** (auth: `X-Platform-Secret: <PLATFORM_SHARED_SECRET>` or `Authorization: Bearer <secret>`):
  - `GET /api/tenant/entitlements?tenantId=xxx` – Returns `{ planKey, enabledFeatures, limits, usage }`.
  - `POST /api/tenant/events` – Body: `{ tenantId, type, delta?, meta? }`. Types: `USER_CREATED`, `USER_DELETED`, `LOCATION_CREATED`, `LOCATION_ARCHIVED`, `REPAIR_CREATED`. Updates `TenantUsage` in master DB.

## Tenant provisioning

`POST /api/platform/tenants` (platform auth):

1. Creates `Tenant` and `TenantSubscription` in master DB.
2. Connects to tenant DB (`tenant_<tenantId>`) and inserts `__init` (one doc) to create the DB.
3. Optionally creates first admin user in tenant DB (body: `createFirstAdmin: { email, password, name? }`).

MongoDB creates the DB on first write; no Atlas Admin API required.

# pos-platfrom-backend
