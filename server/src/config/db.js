
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        dbName: process.env.DB_NAME || 'd_shawarma_station',
      }
    );

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
