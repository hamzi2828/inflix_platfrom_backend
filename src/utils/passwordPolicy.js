/** Platform admin passwords: min 10 chars, upper, lower, number (stronger than tenant user policy) */
const MIN_LENGTH = 10;

function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, message: 'Password is required' };
    }
    if (password.length < MIN_LENGTH) {
        return { valid: false, message: `Password must be at least ${MIN_LENGTH} characters` };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
}

module.exports = { validatePassword, MIN_LENGTH };
