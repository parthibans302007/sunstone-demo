const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = async (id) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
    const crypto = require('crypto');
    const nonce = crypto.randomBytes(16).toString('hex');
    const token = jwt.sign({ id, nonce }, secret, { expiresIn: '7d' });

    // Store in MongoDB
    await RefreshToken.create({
        token,
        user: id,
        expiresAt
    });

    return token;
};

const setRefreshTokenCookie = (res, token) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', token, {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });
};

const registerUser = async (req, res, next) => {
    const { name, email, password, role } = req.body;
    try {
        if (!name || !email || !password) {
            throw new ApiError(400, 'Name, email, and password are required');
        }
        if (password.length < 6) {
            throw new ApiError(400, 'Password must be at least 6 characters');
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            throw new ApiError(400, 'User already exists');
        }
        const user = await User.create({ name, email, password, role });
        if (user) {
            const accessToken = generateAccessToken(user._id);
            const refreshToken = await generateRefreshToken(user._id);

            setRefreshTokenCookie(res, refreshToken);

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: accessToken
            });
        } else {
            throw new ApiError(400, 'Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required');
        }
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (user && (await user.matchPassword(password))) {
            const accessToken = generateAccessToken(user._id);
            const refreshToken = await generateRefreshToken(user._id);

            setRefreshTokenCookie(res, refreshToken);

            const { logAction } = require('../utils/auditLogger');
            req.user = user;
            await logAction(req, 'LOGIN', 'AUTH', null, { email: user.email });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isFirstLogin: user.isFirstLogin,
                token: accessToken
            });
        } else {
            throw new ApiError(401, 'Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    const oldToken = req.cookies?.refreshToken;
    try {
        if (!oldToken) {
            throw new ApiError(401, 'No refresh token provided');
        }

        // Find token in DB
        const tokenDoc = await RefreshToken.findOne({ token: oldToken });
        if (!tokenDoc) {
            throw new ApiError(401, 'Refresh token is invalid or expired');
        }

        // Verify token signature & expiry
        const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
        let decoded;
        try {
            decoded = jwt.verify(oldToken, secret);
        } catch (jwtErr) {
            // Delete invalid/expired token from DB
            await RefreshToken.deleteOne({ token: oldToken });
            throw new ApiError(401, 'Invalid refresh token signature');
        }

        // Retrieve user
        const user = await User.findById(decoded.id);
        if (!user) {
            await RefreshToken.deleteOne({ token: oldToken });
            throw new ApiError(401, 'User associated with token not found');
        }

        // Perform rotation: Generate new Access and Refresh tokens
        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = await generateRefreshToken(user._id);

        // Delete the old refresh token from DB
        await RefreshToken.deleteOne({ token: oldToken });

        // Set new refresh token cookie
        setRefreshTokenCookie(res, newRefreshToken);

        res.json({
            token: newAccessToken
        });
    } catch (error) {
        next(error);
    }
};

const logoutUser = async (req, res, next) => {
    const token = req.cookies?.refreshToken;
    try {
        if (token) {
            const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
            try {
                const decoded = jwt.verify(token, secret);
                const user = await User.findById(decoded.id);
                if (user) {
                    const { logAction } = require('../utils/auditLogger');
                    req.user = user;
                    await logAction(req, 'LOGOUT', 'AUTH', { email: user.email }, null);
                }
            } catch (err) {
                // Ignore audit logging errors on invalid tokens
            }

            // Remove token from database
            await RefreshToken.deleteOne({ token });
        }
        
        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    const { newPassword } = req.body;
    try {
        if (!newPassword || newPassword.length < 6) {
            throw new ApiError(400, 'Password must be at least 6 characters');
        }
        const user = await User.findById(req.user._id);
        if (user) {
            user.password = newPassword;
            user.isFirstLogin = false;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            throw new ApiError(404, 'User not found');
        }
    } catch (error) {
        next(error);
    }
};

const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            throw new ApiError(404, 'User not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { registerUser, loginUser, refreshToken, logoutUser, getUserProfile, changePassword };
