require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const placementRoutes = require('./routes/placementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const initCronJobs = require('./services/cronJobs');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const dbConnection = connectDB();

const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',

  // Vercel Frontend URLs
  'https://sunstone-demo.vercel.app',
  'https://sunstone-demo-mxmnqylyg-parthibans302007s-projects.vercel.app',

  process.env.FRONTEND_URL
].filter(Boolean);

const isAllowedOrigin = (origin) => !origin
  || allowedOrigins.includes(origin)
  || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', apiLimiter);

// Middleware to check database connection status
app.use('/api', (req, res, next) => {
    // Skip checking for the root status API
    if (req.path === '/' || req.path === '') {
        return next();
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Database connection is not ready. Check MONGODB_URI and database network access.'
        });
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/schedules', scheduleRoutes);

const { protect, admin } = require('./middleware/authMiddleware');
app.get('/api/health', protect, admin, async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const User = require('./models/User');
        const RefreshToken = require('./models/RefreshToken');
        const AuditLog = require('./models/AuditLog');

        // 1. Database status
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

        // 2. Total Users
        const totalUsers = await User.countDocuments({});
        const totalStudents = await require('./models/Student').countDocuments({});
        const totalFaculty = await User.countDocuments({ role: 'faculty' });

        // 3. Active Sessions (refresh tokens)
        const activeSessions = await RefreshToken.countDocuments({ expiresAt: { $gt: new Date() } });

        // 4. API Health & System usage
        const os = require('os');
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = `${Math.round(usedMem / (1024 * 1024))} MB / ${Math.round(totalMem / (1024 * 1024))} MB`;

        const systemCpu = os.cpus().length;

        // 5. Recent Errors / deletes
        const recentErrors = await AuditLog.find({ actionType: { $in: ['LOGIN_FAILED', 'DELETE', 'STUDENT_DELETED', 'ERROR'] } })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            dbStatus,
            totalUsers,
            totalStudents,
            totalFaculty,
            activeSessions,
            memoryUsage,
            systemCpu,
            uptime: Math.round(process.uptime()),
            recentErrors
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api', (req, res) => {
    res.send('Sunstone Management System Backend API is running');
});

app.use(errorHandler);

// Socket.io and server initialization only for non-Vercel environments
if (process.env.VERCEL !== '1') {
    const path = require('path');

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (isAllowedOrigin(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
        console.log('Socket client connected:', socket.id);
        socket.on('disconnect', () => {
            console.log('Socket client disconnected:', socket.id);
        });
    });
    app.set('io', io);

    // Remove static file serving and catch-all route for separate frontend deployment
    // app.use(express.static(path.join(__dirname, '../frontend/dist')));
    // app.use((req, res, next) => {
    //   if (req.method === 'GET' && !req.path.startsWith('/api')) {
    //     res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    //   } else {
    //     next();
    //   }
    // });

    const PORT = process.env.PORT || 5000;

    if (require.main === module) {
        dbConnection.then((connection) => {
            if (connection) initCronJobs();
            server.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        });
    }

    module.exports = { app, server };
} else {
    // Export the app for Vercel serverless functions
    module.exports = app;
}
