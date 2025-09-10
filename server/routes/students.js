const express = require('express');
const { auth } = require('../middleware/auth');
const Student = require('../models/Student');

const router = express.Router();

// Get my profile
router.get('/me', auth('student'), async (req, res) => {
  const me = await Student.findById(req.user.sub);
  res.json(me);
});

// Update my profile (student)
router.put('/me', auth('student'), async (req, res) => {
  const update = req.body;
  const me = await Student.findByIdAndUpdate(req.user.sub, update, { new: true });
  res.json(me);
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



