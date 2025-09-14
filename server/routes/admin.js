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

// Admin: filter students with advanced criteria
router.get('/students/filter', auth('admin'), async (req, res) => {
  try {
    const { 
      year, 
      department, 
      willingToPlace, 
      historyOfArrears, 
      currentArrears, 
      cgpaRange, 
      technicalSkills, 
      softSkills, 
      gender,
      hscPercentage,
      sslcPercentage,
      hasInternship,
      hasProjects,
      hasCertifications,
      currentSemester
    } = req.query;
    
    const filter = {};
    
    // Basic filters
    if (year) filter.year = year;
    if (department) filter.department = department;
    if (gender) filter.gender = gender;
    
    // Placement willingness
    if (willingToPlace) {
      const values = willingToPlace.split(',').filter(v => v.trim());
      if (values.length === 1) {
        filter['placement.willingToPlace'] = values[0] === 'true';
      } else if (values.length > 1) {
        filter['placement.willingToPlace'] = { $in: values.map(v => v === 'true') };
      }
    }
    
    // History of arrears
    if (historyOfArrears) {
      const values = historyOfArrears.split(',').filter(v => v.trim());
      if (values.includes('none') && values.includes('has')) {
        // Both selected, no filter needed
      } else if (values.includes('none')) {
        filter['academic.historyOfArrears'] = { $eq: 0 };
      } else if (values.includes('has')) {
        filter['academic.historyOfArrears'] = { $gt: 0 };
      }
    }
    
    // Current arrears
    if (currentArrears) {
      const values = currentArrears.split(',').filter(v => v.trim());
      if (values.includes('none') && values.includes('has')) {
        // Both selected, no filter needed
      } else if (values.includes('none')) {
        filter['academic.currentArrears'] = { $eq: 0 };
      } else if (values.includes('has')) {
        filter['academic.currentArrears'] = { $gt: 0 };
      }
    }
    
    // CGPA range
    if (cgpaRange) {
      const cgpaValue = parseFloat(cgpaRange.replace('+', ''));
      if (!isNaN(cgpaValue)) {
        filter['academic.cgpa'] = { $gte: cgpaValue };
      }
    }
    
    // Technical skills (case-insensitive)
    if (technicalSkills) {
      const skills = technicalSkills.split(',').filter(s => s.trim());
      if (skills.length > 0) {
        filter['placement.technicalSkills'] = { 
          $in: skills.map(skill => new RegExp(`^${skill.trim()}$`, 'i'))
        };
      }
    }
    
    // Soft skills (case-insensitive)
    if (softSkills) {
      const skills = softSkills.split(',').filter(s => s.trim());
      if (skills.length > 0) {
        filter['placement.logicalSkills'] = { 
          $in: skills.map(skill => new RegExp(`^${skill.trim()}$`, 'i'))
        };
      }
    }
    
    // HSC Percentage
    if (hscPercentage) {
      const hscValue = parseFloat(hscPercentage.replace('+', ''));
      if (!isNaN(hscValue)) {
        filter['academic.hscPercentage'] = { $gte: hscValue };
      }
    }
    
    // SSLC Percentage
    if (sslcPercentage) {
      const sslcValue = parseFloat(sslcPercentage.replace('+', ''));
      if (!isNaN(sslcValue)) {
        filter['academic.sslcPercentage'] = { $gte: sslcValue };
      }
    }
    
    // Has Internship
    if (hasInternship) {
      const values = hasInternship.split(',').filter(v => v.trim());
      if (values.includes('yes') && values.includes('no')) {
        // Both selected, no filter needed
      } else if (values.includes('yes')) {
        filter['placement.internships'] = { $exists: true, $ne: '', $ne: null };
      } else if (values.includes('no')) {
        filter.$or = filter.$or || [];
        filter.$or.push({
          'placement.internships': { $exists: false }
        });
        filter.$or.push({
          'placement.internships': ''
        });
        filter.$or.push({
          'placement.internships': null
        });
      }
    }
    
    // Has Projects
    if (hasProjects) {
      const values = hasProjects.split(',').filter(v => v.trim());
      if (values.includes('yes') && values.includes('no')) {
        // Both selected, no filter needed
      } else if (values.includes('yes')) {
        filter['placement.projects'] = { $exists: true, $ne: '', $ne: null };
      } else if (values.includes('no')) {
        filter.$or = filter.$or || [];
        filter.$or.push({
          'placement.projects': { $exists: false }
        });
        filter.$or.push({
          'placement.projects': ''
        });
        filter.$or.push({
          'placement.projects': null
        });
      }
    }
    
    // Has Certifications
    if (hasCertifications) {
      const values = hasCertifications.split(',').filter(v => v.trim());
      if (values.includes('yes') && values.includes('no')) {
        // Both selected, no filter needed
      } else if (values.includes('yes')) {
        filter['placement.certifications'] = { $exists: true, $ne: '', $ne: null };
      } else if (values.includes('no')) {
        filter.$or = filter.$or || [];
        filter.$or.push({
          'placement.certifications': { $exists: false }
        });
        filter.$or.push({
          'placement.certifications': ''
        });
        filter.$or.push({
          'placement.certifications': null
        });
      }
    }
    
    // Current semester
    if (currentSemester) {
      const semester = parseInt(currentSemester);
      if (!isNaN(semester)) {
        filter.$or = [
          { currentSemester: semester },
          { 'academic.currentSemester': semester }
        ];
      }
    }
    
    console.log('Admin filter query:', JSON.stringify(filter, null, 2));
    
    // For debugging - let's also check what data we have
    if (hasProjects || hasCertifications) {
      const sampleStudents = await Student.find({}).select('registerNumber name placement.projects placement.certifications').limit(3);
      console.log('Sample students data:', JSON.stringify(sampleStudents, null, 2));
    }
    
    const students = await Student.find(filter).select('registerNumber name department year');
    console.log('Found students:', students.length);
    res.json(students);
  } catch (error) {
    console.error('Admin filter students error:', error);
    res.status(500).json({ error: 'Failed to filter students' });
  }
});

// Admin verification endpoint
router.post('/verify', auth('admin'), async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get the current admin from the token
    const Admin = require('../models/Admin');
    const currentAdmin = await Admin.findById(req.user.sub);
    
    if (!currentAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify credentials match the current admin
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, currentAdmin.passwordHash);
    const isValidUsername = currentAdmin.username === username;

    if (isValidUsername && isValidPassword) {
      res.json({ valid: true, message: 'Credentials verified' });
    } else {
      res.json({ valid: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Failed to verify admin credentials' });
  }
});

// Bulk delete students
router.post('/students/bulk-delete', auth('admin'), async (req, res) => {
  try {
    const { studentIds, year, department } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Student IDs are required' });
    }

    if (!year || !department) {
      return res.status(400).json({ error: 'Year and department are required' });
    }

    // Verify that all students belong to the specified year and department
    const students = await Student.find({ 
      _id: { $in: studentIds },
      year,
      department 
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ 
        error: 'Some students do not belong to the specified year and department' 
      });
    }

    // Delete profile photos from Cloudinary for all students
    const deletePromises = students.map(async (student) => {
      if (student.profilePhotoPublicId) {
        try {
          await cloudinary.uploader.destroy(student.profilePhotoPublicId);
        } catch (e) {
          console.warn('Cloudinary destroy failed for bulk delete (continuing):', e?.message || e);
        }
      }
    });

    await Promise.all(deletePromises);

    // Delete all students
    const result = await Student.deleteMany({ 
      _id: { $in: studentIds },
      year,
      department 
    });

    console.log(`Bulk deleted ${result.deletedCount} students from ${department} ${year}`);
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} student(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete students error:', error);
    res.status(500).json({ error: 'Failed to delete students' });
  }
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



