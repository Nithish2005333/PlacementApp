const express = require('express');
const { auth } = require('../middleware/auth');
const Student = require('../models/Student');

const router = express.Router();

// Get my profile
router.get('/me', auth('student'), async (req, res) => {
  const me = await Student.findById(req.user.sub);
  if (!me) return res.status(404).json({ error: 'Not found' });

  // Build a plain object and normalize currentSemester for consistent clients
  const obj = me.toObject({ getters: false, virtuals: false });
  const rawCs = obj?.academic?.currentSemester ?? obj?.currentSemester;
  const csNum = Number(rawCs);
  if (Number.isFinite(csNum) && csNum >= 1 && csNum <= 8) {
    obj.currentSemester = csNum;
    obj.academic = { ...(obj.academic || {}), currentSemester: csNum };
    // Persist back into DB if missing in either location
    const needTop = obj.currentSemester !== me.currentSemester;
    const needNested = me?.academic?.currentSemester !== csNum;
    if (needTop || needNested) {
      await Student.updateOne(
        { _id: me._id },
        { $set: { currentSemester: csNum, 'academic.currentSemester': csNum } }
      );
    }
  }

  // Do not auto-calculate CGPA here; show what user saved from Edit Profile
  res.json(obj);
});

// Update my profile (student)
router.put('/me', auth('student'), async (req, res) => {
  try {
    const body = req.body || {};
    // Normalize currentSemester from either location and write to both
    const rawCs = body?.academic?.currentSemester ?? body?.currentSemester;
    const csNum = Number(rawCs);
    if (Number.isFinite(csNum) && csNum >= 1 && csNum <= 8) {
      body.currentSemester = csNum;
      body.academic = { ...(body.academic || {}), currentSemester: csNum };
    }

    // Flatten nested objects so we $set dot-paths and avoid replacing entire subdocuments
    function flatten(prefix, value, out) {
      if (value === undefined) return out;
      if (value === null) {
        out[prefix] = null;
        return out;
      }
      const isPlainObject = Object.prototype.toString.call(value) === '[object Object]';
      if (isPlainObject) {
        for (const key of Object.keys(value)) {
          const next = prefix ? `${prefix}.${key}` : key;
          flatten(next, value[key], out);
        }
      } else {
        out[prefix] = value;
      }
      return out;
    }

    const set = flatten('', body, {});
    // If academic.currentSemester provided, mirror to top-level currentSemester for backward compatibility
    if (set['academic.currentSemester'] !== undefined) {
      set.currentSemester = set['academic.currentSemester'];
    }
    // If top-level currentSemester provided, mirror back into nested academic.currentSemester
    if (set.currentSemester !== undefined && set['academic.currentSemester'] === undefined) {
      set['academic.currentSemester'] = set.currentSemester;
    }

    const me = await Student.findByIdAndUpdate(
      req.user.sub,
      { $set: set },
      { new: true, runValidators: true, omitUndefined: true }
    );
    res.json(me);
  } catch (e) {
    console.error('Update /me error:', e);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Admin: list students by year and department
router.get('/', auth(['admin','staff','rep']), async (req, res) => {
  const { year, department } = req.query;
  const filter = {};
  if (year) filter.year = year;
  if (department) filter.department = department;
  // Staff are scoped to their own department
  if (req.user?.role === 'staff' && req.user?.department) {
    filter.department = req.user.department;
  }
  // Reps are scoped to their own department and year
  if (req.user?.role === 'rep') {
    if (req.user?.department) filter.department = req.user.department;
    if (req.user?.year) filter.year = req.user.year;
  }
  const students = await Student.find(filter).select('registerNumber name department year profilePhoto');
  res.json(students);
});

// Admin: filter students with advanced criteria
router.get('/filter', auth(['admin','staff','rep']), async (req, res) => {
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
      gender 
    } = req.query;
    
    const filter = {};
    
    // Basic filters
    if (year) filter.year = year;
    if (department) filter.department = department;
    if (req.user?.role === 'staff' && req.user?.department) {
      filter.department = req.user.department;
    }
    if (req.user?.role === 'rep') {
      if (req.user?.department) filter.department = req.user.department;
      if (req.user?.year) filter.year = req.user.year;
    }
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
    
    // Technical skills
    if (technicalSkills) {
      const skills = technicalSkills.split(',').filter(s => s.trim());
      if (skills.length > 0) {
        filter['placement.technicalSkills'] = { $in: skills };
      }
    }
    
    // Soft skills
    if (softSkills) {
      const skills = softSkills.split(',').filter(s => s.trim());
      if (skills.length > 0) {
        filter['placement.logicalSkills'] = { $in: skills };
      }
    }
    
    console.log('Filter query:', JSON.stringify(filter, null, 2));
    const students = await Student.find(filter).select('registerNumber name department year profilePhoto');
    console.log('Found students:', students.length);
    res.json(students);
  } catch (error) {
    console.error('Filter students error:', error);
    res.status(500).json({ error: 'Failed to filter students' });
  }
});

// Admin: get student by registration number
router.get('/register/:registerNumber', auth(['admin','staff']), async (req, res) => {
  try {
    console.log('Looking for student with registration number:', req.params.registerNumber);
    const student = await Student.findOne({ registerNumber: req.params.registerNumber }).select('-password');
    if (!student) {
      console.log('Student not found with registration number:', req.params.registerNumber);
      return res.status(404).json({ error: 'Student not found' });
    }
    console.log('Found student:', student.name, student.registerNumber);
    res.json(student);
  } catch (error) {
    console.error('Error fetching student by registration number:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Admin: get student by id
router.get('/:id', auth(), async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

// Admin: update student by id
router.put('/:id', auth(['admin','staff']), async (req, res) => {
  try {
    console.log('Updating student with ID:', req.params.id);
    console.log('Update data received:', JSON.stringify(req.body, null, 2));
    
    const s = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ error: 'Not found' });
    
    console.log('Student updated successfully:', s.name);
    console.log('Updated academic data:', JSON.stringify(s.academic, null, 2));
    
    res.json(s);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Dedicated route for updating semester data
router.put('/:id/semester', auth(['admin','staff']), async (req, res) => {
  try {
    const { semesterNumber, subjects, sgpa, totalCredits } = req.body;
    console.log('Updating semester data for student:', req.params.id);
    console.log('Semester data:', { semesterNumber, subjects, sgpa, totalCredits });
    
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    // Initialize academic data if not exists
    if (!student.academic) {
      student.academic = { semesters: [] };
    }
    if (!student.academic.semesters) {
      student.academic.semesters = [];
    }
    
    // Find existing semester - only update if it exists
    console.log(`Looking for semester ${semesterNumber} (type: ${typeof semesterNumber}) in student's semesters:`, student.academic.semesters.map(s => `${s.semesterNumber} (${typeof s.semesterNumber})`));
    const existingSemesterIndex = student.academic.semesters.findIndex(s => s.semesterNumber === semesterNumber);
    console.log(`Found semester at index: ${existingSemesterIndex}`);
    
    // Also try with string comparison
    const stringSemesterIndex = student.academic.semesters.findIndex(s => String(s.semesterNumber) === String(semesterNumber));
    console.log(`Found semester with string comparison at index: ${stringSemesterIndex}`);
    
    // Use string comparison as fallback if exact match fails
    const finalSemesterIndex = existingSemesterIndex >= 0 ? existingSemesterIndex : stringSemesterIndex;
    
    if (finalSemesterIndex >= 0) {
      // Merge into existing semester by subjectCode (fallback to subjectName)
      console.log(`Merging existing semester ${semesterNumber} for student ${student.name} at index ${finalSemesterIndex}`);
      const existing = student.academic.semesters[finalSemesterIndex] || { subjects: [] };
      const mergedSubjects = Array.isArray(existing.subjects) ? [...existing.subjects] : [];

      const indexByKey = new Map();
      mergedSubjects.forEach((subj, idx) => {
        const key = (subj.subjectCode || subj.code || subj.subjectName || '').toString().trim().toUpperCase();
        if (key) indexByKey.set(key, idx);
      });

      (subjects || []).forEach((incoming) => {
        const key = (incoming.subjectCode || incoming.code || incoming.subjectName || '').toString().trim().toUpperCase();
        if (!key) return;
        const idx = indexByKey.get(key);
        if (idx !== undefined) {
          // Update existing subject entry
          mergedSubjects[idx] = {
            ...mergedSubjects[idx],
            ...incoming,
          };
        } else {
          mergedSubjects.push(incoming);
          indexByKey.set(key, mergedSubjects.length - 1);
        }
      });

      // Recalculate totalCredits and sgpa if points/grades present; else keep provided values
      const newTotalCredits = mergedSubjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
      let newSgpa = Number(sgpa || 0);
      const hasPoints = mergedSubjects.some(s => s.points !== undefined && s.points !== null);
      if (hasPoints && newTotalCredits > 0) {
        const num = mergedSubjects.reduce((sum, s) => sum + ((Number(s.points) || 0) * (Number(s.credits) || 0)), 0);
        newSgpa = Number((num / newTotalCredits).toFixed(2));
      }

      student.academic.semesters[finalSemesterIndex] = {
        semesterNumber,
        subjects: mergedSubjects,
        sgpa: newSgpa,
        totalCredits: newTotalCredits,
      };
      console.log(`Merged semester data:`, JSON.stringify(student.academic.semesters[finalSemesterIndex], null, 2));
    } else {
      // Always allow adding new semesters - be more permissive
      console.log(`Adding new semester ${semesterNumber} for student ${student.name}`);
      student.academic.semesters.push({
        semesterNumber,
        subjects,
        sgpa,
        totalCredits
      });
      console.log(`Added semester ${semesterNumber}. Total semesters now: ${student.academic.semesters.length}`);
    }
    
    // Calculate CGPA
    let totalGradePoints = 0;
    let totalCreditsAll = 0;
    
    student.academic.semesters.forEach(semester => {
      if (semester.sgpa && semester.totalCredits) {
        totalGradePoints += semester.sgpa * semester.totalCredits;
        totalCreditsAll += semester.totalCredits;
      }
    });
    
    student.academic.cgpa = totalCreditsAll > 0 ? Number((totalGradePoints / totalCreditsAll).toFixed(2)) : 0;
    
    await student.save();
    
    console.log('Semester data updated successfully');
    console.log('Updated CGPA:', student.academic.cgpa);
    console.log('Total semesters now:', student.academic.semesters.length);
    console.log('Semester data:', JSON.stringify(student.academic.semesters, null, 2));
    
    res.json(student);
  } catch (error) {
    console.error('Error updating semester data:', error);
    res.status(500).json({ error: 'Failed to update semester data' });
  }
});

module.exports = router;



