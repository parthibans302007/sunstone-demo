const AuditLog = require('../models/AuditLog');

const logAction = async (req, actionType, module, previousValue = null, newValue = null) => {
    try {
               const ipAddress = (req && (req.ip || (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress))) || '';
        const user = req && req.user;
        const userName = user ? user.name : 'System / Guest';
        const userRole = user ? user.role : 'Guest';
        
        await AuditLog.create({
            user: user ? user._id : null,
            userName,
            userRole,
            actionType,
            module,
            previousValue,
            newValue,
            ipAddress
        });
    } catch (error) {
        console.error('Audit Logging failed:', error.message);
    }
};

module.exports = { logAction };
