// src/db/connect.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas unreachable
      maxPoolSize: 10, // Max simultaneous connections
      minPoolSize: 2, // Maintain at least 2 connections
      socketTimeoutMS: 30000 // Socket timeout
    });
    console.log(`■ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`■ Database Error: ${error.message}`);
    process.exit(1); // Exit process - server is useless without DB
  }
};

// Graceful disconnect on app shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected — app shutting down');
    process.exit(0);
  } catch (err) {
    console.error('Error during database close:', err);
    process.exit(1);
  }
});

export default connectDB;
