const isAttended = (status) => {
    if (status === undefined || status === null) return false;
    const s = String(status).trim().toLowerCase();
    return s === 'present' || s === 'late';
};

module.exports = { isAttended };
