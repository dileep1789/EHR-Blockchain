// Seed default admin user into MongoDB Atlas
require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected!\n');

    // Load Admin model
    const adminSchema = new mongoose.Schema({
      admin_id:      { type: String, required: true, unique: true },
      username:      { type: String, required: true, unique: true },
      password_hash: { type: String, required: true },
    }, { timestamps: { createdAt: 'created_at' } });
    const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

    const username = 'admin';
    const password = 'admin123';

    const existing = await Admin.findOne({ username });
    if (existing) {
      console.log('✓ Admin user already exists');
      console.log('  Username:', existing.username);
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    await Admin.create({ admin_id: 'ADMIN001', username, password_hash });

    console.log('✅ Admin user created successfully!\n');
    console.log('Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
