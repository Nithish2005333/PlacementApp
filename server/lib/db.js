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
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Mongo connection error:', err?.message || err);
    throw err;
  }
}

module.exports = { connectMongo };


