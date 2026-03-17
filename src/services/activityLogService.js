/**
 * Minimal audit for platform console (optional: extend to write to collection).
 */
function contextFromReq(req) {
    if (!req) return { actorUserId: null, actorName: '', actorRole: '', source: 'API', ipAddress: '' };
    const user = req.platformUser || req.user;
    const ip = (req.headers && req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : (req.connection && req.connection.remoteAddress) || '';
    return {
        actorUserId: user && user._id ? user._id : null,
        actorName: (user && user.email) ? String(user.email) : '',
        actorRole: (user && user.role) ? String(user.role) : '',
        source: (req.headers && req.headers['x-audit-source']) === 'UI' ? 'UI' : 'API',
        ipAddress: ip
    };
}

async function logFromReq(req, opts) {
    const ctx = contextFromReq(req);
    if (process.env.NODE_ENV === 'development' && opts && opts.action) {
        console.log('[Platform Audit]', opts.action, opts.entityType, opts.entityId, ctx.actorName);
    }
    return null;
}

module.exports = { logFromReq, contextFromReq };
