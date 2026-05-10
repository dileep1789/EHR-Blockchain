// MongoDB connection using Mongoose (direct connection string)
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env file');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  family: 4,
})
.then(() => {
  console.log('✅ MongoDB Atlas connected successfully');
  console.log('📦 Database:', mongoose.connection.db.databaseName);
})
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.error('💡 Server will keep running but DB operations will fail.');
});

module.exports = mongoose;
