const express = require('express');
const { auth } = require('../middleware/auth');
const Student = require('../models/Student');
const { cloudinary } = require('../lib/cloudinary');

const router = express.Router();

// dashboard helpers
router.get('/years', auth('admin'), (_req, res) => {
  res.json(['First', 'Second', 'Third', 'Final']);
});

router.get('/departments', auth('admin'), (_req, res) => {
  res.json(['CSE', 'AI&DS', 'Mech', 'ECE', 'EEE', 'VLSI']);
});

router.get('/students', auth('admin'), async (req, res) => {
  const { year, department } = req.query;
  console.log('Admin students query:', { department, year });
  
  // Create flexible year matching
  let yearFilter = year;
  if (year === 'Final') {
    // Match Final, Fourth, 4th Year, etc.
    yearFilter = { $in: ['Final', 'Fourth', '4th Year', '4th', '4'] };
  } else if (year === 'First') {
    yearFilter = { $in: ['First', '1st Year', '1st', '1'] };
  } else if (year === 'Second') {
    yearFilter = { $in: ['Second', '2nd Year', '2nd', '2'] };
  } else if (year === 'Third') {
    yearFilter = { $in: ['Third', '3rd Year', '3rd', '3'] };
  }
  
  const students = await Student.find({ department, year: yearFilter }).select('registerNumber name');
  console.log('Found students with criteria:', students.length);
  
  res.json(students);
});

// Delete student by ID
router.delete('/students/:id', auth('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    // Attempt to delete profile photo from Cloudinary if present
    if (student.profilePhotoPublicId) {
      try {
        await cloudinary.uploader.destroy(student.profilePhotoPublicId);
      } catch (e) {
        console.warn('Cloudinary destroy failed for admin student delete (continuing):', e?.message || e);
      }
    }
    
    console.log('Deleted student:', student.registerNumber);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Admin: remove only the student's profile photo
router.delete('/students/:id/profile-photo', auth('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (student.profilePhotoPublicId) {
      try {
        await cloudinary.uploader.destroy(student.profilePhotoPublicId);
      } catch (e) {
        console.warn('Cloudinary destroy failed (admin photo delete):', e?.message || e);
      }
    }

    await Student.findByIdAndUpdate(id, { $unset: { profilePhoto: 1, profilePhotoPublicId: 1 } });
    res.json({ message: 'Student profile photo removed' });
  } catch (error) {
    console.error('Admin remove profile photo error:', error);
    res.status(500).json({ error: 'Failed to remove profile photo' });
  }
});

module.exports = router;



