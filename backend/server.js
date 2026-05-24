require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const initCronJobs = require('./services/cronJobs');

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize automated scheduled tasks
initCronJobs();

const io = new Server(server, {
  cors: {
    origin: "*", // allow all logic for now
    methods: ["GET", "POST"]
  }
});
app.set('io', io); // Accessible in controllers via req.app.get('io')

io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Socket client disconnected:', socket.id);
    });
});

app.use(cors());
app.use(express.json());

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

app.get('/api', (req, res) => {
    res.send('Sunstone Management System Backend API is running');
});

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

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
