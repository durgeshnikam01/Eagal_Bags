import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    
    // Log obfuscated URI for debugging
    const obfuscatedUri = uri.replace(/\/\/.*@/, '//****:****@');
    console.log(`Attempting to connect to MongoDB: ${obfuscatedUri}`);

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`CRITICAL DATABASE ERROR: ${error.message}`);
    // Don't exit immediately in production, let the health check handle it
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
