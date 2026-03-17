module.exports = {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    platformJwtSecret: process.env.PLATFORM_JWT_SECRET || (process.env.JWT_SECRET ? process.env.JWT_SECRET + '_platform' : undefined),
    platformJwtExpire: process.env.PLATFORM_JWT_EXPIRE || process.env.JWT_EXPIRE || '8h',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
    masterMongoUri: process.env.MASTER_MONGODB_URI,
    masterDbName: process.env.MASTER_DB_NAME || 'inflix_master',
    tenantDbPrefix: process.env.TENANT_DB_PREFIX || 'tenant_',
    tenantUrlDomain: process.env.TENANT_URL_DOMAIN || 'inflix.uk',
    platformSharedSecret: process.env.PLATFORM_SHARED_SECRET
};
