const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Student register
router.post('/student/register', async (req, res) => {
  try {
    const { name, registerNumber, email, password, department, year } = req.body;
    if (!name || !registerNumber || !email || !password || !department || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const exists = await Student.findOne({ $or: [{ email }, { registerNumber }] });
    if (exists) return res.status(409).json({ error: 'Email or Register Number already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const student = await Student.create({ name, registerNumber, email, passwordHash, department, year, academic: { dateOfEntry: new Date() } });
    const token = signToken({ sub: student._id, role: 'student' });
    res.json({ token, student });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Student login
router.post('/student/login', async (req, res) => {
  try {
    const { registerNumber, password } = req.body;
    if (!registerNumber || !password) return res.status(400).json({ error: 'Missing credentials' });
    const student = await Student.findOne({ registerNumber });
    if (!student) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, student.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ sub: student._id, role: 'student' });
    res.json({ token, student });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin seed (aurccadmin / placementaurcc) - idempotent
router.post('/admin/seed', async (_req, res) => {
  try {
    const username = 'aurccadmin';
    const passwordHash = await bcrypt.hash('placementaurcc', 10);
    const existing = await Admin.findOne({ username });
    if (!existing) await Admin.create({ username, passwordHash });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ sub: admin._id, role: 'admin' });
    res.json({ token, admin: { username: admin.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


