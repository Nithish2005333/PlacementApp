const express = require('express');
const { auth } = require('../middleware/auth');
const Student = require('../models/Student');

const router = express.Router();

// dashboard helpers
router.get('/years', auth('admin'), (_req, res) => {
  res.json(['First', 'Second', 'Third', 'Fourth']);
});

router.get('/departments', auth('admin'), (_req, res) => {
  res.json(['CSE', 'AI&DS', 'Mech', 'ECE', 'EEE', 'VLSI']);
});

router.get('/students', auth('admin'), async (req, res) => {
  const { year, department } = req.query;
  const students = await Student.find({ year, department }).select('registerNumber name');
  res.json(students);
});

module.exports = router;



