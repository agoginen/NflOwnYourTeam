const mongoose = require('mongoose');
let memoryServerInstance = null;

const connectDB = async () => {
  try {
    const useInMemory = String(process.env.USE_IN_MEMORY_DB || '').toLowerCase() === 'true';

    if (useInMemory) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const mongoUri = memoryServerInstance.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB (in-memory) Connected: ${conn.connection.host}`);
    } else {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nfl-own-your-team';
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      if (memoryServerInstance) {
        await memoryServerInstance.stop();
      }
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
