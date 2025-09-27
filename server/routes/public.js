const express = require('express');
const Department = require('../models/Department');
const { getDepartments } = require('../lib/deptCache');

const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const PendingRegistration = require('../models/PendingRegistration');

const APPROVAL_SECRET = process.env.APPROVAL_SECRET || (process.env.JWT_SECRET || 'dev_secret_change_me');
const { sendEmail } = require('../lib/email');

// Public: list departments for dropdowns (no auth)
router.get('/departments', async (_req, res) => {
  try {
    const cached = getDepartments().list;
    let dbDepts = cached && cached.length > 0 ? cached : await Department.find({}).sort({ name: 1 }).lean();
    const defaults = [
      { name: 'CSE', fullName: 'Computer Science & Engineering' },
      { name: 'AI&DS', fullName: 'Artificial Intelligence & Data Science' },
      { name: 'Mech', fullName: 'Mechanical Engineering' },
      { name: 'ECE', fullName: 'Electronics & Communication Engineering' },
      { name: 'EEE', fullName: 'Electrical & Electronics Engineering' },
      { name: 'VLSI', fullName: 'VLSI Design' },
    ];
    const fromDb = (dbDepts || []).map(d => ({ name: d.name, fullName: d.fullName || d.name }));
    // Merge DB + defaults, de-duplicate by name (case-insensitive), sort
    const seen = new Set();
    const merged = [];
    [...fromDb, ...defaults].forEach(d => {
      const key = String(d.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push({ name: d.name, fullName: d.fullName || d.name });
    });
    merged.sort((a, b) => a.name.localeCompare(b.name));
    res.json(merged);
  } catch (e) {
    console.error('Public list departments error:', e);
    // Fallback to defaults instead of failing, so UI always has options
    res.json([
      { name: 'CSE', fullName: 'Computer Science & Engineering' },
      { name: 'AI&DS', fullName: 'Artificial Intelligence & Data Science' },
      { name: 'Mech', fullName: 'Mechanical Engineering' },
      { name: 'ECE', fullName: 'Electronics & Communication Engineering' },
      { name: 'EEE', fullName: 'Electrical & Electronics Engineering' },
      { name: 'VLSI', fullName: 'VLSI Design' },
    ]);
  }
});

module.exports = router;

// Check student status (public GET)
router.get('/status', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) return res.status(400).json({ error: 'Missing token' });
    const decoded = jwt.verify(String(token), APPROVAL_SECRET);
    const { studentId, department, year } = decoded || {};
    const student = await Student.findById(studentId);
    if (!student || student.department !== department || student.year !== year) {
      return res.status(404).json({ error: 'Student not found or scope mismatch' });
    }
    res.json({ 
      status: student.registrationStatus,
      student: {
        name: student.name,
        registerNumber: student.registerNumber,
        email: student.email,
        department: student.department,
        year: student.year
      }
    });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// Token-based approve/reject links (public GET)
router.get('/approval', async (req, res) => {
  try {
    const { token, action } = req.query || {};
    if (!token || !action) return res.status(400).json({ error: 'Missing token or action' });
    const decoded = jwt.verify(String(token), APPROVAL_SECRET);
    const { pendingRegistrationId, department, year, repId, repName, repEmail } = decoded || {};
    const pendingRegistration = await PendingRegistration.findById(pendingRegistrationId);
    if (!pendingRegistration || pendingRegistration.department !== department || pendingRegistration.year !== year) {
      return res.status(404).send('Pending registration not found or scope mismatch');
    }
    
    
    if (action === 'approve') {
      // Create student record in Student table
      const student = await Student.create({
        name: pendingRegistration.name,
        registerNumber: pendingRegistration.registerNumber,
        email: pendingRegistration.email,
        phone: pendingRegistration.phone,
        passwordHash: pendingRegistration.passwordHash,
        department: pendingRegistration.department,
        year: pendingRegistration.year,
        academic: pendingRegistration.academic,
        registrationStatus: 'approved'
      });
      
      // Delete from PendingRegistration
      await PendingRegistration.deleteOne({ _id: pendingRegistrationId });
      
      // Notify student of approval
      try {
        const approverInfo = repName || repEmail ? ` by ${repName || 'Representative'} (${repEmail || ''})` : '';
        await sendEmail({
          to: student.email,
          subject: 'Registration Approved - Welcome to Placement App',
          html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Approved</title>
          </head>
          <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif">
            <div style="max-width:600px;margin:0 auto;background-color:#ffffff">
              <!-- Header -->
              <div style="background:linear-gradient(135deg,#16a34a 0%,#22c55e 100%);padding:30px 20px;text-align:center">
                <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600">🎉 Registration Approved!</h1>
                <p style="color:#dcfce7;margin:10px 0 0 0;font-size:16px">Welcome to Placement App</p>
              </div>
              
              <!-- Content -->
              <div style="padding:40px 30px">
                <h2 style="color:#1f2937;margin:0 0 20px 0;font-size:20px">Congratulations ${student.name}!</h2>
                <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 30px 0">
                  Your registration has been successfully approved${approverInfo}. You can now access the Placement App and start using all the features.
                </p>
                
                <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
                  <h3 style="color:#16a34a;margin:0 0 10px 0;font-size:18px">✅ Account Status: Active</h3>
                  <p style="color:#166534;margin:0;font-size:14px">You can now login to your account</p>
                </div>
                
                <div style="text-align:center;margin:30px 0">
                  <a href="https://placementapp-0htf.onrender.com/login" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">🚀 Login to Placement App</a>
                </div>
                
                <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:15px;margin:20px 0">
                  <p style="color:#92400e;margin:0;font-size:14px;text-align:center">
                    <strong>📧 Important:</strong> If you don't see this email in your inbox, please check your <strong>spam/junk folder</strong> and mark it as "Not Spam" to receive future emails.
                  </p>
                </div>
                
                <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:30px 0 0 0">
                  If you have any questions or need assistance, please contact your department representative.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
                <p style="color:#9ca3af;font-size:12px;margin:0">
                  This is an automated message from Placement App. Please do not reply to this email.
                </p>
              </div>
            </div>
          </body>
          </html>`,
          text: `Hi ${student.name}, your registration has been approved${approverInfo}. You can now login to your account at https://placementapp-1t8j.onrender.com/login`
        });
      } catch {}
      
      // Notify all other reps in the same dept/year that this student is already approved
      try {
        const Admin = require('../models/Admin');
        const otherReps = await Admin.find({ 
          role: 'rep', 
          department: student.department, 
          year: student.year, 
          email: { $exists: true, $ne: null },
          _id: { $ne: repId } // Exclude the rep who approved
        }).lean();
        
        const { sendEmail } = require('../lib/email');
        await Promise.all(otherReps.map(async (rep) => {
          try {
            await sendEmail({
              to: rep.email,
              subject: 'Student Registration Already Approved',
              html: `
                <p>Hello ${rep.name || 'Representative'},</p>
                <p>The following student registration has already been approved by another representative:</p>
                <ul>
                  <li>Name: ${student.name}</li>
                  <li>Register No: ${student.registerNumber}</li>
                  <li>Email: ${student.email}</li>
                  <li>Department/Year: ${student.department} / ${student.year}</li>
                </ul>
                <p>Status: <strong style="color: #16a34a;">Already Approved</strong></p>
                <p>You no longer need to take action on this registration.</p>
              `,
              text: `Student ${student.name} (${student.registerNumber}) from ${student.department} ${student.year} has already been approved by another representative. Status: Already Approved.`
            });
          } catch {}
        }));
      } catch {}
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Student Approved</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { padding: 20px; background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; text-align: center; color: #16a34a; }
            .info { margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; }
          </style>
        </head>
        <body>
          <h2>Student Registration Approved</h2>
          <div class="success">
            <h3>✅ Student Approved Successfully</h3>
            <p>The student can now login to the system.</p>
          </div>
          <div class="info">
            <p><strong>Student Details:</strong></p>
            <ul>
              <li>Name: ${student.name}</li>
              <li>Register No: ${student.registerNumber}</li>
              <li>Email: ${student.email}</li>
              <li>Department/Year: ${student.department} / ${student.year}</li>
            </ul>
            <p>All other representatives in the same department and year have been notified that this student has been approved.</p>
          </div>
        </body>
        </html>
      `);
    }
    if (action === 'reject') {
      // Simply delete from PendingRegistration (no student record created)
      await PendingRegistration.deleteOne({ _id: pendingRegistrationId });
      
      // Notify student of rejection with rep contact if available
      try {
        const contactHtml = repName || repEmail ? `<p>Please contact ${repName || 'your representative'} at ${repEmail || ''} for assistance.</p>` : '<p>Please contact your placement representative for assistance.</p>';
        await sendEmail({
          to: pendingRegistration.email,
          subject: 'Registration Rejected',
          html: `<p>Hi ${pendingRegistration.name},</p><p>Your registration could not be verified at this time.</p><p>You can try registering again with the same email and register number.</p>${contactHtml}`,
          text: `Hi ${pendingRegistration.name}, your registration could not be verified at this time. You can try registering again. Contact: ${repName || 'representative'} ${repEmail || ''}`
        });
      } catch {}
      
      // Notify all other reps in the same dept/year that this student is already rejected
      try {
        const Admin = require('../models/Admin');
        const otherReps = await Admin.find({ 
          role: 'rep', 
          department: pendingRegistration.department, 
          year: pendingRegistration.year, 
          email: { $exists: true, $ne: null },
          _id: { $ne: repId } // Exclude the rep who rejected
        }).lean();
        
        const { sendEmail } = require('../lib/email');
        await Promise.all(otherReps.map(async (rep) => {
          try {
            await sendEmail({
              to: rep.email,
              subject: 'Student Registration Already Rejected',
              html: `
                <p>Hello ${rep.name || 'Representative'},</p>
                <p>The following student registration has already been rejected by another representative:</p>
                <ul>
                  <li>Name: ${pendingRegistration.name}</li>
                  <li>Register No: ${pendingRegistration.registerNumber}</li>
                  <li>Email: ${pendingRegistration.email}</li>
                  <li>Department/Year: ${pendingRegistration.department} / ${pendingRegistration.year}</li>
                </ul>
                <p>Status: <strong style="color: #dc2626;">Already Rejected</strong></p>
                <p>You no longer need to take action on this registration.</p>
              `,
              text: `Student ${pendingRegistration.name} (${pendingRegistration.registerNumber}) from ${pendingRegistration.department} ${pendingRegistration.year} has already been rejected by another representative. Status: Already Rejected.`
            });
          } catch {}
        }));
      } catch {}
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Student Rejected</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .rejected { padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; text-align: center; color: #dc2626; }
            .info { margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; }
          </style>
        </head>
        <body>
          <h2>Student Registration Rejected</h2>
          <div class="rejected">
            <h3>❌ Student Rejected</h3>
            <p>The student has been notified of the rejection.</p>
          </div>
          <div class="info">
            <p><strong>Student Details:</strong></p>
            <ul>
              <li>Name: ${pendingRegistration.name}</li>
              <li>Register No: ${pendingRegistration.registerNumber}</li>
              <li>Email: ${pendingRegistration.email}</li>
              <li>Department/Year: ${pendingRegistration.department} / ${pendingRegistration.year}</li>
            </ul>
            <p>All other representatives in the same department and year have been notified that this student has been rejected.</p>
          </div>
        </body>
        </html>
      `);
    }
    return res.status(400).send('Invalid action');
  } catch (e) {
    return res.status(400).send('Invalid or expired link');
  }
});


