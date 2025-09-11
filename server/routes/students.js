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
router.get('/', auth('admin'), async (req, res) => {
  const { year, department } = req.query;
  const filter = {};
  if (year) filter.year = year;
  if (department) filter.department = department;
  const students = await Student.find(filter).select('registerNumber name department year');
  res.json(students);
});

// Admin: get student by id
router.get('/:id', auth(), async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

// Admin: update student by id
router.put('/:id', auth('admin'), async (req, res) => {
  const s = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

module.exports = router;



