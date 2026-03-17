const PlatformUser = require('../models/PlatformUser');
const asyncHandler = require('../middleware/asyncHandler');

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const platformUser = await PlatformUser.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!platformUser) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!platformUser.isActive) {
        return res.status(401).json({ success: false, message: 'Platform account is deactivated' });
    }
    const isMatch = await platformUser.matchPassword(password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = platformUser.getSignedJwtToken();
    res.status(200).json({
        success: true,
        data: { email: platformUser.email, role: platformUser.role, isPlatformAdmin: platformUser.role === 'platform_admin' },
        token
    });
});

exports.logout = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
    const platformUser = req.platformUser;
    res.status(200).json({
        success: true,
        data: { email: platformUser.email, role: platformUser.role, isPlatformAdmin: platformUser.role === 'platform_admin' }
    });
});
