require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const inspect = async () => {
  await connectDB();
  try {
    const user = await User.findOne({ email: 'admin@sunstone.edu' });
    if (!user) {
      console.log('Admin user not found');
      return;
    }
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Password (first 30 chars):', user.password.substring(0, 30));
    console.log('Password length:', user.password.length);
    // Check if it looks like a bcrypt hash
    const isHash = /^\$2[aby]\$\d+\$/.test(user.password);
    console.log('Looks like bcrypt hash:', isHash);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

inspect();