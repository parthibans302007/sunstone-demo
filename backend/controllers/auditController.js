const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
    try {
        const { search, moduleName, actionType, startDate, endDate, page = 1, limit = 50 } = req.query;
        
        const query = {};
        
        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { userRole: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (moduleName) {
            query.module = moduleName;
        }
        
        if (actionType) {
            query.actionType = actionType;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        
        const totalItems = await AuditLog.countDocuments(query);
        const totalPages = Math.ceil(totalItems / Number(limit));
        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate('user', 'name email role');
            
        res.json({
            logs,
            pagination: {
                totalItems,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAuditLogs
};
