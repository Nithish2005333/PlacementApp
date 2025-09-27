const mongoose = require('mongoose');

async function connectMongo() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.MONGO_URI ||
    'mongodb+srv://placement_user:QuXJcxrr0BiUP2OV@cluster0.yqzgkin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  
  mongoose.set('strictQuery', true);
  
  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB || 'placement',
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err?.message || err);
    
    // Provide helpful error messages for common issues
    if (err.message.includes('IP that isn\'t whitelisted')) {
      console.error('\n🔧 SOLUTION: Add your IP address to MongoDB Atlas Network Access:');
      console.error('1. Go to https://cloud.mongodb.com');
      console.error('2. Navigate to Network Access');
      console.error('3. Click "Add IP Address"');
      console.error('4. Add your current IP or use "Add Current IP Address"');
      console.error('5. For development, you can temporarily add 0.0.0.0/0 (allows all IPs)\n');
    }
    
    throw err;
  }
}

module.exports = { connectMongo };


