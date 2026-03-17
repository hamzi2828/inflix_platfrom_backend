function getLondonDateKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
}

function getLondonMonthRange() {
    const now = new Date();
    const key = getLondonDateKey(now);
    const [y, m] = key.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return {
        start: `${y}-${String(m).padStart(2, '0')}-01`,
        end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    };
}

module.exports = { getLondonDateKey, getLondonMonthRange };
