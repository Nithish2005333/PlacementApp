const mongoose = require('mongoose');

async function connectMongo() {
  // Prefer env; fallback to provided SRV from user
  const uri = process.env.MONGODB_URI || 'mongodb+srv://placement_user:QuXJcxrr0BiUP2OV@cluster0.yqzgkin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: 'placement',
  });
  console.log('Connected to MongoDB');
}

module.exports = { connectMongo };


