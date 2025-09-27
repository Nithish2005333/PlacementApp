const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const PendingRegistration = require('../models/PendingRegistration');
// WhatsApp sender kept for backward compatibility in other routes (unused for email OTP)
const { sendOtpEmail } = require('../lib/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Send OTP via Email (register or email change)
router.post('/otp/send', async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Invalid email' });
    const usePurpose = purpose === 'email_change' ? 'email_change' : 'register';
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.deleteMany({ email: normalizedEmail, purpose: usePurpose });
    await OTP.create({ email: normalizedEmail, code, purpose: usePurpose, expiresAt });
    // Send email in background so API responds quickly
    (async () => {
      try {
        await sendOtpEmail(normalizedEmail, code, usePurpose === 'register' ? 'Registration Verification' : 'Email Change Verification');
        console.log(`OTP sent successfully to ${normalizedEmail}`);
      } catch (e) {
        console.error('OTP email send failed (background):', e?.message || e);
      }
    })();
    res.json({ ok: true });
  } catch (e) {
    console.error('OTP send error:', e);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP via Email
router.post('/otp/verify', async (req, res) => {
  try {
    const { email, purpose, code } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const usePurpose = purpose === 'email_change' ? 'email_change' : 'register';
    const otp = await OTP.findOne({ email: normalizedEmail, purpose: usePurpose });
    if (!otp) return res.status(400).json({ valid: false, error: 'OTP not found' });
    if (otp.expiresAt < new Date()) { await OTP.deleteOne({ _id: otp._id }); return res.status(400).json({ valid: false, error: 'OTP expired' }); }
    if (otp.code !== String(code || '')) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ valid: false, error: 'Invalid OTP' });
    }
    await OTP.deleteOne({ _id: otp._id });
    res.json({ valid: true });
  } catch (e) {
    console.error('OTP verify error:', e);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Student register (pending approval)
router.post('/student/register', async (req, res) => {
  try {
    const { name, registerNumber, email, phone, password, department, year } = req.body;
    if (!name || !registerNumber || !email || !password || !department || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if student already exists (approved only)
    const existingStudent = await Student.findOne({ 
      $or: [{ email }, { registerNumber }],
      registrationStatus: 'approved'
    });
    if (existingStudent) return res.status(409).json({ error: 'Email or Register Number already exists' });
    
    // Clean up any existing rejected students with same email/registerNumber
    await Student.deleteMany({ 
      $or: [{ email }, { registerNumber }],
      registrationStatus: { $in: ['rejected', 'pending'] }
    });
    
    // Check if pending registration already exists
    const existingPending = await PendingRegistration.findOne({ 
      $or: [{ email }, { registerNumber }]
    });
    if (existingPending) return res.status(409).json({ error: 'Registration already pending approval' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const phoneToSave = phone ? `91${phone.replace(/\D/g,'').slice(0,10)}` : undefined;
    
    // Store in PendingRegistration (not in Student table)
    const pendingRegistration = await PendingRegistration.create({ 
      name, 
      registerNumber, 
      email, 
      phone: phoneToSave, 
      passwordHash, 
      department, 
      year, 
      academic: { dateOfEntry: new Date() } 
    });
    
    // Notify student via email
    try {
      const { sendEmail } = require('../lib/email');
      await sendEmail({ 
        to: email, 
        subject: 'Registration Pending Approval', 
        html: `<p>Hi ${name},</p><p>Your registration is pending and awaiting representative verification. You will be notified once approved.</p>`, 
        text: `Hi ${name}, your registration is pending and awaiting representative verification.` 
      });
    } catch {}
    
    // Notify reps via email (per-rep token so public approval can include rep identity)
    try {
      const Admin = require('../models/Admin');
      const reps = await Admin.find({ role: 'rep', department, year, email: { $exists: true, $ne: null } }).lean();
      const { sendEmail } = require('../lib/email');
      const jwt = require('jsonwebtoken');
      const APPROVAL_SECRET = process.env.APPROVAL_SECRET || (process.env.JWT_SECRET || 'dev_secret_change_me');
      const base = process.env.SERVER_ORIGIN || process.env.CLIENT_ORIGIN || 'https://placementapp-0htf.onrender.com';
      await Promise.all((reps || []).map(async (r) => {
        const tokenPayload = { 
          pendingRegistrationId: String(pendingRegistration._id), 
          department, 
          year, 
          repId: String(r._id || ''), 
          repName: r.name || '', 
          repEmail: r.email || '' 
        };
        const token = jwt.sign(tokenPayload, APPROVAL_SECRET, { expiresIn: '3d' });
        const approveUrl = `${base}/api/public/approval?action=approve&token=${encodeURIComponent(token)}`;
        const rejectUrl = `${base}/api/public/approval?action=reject&token=${encodeURIComponent(token)}`;
        const bodyHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Student Registration Pending Approval</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto;background-color:#ffffff">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px 20px;text-align:center">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600">Placement App</h1>
              <p style="color:#e2e8f0;margin:10px 0 0 0;font-size:16px">Student Registration Portal</p>
            </div>
            
            <!-- Content -->
            <div style="padding:40px 30px">
              <h2 style="color:#1f2937;margin:0 0 20px 0;font-size:20px">New Student Registration Pending Approval</h2>
              <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 30px 0">
                A new student has registered and is waiting for your approval:
              </p>
              
              <!-- Student Details -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
                <h3 style="color:#1f2937;margin:0 0 15px 0;font-size:16px">Student Information:</h3>
                <ul style="color:#4b5563;margin:0;padding-left:20px;line-height:1.8">
                  <li><strong>Name:</strong> ${name}</li>
                  <li><strong>Register No:</strong> ${registerNumber}</li>
                  <li><strong>Email:</strong> ${email}</li>
                  <li><strong>Department/Year:</strong> ${department} / ${year}</li>
                </ul>
              </div>
              
              <!-- Action Buttons -->
              <div style="text-align:center;margin:30px 0">
                <a href="${approveUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;margin:0 10px">✅ Approve Student</a>
                <a href="${rejectUrl}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;margin:0 10px">❌ Reject Student</a>
              </div>
              
              <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:15px;margin:20px 0">
                <p style="color:#92400e;margin:0;font-size:14px;text-align:center">
                  <strong>📝 Note:</strong> If another representative has already approved or rejected this student, the buttons above will show the current status instead of action buttons.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
              <p style="color:#9ca3af;font-size:12px;margin:0">
                This is an automated message from Placement App. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>`;
        const text = `New registration pending: ${name} (${registerNumber}), ${department} ${year}. Approve: ${approveUrl} | Reject: ${rejectUrl}`;
        if (r?.email) {
          try { await sendEmail({ to: r.email, subject: 'New student registration pending', html: bodyHtml, text }); } catch {}
        }
      }));
    } catch {}
    
    res.status(201).json({ pending: true, message: 'Registration submitted. Pending approval.' });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Student login (only approved)
router.post('/student/login', async (req, res) => {
  try {
    const { registerNumber, password } = req.body;
    if (!registerNumber || !password) return res.status(400).json({ error: 'Missing credentials' });
    const student = await Student.findOne({ registerNumber });
    if (!student) return res.status(401).json({ error: 'Invalid register number' });
    const ok = await bcrypt.compare(password, student.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    if (student.registrationStatus && student.registrationStatus !== 'approved') {
      return res.status(403).json({ error: 'Registration pending approval. You will be notified by email once approved.' });
    }
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

// Admin or Rep login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Invalid username' });
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    const role = admin.role || 'admin';
    const token = signToken({ sub: admin._id, role, department: admin.department, year: admin.year, name: admin.name, email: admin.email });
    res.json({ token, admin: { username: admin.username, role, department: admin.department, year: admin.year, name: admin.name, email: admin.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});


// Forgot password - request OTP via Email
router.post('/student/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Invalid email' });
    
    // Check if student exists with this email
    const student = await Student.findOne({ email: normalizedEmail, registrationStatus: 'approved' });
    if (!student) {
      return res.status(404).json({ error: 'No registered student found with this email' });
    }
    
    // Generate and send OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Delete any existing forgot password OTPs for this email
    await OTP.deleteMany({ email: normalizedEmail, purpose: 'forgot_password' });
    
    // Create new OTP
    await OTP.create({ email: normalizedEmail, code, purpose: 'forgot_password', expiresAt });
    
    // Send Email in background
    try { 
      const { sendOtpEmail } = require('../lib/email');
      (async () => {
        try {
          await sendOtpEmail(normalizedEmail, code, 'Password Reset');
          console.log(`Password reset OTP sent successfully to ${normalizedEmail}`);
        } catch (e) {
          console.error('Password reset OTP email send failed (background):', e?.message || e); 
        }
      })();
    } catch {}
    
    res.json({ ok: true, message: 'OTP sent to your email' });
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP for forgot password (email)
router.post('/student/verify-forgot-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and OTP code are required' });
    
    const normalizedEmail = String(email).trim().toLowerCase();
    const otp = await OTP.findOne({ email: normalizedEmail, purpose: 'forgot_password' });
    
    if (!otp) return res.status(400).json({ valid: false, error: 'OTP not found' });
    if (otp.expiresAt < new Date()) { 
      await OTP.deleteOne({ _id: otp._id }); 
      return res.status(400).json({ valid: false, error: 'OTP expired' }); 
    }
    if (otp.code !== String(code)) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ valid: false, error: 'Invalid OTP' });
    }
    
    // OTP is valid, delete it and return success
    await OTP.deleteOne({ _id: otp._id });
    res.json({ valid: true, message: 'OTP verified successfully' });
  } catch (e) {
    console.error('Verify forgot OTP error:', e);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Reset password after OTP verification (email)
router.post('/student/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirm password do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    const normalizedEmail = String(email).trim().toLowerCase();
    
    // Find student
    const student = await Student.findOne({ email: normalizedEmail, registrationStatus: 'approved' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // No old password check in OTP-based reset
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await Student.findByIdAndUpdate(student._id, { passwordHash: newPasswordHash });
    
    // Send confirmation email (best-effort)
    try {
      const { sendEmail } = require('../lib/email');
      await sendEmail({ to: normalizedEmail, subject: 'Password Reset Successful', html: `<p>Your Placement App password has been updated successfully.</p>`, text: 'Your Placement App password has been updated successfully.' });
    } catch {}
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;


