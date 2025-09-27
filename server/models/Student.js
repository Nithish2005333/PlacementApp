const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  resume: String,
  portfolio: String,
  linkedin: String,
  github: String,
}, { _id: false });

const SubjectSchema = new mongoose.Schema({
  subjectName: String,
  subjectCode: String,
  credits: Number,
  grade: String,
  points: Number
}, { _id: false });

const SemesterSchema = new mongoose.Schema({
  semesterNumber: { type: Number, required: true },
  subjects: [SubjectSchema],
  sgpa: Number,
  totalCredits: Number,
  earnedCredits: Number
}, { _id: false });

const AcademicSchema = new mongoose.Schema({
  cgpa: Number,
  sgpa: [{ type: Number }],
  semesters: [SemesterSchema],
  historyOfArrears: Number,
  currentArrears: Number,
  // New fields for secondary education percentages
  hscPercentage: Number,
  sslcPercentage: Number,
  dateOfEntry: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  currentSemester: { type: Number, min: 1, max: 8 }
}, { _id: false });

const PlacementSchema = new mongoose.Schema({
  achievements: String,
  internships: String,
  workExperience: String,
  projects: String,
  certifications: String,
  technicalSkills: [String],
  logicalSkills: [String],
  willingToPlace: { type: Boolean, default: true },
  placementPreference: String,
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registerNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },

  profilePhoto: String,
  // Cloudinary public id for the profile photo (used for deletion)
  profilePhotoPublicId: String,
  dob: Date,
  age: Number,
  gender: String,
  collegeName: String,
  collegeAddress: String,
  address: String,
  phone: String,
  phoneVerified: { type: Boolean, default: false },
  registrationStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
    currentSemester: { type: Number, min: 1, max: 8 },

  academic: AcademicSchema,
  placement: PlacementSchema,
  links: LinkSchema,
  // Mirror of academic.currentSemester for quick reads and compatibility
  
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);



