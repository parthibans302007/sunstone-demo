const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if(!req.user) {
                return next(new ApiError(401, 'User deleted or not found'));
            }
            return next();
        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            return next(new ApiError(401, 'Not authorized, token failed'));
        }
    }
    if (!token) {
        return next(new ApiError(401, 'Not authorized, no token'));
    }
};

// Flexible RBAC middleware supporting dynamic roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Not authenticated'));
        }
        
        const allowedRoles = roles.map(role => role.toLowerCase());
        const userRole = req.user.role ? req.user.role.toLowerCase() : '';

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            next(new ApiError(403, `Forbidden: Access denied for role: ${req.user.role}`));
        }
    };
};

// Backward-compatible exports
const admin = authorize('admin');
const facultyOrAdmin = authorize('admin', 'faculty');

module.exports = { protect, authorize, admin, facultyOrAdmin };
