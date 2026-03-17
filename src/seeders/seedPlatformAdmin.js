require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const connectDB = require('../config/db');
const PlatformUser = require('../models/PlatformUser');

const args = process.argv.slice(2);
function getArg(name) {
    const i = args.indexOf(name);
    if (i === -1) return null;
    return args[i + 1] || null;
}

async function run() {
    let email = getArg('--email');
    let password = getArg('--password');
    if ((!email || !password) && args.length >= 2) {
        email = args[0];
        password = args[1];
    }
    if (!email || !password) {
        console.error('Usage: node src/seeders/seedPlatformAdmin.js --email <email> --password "<password>"');
        console.error('   or: node src/seeders/seedPlatformAdmin.js <email> <password>');
        process.exit(1);
    }
    await connectDB();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await PlatformUser.findOne({ email: normalizedEmail });
    const salt = await bcrypt.genSalt(config.bcryptSaltRounds || 10);
    const passwordHash = await bcrypt.hash(password, salt);
    if (existing) {
        existing.passwordHash = passwordHash;
        existing.updatedAtUtc = new Date();
        await existing.save();
        console.log('Updated platform admin:', normalizedEmail);
    } else {
        await PlatformUser.create({ email: normalizedEmail, passwordHash, role: 'platform_admin', isActive: true });
        console.log('Created platform admin:', normalizedEmail);
    }
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
