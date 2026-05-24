const mongoose = require('mongoose');

const connectDB = async () => {
    // Disable command buffering so queries fail immediately if not connected
    mongoose.set('bufferCommands', false);
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 2000
        });
        console.log(`MongoDB Connected (Atlas): ${conn.connection.host}`);
    } catch (error) {
        console.log('Atlas connection failed. Trying local MongoDB...');
        try {
            const conn = await mongoose.connect('mongodb://127.0.0.1:27017/attendance-system', {
                serverSelectionTimeoutMS: 2000
            });
            console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
        } catch (localError) {
            console.error(`Error connecting to MongoDB Atlas: ${error.message}`);
            console.error(`Error connecting to local MongoDB: ${localError.message}`);
            
            let publicIP = '157.50.14.165';
            try {
                const https = require('https');
                publicIP = await new Promise((resolve, reject) => {
                    const req = https.get('https://api.ipify.org', { timeout: 2000 }, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => resolve(data.trim()));
                    });
                    req.on('error', (err) => reject(err));
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error('timeout'));
                    });
                });
            } catch (ipErr) {
                // fallback to detected IP
            }

            console.log('\n========================================================================');
            console.log('⚠️  DATABASE CONNECTION ERROR:');
            console.log('Could not connect to MongoDB Atlas or local MongoDB.');
            console.log('To resolve this, please whitelist this machine\'s public IP:');
            console.log(`👉 ${publicIP}`);
            console.log('in your MongoDB Atlas Network Security settings, or start local MongoDB.');
            console.log('========================================================================\n');
            // process.exit(1);
        }
    }
};

module.exports = connectDB;
