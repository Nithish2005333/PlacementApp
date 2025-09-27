const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);


