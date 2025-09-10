const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  resume: String,
  portfolio: String,
  linkedin: String,
  github: String,
}, { _id: false });

const AcademicSchema = new mongoose.Schema({
  cgpa: Number,
  sgpa: [{ type: Number }],
  historyOfArrears: Number,
  currentArrears: Number,
  dateOfEntry: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { _id: false });

const PlacementSchema = new mongoose.Schema({
  achievements: String,
  internships: String,
  workExperience: String,
  certifications: String,
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registerNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },

  profilePhoto: String,
  dob: Date,
  age: Number,
  gender: String,
  collegeName: String,
  collegeAddress: String,
  address: String,
  phone: String,

  academic: AcademicSchema,
  placement: PlacementSchema,
  links: LinkSchema,
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);



