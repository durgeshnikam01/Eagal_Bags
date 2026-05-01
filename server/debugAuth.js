import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import bcrypt from 'bcrypt';

dotenv.config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const user = await User.findOne({ email: 'admin@eagle.com' });
    if (!user) {
      console.log('User NOT FOUND');
      process.exit(1);
    }

    console.log('User found:', user.email);
    console.log('Hashed Password in DB:', user.password);

    const isMatch = await bcrypt.compare('password123', user.password);
    console.log('Does "password123" match?', isMatch);

    // If it doesn't match, let's try to fix it right now
    if (!isMatch) {
      console.log('Fixing password...');
      user.password = 'password123';
      await user.save();
      console.log('Password updated and re-hashed');
      
      const newMatch = await bcrypt.compare('password123', user.password);
      console.log('Does it match now?', newMatch);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

testLogin();
