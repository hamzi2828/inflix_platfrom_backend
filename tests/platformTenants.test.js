/**
 * Tests for POST /api/platform/tenants (tenant provisioning).
 * - tenantSubdomain required; tenantUrl computed
 * - Never accept dbName from request
 * - Cannot create two tenants with same subdomain; invalid subdomain rejected
 */

const mongoose = require('mongoose');

const mockInsertOne = jest.fn().mockResolvedValue({ insertedId: new mongoose.Types.ObjectId() });
const mockCollection = jest.fn().mockReturnValue({ insertOne: mockInsertOne });
const mockConn = {
    collection: mockCollection,
    models: {},
    model: jest.fn().mockImplementation(function (name, schema) {
        const M = function (doc) {
            this.save = jest.fn().mockResolvedValue(doc);
            this._doc = doc;
            return this;
        };
        M.findOne = jest.fn().mockResolvedValue(null);
        M.create = jest.fn().mockResolvedValue({});
        M.find = jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) });
        return M;
    })
};

jest.mock('../src/config', () => ({ tenantUrlDomain: 'inflix.uk' }));
jest.mock('../src/models/Tenant', () => ({
    find: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
    findOne: jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) }),
    create: jest.fn().mockResolvedValue({}),
    validateSubdomainFormat: (v) => {
        if (typeof v !== 'string') return false;
        const s = v.trim().toLowerCase();
        return s.length >= 3 && s.length <= 30 && /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(s);
    }
}));
jest.mock('../src/models/TenantSubscription', () => ({
    findOneAndUpdate: jest.fn().mockResolvedValue({})
}));
jest.mock('../src/services/tenantConnection', () => ({
    getTenantConnection: jest.fn(() => mockConn),
    getTenantDbName: jest.fn((id) => `tenant_${id}`)
}));
jest.mock('../src/services/activityLogService', () => ({
    logFromReq: jest.fn().mockResolvedValue(undefined)
}));

const Tenant = require('../src/models/Tenant');
const { createTenant } = require('../src/controllers/platformTenantsController');

function mockRes() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
    return res;
}

function validBody(overrides = {}) {
    return { tenantSubdomain: 'acme', name: 'Acme Ltd', ...overrides };
}

describe('POST /api/platform/tenants (createTenant)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Tenant.find.mockReturnValue({ limit: jest.fn().mockResolvedValue([]) });
        Tenant.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    });

    it('rejects when dbName is sent in request body', async () => {
        const req = { body: { ...validBody(), dbName: 'tenant_evil' } };
        const res = mockRes();
        await createTenant(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: expect.stringContaining('dbName') })
        );
        expect(Tenant.create).not.toHaveBeenCalled();
    });

    it('rejects when tenantSubdomain is missing', async () => {
        const req = { body: { name: 'Acme' } };
        const res = mockRes();
        await createTenant(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: expect.stringContaining('tenantSubdomain') })
        );
    });

    it('rejects invalid subdomain (too short, leading/trailing hyphen)', async () => {
        for (const sub of ['ab', '-acme', 'acme-']) {
            const res = mockRes();
            await createTenant({ body: validBody({ tenantSubdomain: sub }) }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: expect.stringContaining('Subdomain') })
            );
        }
    });

    it('cannot create two tenants with same subdomain', async () => {
        Tenant.findOne.mockReturnValue({ lean: () => Promise.resolve({ tenantId: 'existing', tenantSubdomain: 'acme' }) });
        const req = { body: validBody({ tenantSubdomain: 'acme' }) };
        const res = mockRes();
        await createTenant(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: expect.stringContaining('already in use') })
        );
        expect(Tenant.create).not.toHaveBeenCalled();
    });

    it('tenantUrl is computed correctly', async () => {
        const req = { body: validBody({ tenantSubdomain: 'my-tenant' }) };
        const res = mockRes();
        await createTenant(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        const data = res.json.mock.calls[0][0].data;
        expect(data.tenantUrl).toBe('https://my-tenant.inflix.uk');
        expect(data.tenantSubdomain).toBe('my-tenant');
    });

    it('creates tenant and returns tenantId, tenantDbName, tenantUrl, status, planKey, createdFirstAdmin', async () => {
        const req = { body: validBody({ name: 'Acme Ltd', companyName: 'Acme', planKey: 'starter' }) };
        const res = mockRes();
        await createTenant(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: 'Tenant created',
                data: expect.objectContaining({
                    tenantId: expect.any(String),
                    tenantSubdomain: 'acme',
                    tenantUrl: 'https://acme.inflix.uk',
                    tenantDbName: expect.stringMatching(/^tenant_/),
                    status: 'active',
                    planKey: 'starter',
                    createdFirstAdmin: false
                })
            })
        );
        const data = res.json.mock.calls[0][0].data;
        expect(data.tenantDbName).toBe(`tenant_${data.tenantId}`);
    });

    it('when createFirstAdmin is true but firstAdmin is missing, returns 400', async () => {
        const req = { body: validBody({ createFirstAdmin: true }) };
        const res = mockRes();
        await createTenant(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.stringContaining('firstAdmin')
            })
        );
    });

    it('uses planKey from body and defaults to starter', async () => {
        const req = { body: validBody({ planKey: 'pro' }) };
        const res = mockRes();
        await createTenant(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ planKey: 'pro' })
            })
        );
    });

    it('inserts __init doc in tenant DB (initializes tenant database)', async () => {
        mockInsertOne.mockClear();
        const req = { body: validBody() };
        const res = mockRes();
        await createTenant(req, res);
        expect(mockCollection).toHaveBeenCalledWith('__init');
        expect(mockInsertOne).toHaveBeenCalledTimes(1);
        const inserted = mockInsertOne.mock.calls[0][0];
        expect(inserted).toHaveProperty('tenantId');
        expect(inserted).toHaveProperty('createdAtUtc');
        expect(typeof inserted.tenantId).toBe('string');
        expect(inserted.createdAtUtc).toBeInstanceOf(Date);
    });
});
