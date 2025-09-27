const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  // Roles: 'admin' (main), 'staff' (assistant admin), 'rep' (department/year rep)
  role: { type: String, enum: ['admin', 'staff', 'rep'], default: 'admin' },
  // For representatives
  name: { type: String, trim: true },
  email: { type: String, trim: true, index: true },
  department: { type: String },
  year: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);



