const asyncHandler = require('../middleware/asyncHandler');
const Tenant = require('../models/Tenant');
const { getTenantConnection } = require('../services/tenantConnection');
const healthCheckerSchema = require('../models/healthCheckerSchema');

function getHealthCheckModel(tenantId) {
    const conn = getTenantConnection(tenantId);
    if (!conn) return null;
    try { return conn.model('HealthCheck'); } catch (_) {
        return conn.model('HealthCheck', healthCheckerSchema);
    }
}

function buildDateFilter(from, to) {
    const filter = {};
    if (from || to) {
        filter.timestamp = {};
        if (from) filter.timestamp.$gte = new Date(from);
        if (to) filter.timestamp.$lte = new Date(to);
    }
    return filter;
}

/** GET /health-checker/tenants — list available tenants */
exports.listTenants = asyncHandler(async (req, res) => {
    const tenants = await Tenant.find({}).select('tenantId name companyName status').sort({ tenantId: 1 }).lean();
    res.json({ success: true, data: tenants });
});

/** GET /health-checker/summary?tenantId=xxx&from=...&to=... */
exports.summary = asyncHandler(async (req, res) => {
    const { tenantId, from, to } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    const HC = getHealthCheckModel(tenantId);
    if (!HC) return res.status(404).json({ success: false, message: 'Tenant DB not found' });

    const filter = buildDateFilter(from, to);

    const [stats] = await HC.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                avgDuration: { $avg: '$duration' },
                maxDuration: { $max: '$duration' },
                minDuration: { $min: '$duration' },
                errorCount: { $sum: { $cond: [{ $gte: ['$status', 400] }, 1, 0] } },
                serverErrorCount: { $sum: { $cond: [{ $gte: ['$status', 500] }, 1, 0] } },
                uniqueUsers: { $addToSet: '$user' },
                uniqueEndpoints: { $addToSet: '$url' },
                firstRequest: { $min: '$timestamp' },
                lastRequest: { $max: '$timestamp' }
            }
        },
        {
            $project: {
                _id: 0,
                totalRequests: 1,
                avgDuration: { $round: ['$avgDuration', 1] },
                maxDuration: 1,
                minDuration: 1,
                errorCount: 1,
                serverErrorCount: 1,
                errorRate: {
                    $cond: [
                        { $eq: ['$totalRequests', 0] }, 0,
                        { $round: [{ $multiply: [{ $divide: ['$errorCount', '$totalRequests'] }, 100] }, 1] }
                    ]
                },
                uniqueUsers: { $size: '$uniqueUsers' },
                uniqueEndpoints: { $size: '$uniqueEndpoints' },
                firstRequest: 1,
                lastRequest: 1
            }
        }
    ]);

    res.json({
        success: true,
        data: stats || {
            totalRequests: 0, avgDuration: 0, maxDuration: 0, minDuration: 0,
            errorCount: 0, serverErrorCount: 0, errorRate: 0,
            uniqueUsers: 0, uniqueEndpoints: 0, firstRequest: null, lastRequest: null
        }
    });
});

/** GET /health-checker/endpoints?tenantId=xxx&from=...&to=...&sort=hits&order=desc */
exports.endpoints = asyncHandler(async (req, res) => {
    const { tenantId, from, to } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    const HC = getHealthCheckModel(tenantId);
    if (!HC) return res.status(404).json({ success: false, message: 'Tenant DB not found' });

    const filter = buildDateFilter(from, to);

    const endpoints = await HC.aggregate([
        { $match: filter },
        {
            $group: {
                _id: { method: '$method', url: '$url' },
                hits: { $sum: 1 },
                avgDuration: { $avg: '$duration' },
                minDuration: { $min: '$duration' },
                maxDuration: { $max: '$duration' },
                errorCount: { $sum: { $cond: [{ $gte: ['$status', 400] }, 1, 0] } },
                lastHit: { $max: '$timestamp' },
                statuses: { $addToSet: '$status' },
                uniqueUsers: { $addToSet: '$user' }
            }
        },
        {
            $project: {
                _id: 0,
                method: '$_id.method',
                url: '$_id.url',
                hits: 1,
                avgDuration: { $round: ['$avgDuration', 1] },
                minDuration: 1,
                maxDuration: 1,
                errorCount: 1,
                errorRate: {
                    $cond: [
                        { $eq: ['$hits', 0] }, 0,
                        { $round: [{ $multiply: [{ $divide: ['$errorCount', '$hits'] }, 100] }, 1] }
                    ]
                },
                lastHit: 1,
                uniqueUsers: { $size: '$uniqueUsers' }
            }
        },
        { $sort: { hits: -1 } },
        { $limit: 200 }
    ]);

    res.json({ success: true, data: endpoints });
});

/** GET /health-checker/slow?tenantId=xxx&from=...&to=...&limit=20 */
exports.slow = asyncHandler(async (req, res) => {
    const { tenantId, from, to } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    const HC = getHealthCheckModel(tenantId);
    if (!HC) return res.status(404).json({ success: false, message: 'Tenant DB not found' });

    const filter = buildDateFilter(from, to);

    const slowest = await HC.find(filter)
        .sort({ duration: -1 })
        .limit(limit)
        .select('method url status duration user timestamp')
        .lean();

    res.json({ success: true, data: slowest });
});

/** GET /health-checker/users?tenantId=xxx&from=...&to=... */
exports.users = asyncHandler(async (req, res) => {
    const { tenantId, from, to } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    const HC = getHealthCheckModel(tenantId);
    if (!HC) return res.status(404).json({ success: false, message: 'Tenant DB not found' });

    const filter = buildDateFilter(from, to);

    const users = await HC.aggregate([
        { $match: filter },
        {
            $group: {
                _id: '$user',
                totalRequests: { $sum: 1 },
                avgDuration: { $avg: '$duration' },
                errorCount: { $sum: { $cond: [{ $gte: ['$status', 400] }, 1, 0] } },
                lastActive: { $max: '$timestamp' },
                endpoints: { $addToSet: '$url' },
                methods: { $addToSet: '$method' }
            }
        },
        {
            $project: {
                _id: 0,
                user: '$_id',
                totalRequests: 1,
                avgDuration: { $round: ['$avgDuration', 1] },
                errorCount: 1,
                errorRate: {
                    $cond: [
                        { $eq: ['$totalRequests', 0] }, 0,
                        { $round: [{ $multiply: [{ $divide: ['$errorCount', '$totalRequests'] }, 100] }, 1] }
                    ]
                },
                lastActive: 1,
                endpointCount: { $size: '$endpoints' }
            }
        },
        { $sort: { totalRequests: -1 } },
        { $limit: 50 }
    ]);

    res.json({ success: true, data: users });
});

/** GET /health-checker/recent?tenantId=xxx&limit=100&level=ERROR */
exports.recent = asyncHandler(async (req, res) => {
    const { tenantId, level } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    const HC = getHealthCheckModel(tenantId);
    if (!HC) return res.status(404).json({ success: false, message: 'Tenant DB not found' });

    const filter = {};
    if (level && ['INFO', 'WARN', 'ERROR'].includes(level.toUpperCase())) {
        filter.level = level.toUpperCase();
    }

    const recent = await HC.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

    res.json({ success: true, data: recent });
});

/** GET /health-checker/timeline?tenantId=xxx&from=...&to=...&buckets=24 */
exports.timeline = asyncHandler(async (req, res) => {
    const { tenantId, from, to } = req.query;
    const buckets = Math.min(parseInt(req.query.buckets) || 24, 100);
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    const HC = getHealthCheckModel(tenantId);
    if (!HC) return res.status(404).json({ success: false, message: 'Tenant DB not found' });

    const now = new Date();
    const start = from ? new Date(from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = to ? new Date(to) : now;
    const intervalMs = (end.getTime() - start.getTime()) / buckets;

    const timeline = await HC.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: {
                    $subtract: [
                        { $toLong: '$timestamp' },
                        { $mod: [{ $toLong: '$timestamp' }, intervalMs] }
                    ]
                },
                count: { $sum: 1 },
                avgDuration: { $avg: '$duration' },
                errors: { $sum: { $cond: [{ $gte: ['$status', 400] }, 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                time: { $toDate: '$_id' },
                count: 1,
                avgDuration: { $round: ['$avgDuration', 1] },
                errors: 1
            }
        },
        { $sort: { time: 1 } }
    ]);

    res.json({ success: true, data: timeline });
});
