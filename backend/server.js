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

connectDB();

const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const app = express();
const server = http.createServer(app);

// Initialize automated scheduled tasks
initCronJobs();

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.set('io', io); // Accessible in controllers via req.app.get('io')

io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Socket client disconnected:', socket.id);
    });
});

app.use(helmet());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', apiLimiter);

// Middleware to check database connection status
app.use('/api', async (req, res, next) => {
    // Skip checking for the root status API
    if (req.path === '/' || req.path === '') {
        return next();
    }
    
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        // Fetch current public IP dynamically
        let publicIP = '157.50.15.71';
        try {
            const https = require('https');
            publicIP = await new Promise((resolve, reject) => {
                const apiReq = https.get('https://api.ipify.org', { timeout: 1000 }, (apiRes) => {
                    let data = '';
                    apiRes.on('data', (chunk) => data += chunk);
                    apiRes.on('end', () => resolve(data.trim()));
                });
                apiReq.on('error', (err) => reject(err));
                apiReq.on('timeout', () => {
                    apiReq.destroy();
                    reject(new Error('timeout'));
                });
            });
        } catch (e) {
            // fallback
        }
        
        return res.status(503).json({
            success: false,
            message: `Database connection is not ready. Please whitelist this machine's public IP: ${publicIP} in your MongoDB Atlas Network Access settings (or allow 0.0.0.0/0 to accept connections from any dynamic IP).`
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

const path = require('path');

const PORT = process.env.PORT || 5000;

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve React app for internal routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    next();
  }
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, server };
