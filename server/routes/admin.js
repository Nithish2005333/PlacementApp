const express = require('express');
const { auth } = require('../middleware/auth');
const Student = require('../models/Student');
const { cloudinary } = require('../lib/cloudinary');
const Department = require('../models/Department');
const { setDepartments } = require('../lib/deptCache');
const { Parser } = require('json2csv');
const { sendEmail } = require('../lib/email');

const router = express.Router();

// ================= Staff Admin management (admin only) =================
// Create staff admin (cannot be created by staff themselves)
router.post('/staff', auth('admin'), async (req, res) => {
  try {
    const { username, password, name, email, department } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const Admin = require('../models/Admin');
    const bcrypt = require('bcryptjs');
    const exists = await Admin.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Username already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await Admin.create({ username, passwordHash, role: 'staff', name: (name||'').trim() || undefined, email: (email||'').trim() || undefined, department: (department||'').trim() || undefined });
    res.status(201).json({ username: staff.username, role: staff.role, name: staff.name || null, email: staff.email || null, department: staff.department || null });
  } catch (e) {
    console.error('Create staff error:', e);
    res.status(500).json({ error: 'Failed to create staff admin' });
  }
});

// List staff admins (admin only)
router.get('/staff', auth('admin'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { department } = req.query;
    
    // Build filter - if department is specified, filter by it
    const filter = { role: 'staff' };
    if (department) {
      filter.department = department;
    }
    
    const list = await Admin.find(filter).select('username name email role department createdAt').lean();
    res.json(list);
  } catch (e) {
    console.error('List staff error:', e);
    res.status(500).json({ error: 'Failed to list staff admins' });
  }
});

// Delete staff admin (admin only)
router.delete('/staff/:username', auth('admin'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { username } = req.params;
    const result = await Admin.deleteOne({ username, role: 'staff' });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Staff admin not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete staff error:', e);
    res.status(500).json({ error: 'Failed to delete staff admin' });
  }
});
// Create placement representative (sub-admin) for dept/year
router.post('/reps', auth('admin_or_staff'), async (req, res) => {
  try {
    const { username, password, department, year, name, email } = req.body || {};
    if (!username || !password || !department || !year) {
      return res.status(400).json({ error: 'Username, password, department and year are required' });
    }
    
    // If staff, ensure they can only create reps for their department
    if (req.user.role === 'staff') {
      const Admin = require('../models/Admin');
      const currentStaff = await Admin.findById(req.user.sub);
      if (!currentStaff || currentStaff.role !== 'staff') {
        return res.status(403).json({ error: 'Invalid staff credentials' });
      }
      
      console.log('Staff department check:', {
        staffDepartment: currentStaff.department,
        requestedDepartment: department,
        staffId: req.user.sub
      });
      
      // If staff doesn't have a department assigned, assign it from the request
      if (!currentStaff.department && department) {
        currentStaff.department = department;
        await currentStaff.save();
        console.log('Updated staff department:', department);
      }
      
      // Ensure staff can only create reps for their department
      if (currentStaff.department !== department) {
        return res.status(403).json({ error: `You can only create representatives for ${currentStaff.department || 'your assigned'} department` });
      }
    }
    
    const Admin = require('../models/Admin');
    const bcrypt = require('bcryptjs');
    const exists = await Admin.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Username already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const rep = await Admin.create({ username, passwordHash, role: 'rep', department, year, name: (name||'').trim() || undefined, email: (email||'').trim() || undefined });
    res.status(201).json({ username: rep.username, role: rep.role, department: rep.department, year: rep.year, name: rep.name || null, email: rep.email || null });
  } catch (e) {
    console.error('Create rep error:', e);
    res.status(500).json({ error: 'Failed to create representative' });
  }
});

// List reps, filter by department/year
router.get('/reps', auth('admin_or_staff'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { department, year } = req.query;
    const q = { role: 'rep' };
    if (department) q.department = department;
    if (year) q.year = year;
    // If staff, constrain to their department
    if (req.user.role === 'staff' && req.user.department) q.department = req.user.department;
    const reps = await Admin.find(q).select('username department year role name email passwordHash').sort({ department: 1, year: 1 });
    // Include password hash for admin to see (in real app, you might want to decrypt or show masked version)
    const repsWithPassword = reps.map(rep => ({
      ...rep.toObject(),
      password: rep.passwordHash ? '••••••••' : null // Show masked password
    }));
    res.json(repsWithPassword);
  } catch (e) {
    console.error('List reps error:', e);
    res.status(500).json({ error: 'Failed to list representatives' });
  }
});

// Get specific rep details (admin or staff in own department)
router.get('/reps/:username', auth('admin_or_staff'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { username } = req.params;
    const rep = await Admin.findOne({ username, role: 'rep' });
    if (!rep) return res.status(404).json({ error: 'Representative not found' });
    if (req.user.role === 'staff' && req.user.department && rep.department !== req.user.department) {
      return res.status(403).json({ error: 'Staff can only access their own department' });
    }
    res.json({
      username: rep.username,
      role: rep.role,
      department: rep.department,
      year: rep.year,
      name: rep.name || null,
      email: rep.email || null,
      password: rep.passwordHash ? '••••••••' : null // Show masked password
    });
  } catch (e) {
    console.error('Get rep error:', e);
    res.status(500).json({ error: 'Failed to get representative' });
  }
});

// Edit a placement representative (admin or staff in own department)
router.put('/reps/:username', auth('admin_or_staff'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { username } = req.params;
    const { name, email, department, year, password } = req.body || {};
    const rep = await Admin.findOne({ username, role: 'rep' });
    if (!rep) return res.status(404).json({ error: 'Representative not found' });
    if (req.user.role === 'staff' && req.user.department && rep.department !== req.user.department) {
      return res.status(403).json({ error: 'Staff can only manage their own department' });
    }
    if (name !== undefined) rep.name = String(name).trim();
    if (email !== undefined) rep.email = String(email).trim().toLowerCase();
    if (department !== undefined) {
      // Staff may only change within own department; otherwise keep original
      const newDept = String(department)
      if (req.user.role === 'staff' && req.user.department && newDept !== req.user.department) {
        return res.status(403).json({ error: 'Staff cannot move reps to other departments' });
      }
      rep.department = newDept;
    }
    if (year !== undefined) rep.year = String(year);
    if (password) {
      const bcrypt = require('bcryptjs');
      rep.passwordHash = await bcrypt.hash(String(password), 10);
    }
    await rep.save();
    res.json({ username: rep.username, role: rep.role, department: rep.department, year: rep.year, name: rep.name || null, email: rep.email || null });
  } catch (e) {
    console.error('Edit rep error:', e);
    res.status(500).json({ error: 'Failed to update representative' });
  }
});

// Delete a placement representative by username (admin or staff in own department)
router.delete('/reps/:username', auth('admin_or_staff'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { username } = req.params;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    
    // Ensure we only delete representative accounts
    const rep = await Admin.findOne({ username, role: 'rep' });
    if (!rep) return res.status(404).json({ error: 'Representative not found' });
    
    // If staff, ensure they can only delete reps from their department
    if (req.user.role === 'staff') {
      const currentStaff = await Admin.findById(req.user.sub);
      if (!currentStaff || currentStaff.role !== 'staff') {
        return res.status(403).json({ error: 'Invalid staff credentials' });
      }
      
      // If staff doesn't have a department assigned, assign it from the rep's department
      if (!currentStaff.department && rep.department) {
        currentStaff.department = rep.department;
        await currentStaff.save();
        console.log('Updated staff department from rep:', rep.department);
      }
      
      if (currentStaff.department !== rep.department) {
        return res.status(403).json({ error: `You can only delete representatives from ${currentStaff.department || 'your assigned'} department` });
      }
    }
    await Admin.deleteOne({ _id: rep._id });
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete rep error:', e);
    res.status(500).json({ error: 'Failed to delete representative' });
  }
});

// Rep approval endpoints (admin or rep can approve within scope)
// Only reps (or main admin/staff acting as rep) can approve via API; keep as is but allow staff/admin too
router.post('/reps/approve', auth(['admin','staff','rep']), async (req, res) => {
  try {
    const { studentId } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    
    // Find pending registration
    const PendingRegistration = require('../models/PendingRegistration');
    const pendingRegistration = await PendingRegistration.findById(studentId);
    if (!pendingRegistration) return res.status(404).json({ error: 'Pending registration not found' });
    
    // If rep, ensure scope
    if (req.user.role === 'rep') {
      const Admin = require('../models/Admin');
      const me = await Admin.findById(req.user.sub);
      if (!me || me.role !== 'rep' || me.department !== pendingRegistration.department || me.year !== pendingRegistration.year) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }
    
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
    await PendingRegistration.deleteOne({ _id: studentId });
    
    // Notify student via email
    try { 
      const approverInfo = req.user.role === 'rep' ? ` by ${req.user.name || 'Representative'}` : ' by Admin';
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
                <a href="https://placementapp-1t8j.onrender.com/login" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">🚀 Login to Placement App</a>
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
        _id: { $ne: req.user.sub } // Exclude the current user
      }).lean();
      
      await Promise.all(otherReps.map(async (rep) => {
        try {
          await sendEmail({
            to: rep.email,
            subject: 'Student Registration Already Approved',
            html: `
              <p>Hello ${rep.name || 'Representative'},</p>
              <p>The following student registration has already been approved:</p>
              <ul>
                <li>Name: ${student.name}</li>
                <li>Register No: ${student.registerNumber}</li>
                <li>Email: ${student.email}</li>
                <li>Department/Year: ${student.department} / ${student.year}</li>
              </ul>
              <p>Status: <strong style="color: #16a34a;">Already Approved</strong></p>
              <p>You no longer need to take action on this registration.</p>
            `,
            text: `Student ${student.name} (${student.registerNumber}) from ${student.department} ${student.year} has already been approved. Status: Already Approved.`
          });
        } catch {}
      }));
    } catch {}
    
    res.json({ ok: true });
  } catch (e) {
    console.error('Approve error:', e);
    res.status(500).json({ error: 'Failed to approve' });
  }
});

router.post('/reps/reject', auth(['admin','staff','rep']), async (req, res) => {
  try {
    const { studentId, reason } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    
    // Find pending registration
    const PendingRegistration = require('../models/PendingRegistration');
    const pendingRegistration = await PendingRegistration.findById(studentId);
    if (!pendingRegistration) return res.status(404).json({ error: 'Pending registration not found' });
    
    // If rep, ensure scope
    if (req.user.role === 'rep') {
      const Admin = require('../models/Admin');
      const me = await Admin.findById(req.user.sub);
      if (!me || me.role !== 'rep' || me.department !== pendingRegistration.department || me.year !== pendingRegistration.year) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }
    
    // Delete from PendingRegistration (no student record created)
    await PendingRegistration.deleteOne({ _id: studentId });
    
    // Notify student of rejection
    try { 
      const rejectorInfo = req.user.role === 'rep' ? ` by ${req.user.name || 'Representative'}` : ' by Admin';
      await sendEmail({ 
        to: pendingRegistration.email, 
        subject: 'Registration Rejected', 
        html: `<p>Hi ${pendingRegistration.name},</p><p>Your registration was not approved${rejectorInfo}${reason ? `: ${reason}` : ''}. Please contact your representative.</p>`, 
        text: `Hi ${pendingRegistration.name}, your registration was not approved${rejectorInfo}${reason ? `: ${reason}` : ''}. Please contact your representative.` 
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
        _id: { $ne: req.user.sub } // Exclude the current user
      }).lean();
      
      await Promise.all(otherReps.map(async (rep) => {
        try {
          await sendEmail({
            to: rep.email,
            subject: 'Student Registration Already Rejected',
            html: `
              <p>Hello ${rep.name || 'Representative'},</p>
              <p>The following student registration has already been rejected:</p>
              <ul>
                <li>Name: ${pendingRegistration.name}</li>
                <li>Register No: ${pendingRegistration.registerNumber}</li>
                <li>Email: ${pendingRegistration.email}</li>
                <li>Department/Year: ${pendingRegistration.department} / ${pendingRegistration.year}</li>
                ${reason ? `<li>Reason: ${reason}</li>` : ''}
              </ul>
              <p>Status: <strong style="color: #dc2626;">Already Rejected</strong></p>
              <p>You no longer need to take action on this registration.</p>
            `,
            text: `Student ${pendingRegistration.name} (${pendingRegistration.registerNumber}) from ${pendingRegistration.department} ${pendingRegistration.year} has already been rejected. Status: Already Rejected.${reason ? ` Reason: ${reason}` : ''}`
          });
        } catch {}
      }));
    } catch {}
    
    res.json({ ok: true });
  } catch (e) {
    console.error('Reject error:', e);
    res.status(500).json({ error: 'Failed to reject' });
  }
});

// dashboard helpers
router.get('/years', auth('admin_or_staff'), (_req, res) => {
  res.json(['First', 'Second', 'Third', 'Final']);
});

router.get('/departments', auth('admin_or_staff'), async (_req, res) => {
  try {
    const departments = await Department.find({}).sort({ name: 1 }).lean();
    setDepartments(departments.map(d => ({ name: d.name, fullName: d.fullName })));
    if (departments.length === 0) {
      // Fallback defaults if collection empty
      return res.json([
        { name: 'CSE', fullName: 'Computer Science & Engineering' },
        { name: 'AI&DS', fullName: 'Artificial Intelligence & Data Science' },
        { name: 'Mech', fullName: 'Mechanical Engineering' },
        { name: 'ECE', fullName: 'Electronics & Communication Engineering' },
        { name: 'EEE', fullName: 'Electrical & Electronics Engineering' },
        { name: 'VLSI', fullName: 'VLSI Design' },
      ]);
    }
    res.json(departments.map(d => ({ name: d.name, fullName: d.fullName })));
  } catch (e) {
    console.error('List departments error:', e);
    res.status(500).json({ error: 'Failed to list departments' });
  }
});

// Create department
router.post('/departments', auth('admin_or_staff'), async (req, res) => {
  try {
    const { name, fullName } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Department name is required' });
    }
    const trimmed = name.trim();
    const exists = await Department.findOne({ name: trimmed });
    if (exists) return res.status(409).json({ error: 'Department already exists' });
    const created = await Department.create({ name: trimmed, fullName: (fullName || '').trim() || trimmed });
    const departments = await Department.find({}).sort({ name: 1 }).lean();
    setDepartments(departments.map(d => ({ name: d.name, fullName: d.fullName })));
    res.status(201).json({ name: created.name, fullName: created.fullName });
  } catch (e) {
    console.error('Create department error:', e);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Delete department by name
router.delete('/departments/:name', auth('admin_or_staff'), async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ error: 'Department name is required' });
    const deleted = await Department.findOneAndDelete({ name });
    if (!deleted) return res.status(404).json({ error: 'Department not found' });
    const departments = await Department.find({}).sort({ name: 1 }).lean();
    setDepartments(departments.map(d => ({ name: d.name, fullName: d.fullName })));
    res.json({ message: 'Department deleted' });
  } catch (e) {
    console.error('Delete department error:', e);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// Get pending registrations for approval
router.get('/pending-registrations', auth(['admin','rep']), async (req, res) => {
  try {
    const { year, department } = req.query;
    console.log('Admin pending registrations query:', { department, year });
    
    // If rep, enforce scope
    if (req.user.role === 'rep') {
      const Admin = require('../models/Admin');
      const me = await Admin.findById(req.user.sub);
      if (!me || me.role !== 'rep') return res.status(403).json({ error: 'Unauthorized' });
      // Force rep to only see their assigned department/year
      const filter = { department: me.department, year: me.year };
      const PendingRegistration = require('../models/PendingRegistration');
      const pendingRegistrations = await PendingRegistration.find(filter).select('name registerNumber email department year createdAt').sort({ createdAt: -1 });
      return res.json(pendingRegistrations);
    }
    
    // Admin can see all pending registrations
    const filter = {};
    if (year) filter.year = year;
    if (department) filter.department = department;
    
    const PendingRegistration = require('../models/PendingRegistration');
    const pendingRegistrations = await PendingRegistration.find(filter).select('name registerNumber email department year createdAt').sort({ createdAt: -1 });
    console.log('Found pending registrations:', pendingRegistrations.length);
    
    res.json(pendingRegistrations);
  } catch (e) {
    console.error('Get pending registrations error:', e);
    res.status(500).json({ error: 'Failed to get pending registrations' });
  }
});

router.get('/students', auth(['admin','rep','staff']), async (req, res) => {
  const { year, department } = req.query;
  console.log('Admin students query:', { department, year, role: req.user.role });
  
  // If staff, ensure they can only access their department
  if (req.user.role === 'staff') {
    const Admin = require('../models/Admin');
    const currentStaff = await Admin.findById(req.user.sub);
    if (!currentStaff || currentStaff.role !== 'staff') {
      return res.status(403).json({ error: 'Invalid staff credentials' });
    }
    
    // If staff doesn't have a department assigned, assign it from the request
    if (!currentStaff.department && department) {
      currentStaff.department = department;
      await currentStaff.save();
      console.log('Updated staff department from students list:', department);
    }
    
    // Ensure staff can only access their department
    if (currentStaff.department !== department) {
      return res.status(403).json({ error: `You can only access students from ${currentStaff.department || 'your assigned'} department` });
    }
  }
  
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
  
  const students = await Student.find({ department, year: yearFilter, registrationStatus: 'approved' }).select('registerNumber name registrationStatus profilePhoto');
  console.log('Found approved students with criteria:', students.length);
  
  // Debug: Check for rejected students
  const rejectedStudents = await Student.find({ department, year: yearFilter, registrationStatus: 'rejected' }).select('registerNumber name registrationStatus');
  if (rejectedStudents.length > 0) {
    console.log('WARNING: Found rejected students in database:', rejectedStudents);
  }
  
  // Debug: Check for pending students (should not exist in Student table)
  const pendingStudents = await Student.find({ department, year: yearFilter, registrationStatus: 'pending' }).select('registerNumber name registrationStatus');
  if (pendingStudents.length > 0) {
    console.log('WARNING: Found pending students in Student table (should be in PendingRegistration):', pendingStudents);
  }
  
  // Debug: Check all students for this department/year
  const allStudents = await Student.find({ department, year: yearFilter }).select('registerNumber name registrationStatus');
  console.log('All students in database for this department/year:', allStudents);
  
  res.json(students);
});

// Cleanup endpoint to remove rejected and pending students (they shouldn't be in Student table)
router.post('/cleanup-rejected-students', auth('admin'), async (req, res) => {
  try {
    // First, show what's in the database
    const rejectedStudents = await Student.find({ registrationStatus: 'rejected' }).select('registerNumber name email department year');
    const pendingStudents = await Student.find({ registrationStatus: 'pending' }).select('registerNumber name email department year');
    const approvedStudents = await Student.find({ registrationStatus: 'approved' }).select('registerNumber name email department year');
    
    console.log('Before cleanup:');
    console.log(`- Approved students: ${approvedStudents.length}`);
    console.log(`- Rejected students: ${rejectedStudents.length}`);
    console.log(`- Pending students: ${pendingStudents.length}`);
    
    // Clean up rejected and pending students
    const rejectedResult = await Student.deleteMany({ registrationStatus: 'rejected' });
    const pendingResult = await Student.deleteMany({ registrationStatus: 'pending' });
    const totalCleaned = rejectedResult.deletedCount + pendingResult.deletedCount;
    
    console.log(`Cleaned up ${rejectedResult.deletedCount} rejected and ${pendingResult.deletedCount} pending students from database`);
    
    res.json({ 
      message: `Removed ${rejectedResult.deletedCount} rejected and ${pendingResult.deletedCount} pending students from database`,
      rejected: rejectedResult.deletedCount,
      pending: pendingResult.deletedCount,
      total: totalCleaned,
      beforeCleanup: {
        approved: approvedStudents.length,
        rejected: rejectedStudents.length,
        pending: pendingStudents.length
      },
      afterCleanup: {
        approved: approvedStudents.length,
        rejected: 0,
        pending: 0
      }
    });
  } catch (e) {
    console.error('Cleanup error:', e);
    res.status(500).json({ error: 'Failed to cleanup students' });
  }
});

// Get student by register number
router.get('/students/by-register/:registerNumber', auth(['admin','rep','staff']), async (req, res) => {
  try {
    const { registerNumber } = req.params;
    const student = await Student.findOne({ registerNumber, registrationStatus: 'approved' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (e) {
    console.error('Get student by register number error:', e);
    res.status(500).json({ error: 'Failed to get student' });
  }
});

// Admin: filter students with advanced criteria
router.get('/students/filter', auth(['admin','rep','staff']), async (req, res) => {
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
    
    const students = await Student.find({ ...filter, registrationStatus: 'approved' }).select('registerNumber name department year profilePhoto');
    console.log('Found students:', students.length);
    res.json(students);
  } catch (error) {
    console.error('Admin filter students error:', error);
    res.status(500).json({ error: 'Failed to filter students' });
  }
});

// Export students (CSV) with full details used in student details page
router.get('/students/export', auth(['admin','rep','staff']), async (req, res) => {
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
      hasCertifications
    } = req.query;

    // Base filter
    const filter = {};
    if (year) filter.year = year;
    if (department) filter.department = department;
    if (gender) filter.gender = gender;

    if (willingToPlace) {
      const values = willingToPlace.split(',').filter(Boolean);
      if (values.length === 1) filter['placement.willingToPlace'] = values[0] === 'true';
      else if (values.length > 1) filter['placement.willingToPlace'] = { $in: values.map(v => v === 'true') };
    }
    if (historyOfArrears) {
      const values = historyOfArrears.split(',').filter(Boolean);
      if (values.includes('none') && values.includes('has')) {
      } else if (values.includes('none')) filter['academic.historyOfArrears'] = { $eq: 0 };
      else if (values.includes('has')) filter['academic.historyOfArrears'] = { $gt: 0 };
    }
    if (currentArrears) {
      const values = currentArrears.split(',').filter(Boolean);
      if (values.includes('none') && values.includes('has')) {
      } else if (values.includes('none')) filter['academic.currentArrears'] = { $eq: 0 };
      else if (values.includes('has')) filter['academic.currentArrears'] = { $gt: 0 };
    }
    if (cgpaRange) {
      const cgpaValue = parseFloat(cgpaRange.replace('+', ''));
      if (!isNaN(cgpaValue)) filter['academic.cgpa'] = { $gte: cgpaValue };
    }
    if (technicalSkills) {
      const skills = technicalSkills.split(',').filter(Boolean);
      if (skills.length > 0) filter['placement.technicalSkills'] = { $in: skills.map(s => new RegExp(`^${s.trim()}$`, 'i')) };
    }
    if (softSkills) {
      const skills = softSkills.split(',').filter(Boolean);
      if (skills.length > 0) filter['placement.logicalSkills'] = { $in: skills.map(s => new RegExp(`^${s.trim()}$`, 'i')) };
    }
    if (hscPercentage) {
      const v = parseFloat(hscPercentage.replace('+',''));
      if (!isNaN(v)) filter['academic.hscPercentage'] = { $gte: v };
    }
    if (sslcPercentage) {
      const v = parseFloat(sslcPercentage.replace('+',''));
      if (!isNaN(v)) filter['academic.sslcPercentage'] = { $gte: v };
    }
    if (hasInternship) {
      const values = hasInternship.split(',').filter(Boolean);
      if (values.includes('yes')) filter['placement.internships'] = { $exists: true, $ne: '', $ne: null };
      else if (values.includes('no')) {
        filter.$or = filter.$or || [];
        filter.$or.push({ 'placement.internships': { $exists: false } });
        filter.$or.push({ 'placement.internships': '' });
        filter.$or.push({ 'placement.internships': null });
      }
    }
    if (hasProjects) {
      const values = hasProjects.split(',').filter(Boolean);
      if (values.includes('yes')) filter['placement.projects'] = { $exists: true, $ne: '', $ne: null };
      else if (values.includes('no')) {
        filter.$or = filter.$or || [];
        filter.$or.push({ 'placement.projects': { $exists: false } });
        filter.$or.push({ 'placement.projects': '' });
        filter.$or.push({ 'placement.projects': null });
      }
    }
    if (hasCertifications) {
      const values = hasCertifications.split(',').filter(Boolean);
      if (values.includes('yes')) filter['placement.certifications'] = { $exists: true, $ne: '', $ne: null };
      else if (values.includes('no')) {
        filter.$or = filter.$or || [];
        filter.$or.push({ 'placement.certifications': { $exists: false } });
        filter.$or.push({ 'placement.certifications': '' });
        filter.$or.push({ 'placement.certifications': null });
      }
    }

    // Sort by register number ascending (string with numeric semantics)
    const students = await Student.find({ ...filter, registrationStatus: 'approved' }).sort({ registerNumber: 1 }).lean();

    const rows = students.map(s => ({
      RegisterNumber: s.registerNumber,
      Name: s.name,
      Department: s.department,
      Year: s.year,
      Gender: s.gender || '',
      Email: s.email || '',
      Phone: s.phone || '',
      Address: s.address || '',
      CGPA: s.academic?.cgpa ?? '',
      HSCPercentage: s.academic?.hscPercentage ?? '',
      SSLCPercentage: s.academic?.sslcPercentage ?? '',
      HistoryOfArrears: s.academic?.historyOfArrears ?? '',
      CurrentArrears: s.academic?.currentArrears ?? '',
      CurrentSemester: (s.academic?.currentSemester ?? s.currentSemester) ?? '',
      WillingToPlace: s.placement?.willingToPlace ? 'Yes' : 'No',
      PlacementPreference: s.placement?.placementPreference || '',
      TechnicalSkills: Array.isArray(s.placement?.technicalSkills) ? s.placement.technicalSkills.join('; ') : '',
      SoftSkills: Array.isArray(s.placement?.logicalSkills) ? s.placement.logicalSkills.join('; ') : '',
      Projects: (s.placement?.workExperience || s.placement?.projects || '').toString().replace(/\r?\n/g, ' | '),
      Certifications: (s.placement?.certifications || '').toString().replace(/\r?\n/g, ' | '),
      Internships: (s.placement?.internships || '').toString().replace(/\r?\n/g, ' | '),
      ResumeLink: s?.links?.resume || '',
      PortfolioLink: s?.links?.portfolio || '',
      LinkedInLink: s?.links?.linkedin || '',
      GitHubLink: s?.links?.github || ''
    }));

    const parser = new Parser({ header: true });
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="students_${department || 'all'}_${year || 'all'}.csv"`);
    return res.status(200).send(csv);
  } catch (e) {
    console.error('Export students failed:', e);
    res.status(500).json({ error: 'Failed to export students' });
  }
});

// Admin verification endpoint
router.post('/verify', auth(['admin','rep','staff']), async (req, res) => {
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
    res.status(500).json({ error: 'Failed to verify credentials' });
  }
});


// Bulk delete students
router.post('/students/bulk-delete', auth(['admin','rep','staff']), async (req, res) => {
  try {
    const { studentIds, year, department } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Student IDs are required' });
    }

    if (!year || !department) {
      return res.status(400).json({ error: 'Year and department are required' });
    }

    // If staff, ensure they can only delete from their department
    if (req.user.role === 'staff') {
      const Admin = require('../models/Admin');
      const currentStaff = await Admin.findById(req.user.sub);
      if (!currentStaff || currentStaff.role !== 'staff') {
        return res.status(403).json({ error: 'Invalid staff credentials' });
      }
      
      // If staff doesn't have a department assigned, assign it from the request
      if (!currentStaff.department && department) {
        currentStaff.department = department;
        await currentStaff.save();
        console.log('Updated staff department from bulk delete:', department);
      }
      
      // Ensure staff can only delete from their department
      if (currentStaff.department !== department) {
        return res.status(403).json({ error: `You can only delete students from ${currentStaff.department || 'your assigned'} department` });
      }
    }

    // If rep, enforce scope to their department/year
    if (req.user.role === 'rep') {
      const Admin = require('../models/Admin');
      const me = await Admin.findById(req.user.sub);
      if (!me || me.role !== 'rep') return res.status(403).json({ error: 'Unauthorized' });
      if (me.department !== department || me.year !== year) {
        return res.status(403).json({ error: 'You can only delete students from your assigned department and year' });
      }
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
router.delete('/students/:id', auth(['admin','rep','staff']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete student request:', { id, role: req.user.role, userId: req.user.sub });
    
    // If staff, ensure they can only delete from their department
    if (req.user.role === 'staff') {
      const Admin = require('../models/Admin');
      const currentStaff = await Admin.findById(req.user.sub);
      console.log('Staff admin found:', { 
        found: !!currentStaff, 
        role: currentStaff?.role, 
        department: currentStaff?.department,
        staffId: req.user.sub 
      });
      
      if (!currentStaff || currentStaff.role !== 'staff') {
        console.log('Invalid staff credentials');
        return res.status(403).json({ error: 'Invalid staff credentials' });
      }
      
      // Check student department matches staff department
      const student = await Student.findById(id);
      console.log('Student found:', { 
        found: !!student, 
        studentDepartment: student?.department,
        studentId: id 
      });
      
      if (!student) return res.status(404).json({ error: 'Student not found' });
      
      // If staff doesn't have a department assigned, assign it from the student's department
      if (!currentStaff.department && student.department) {
        currentStaff.department = student.department;
        await currentStaff.save();
        console.log('Updated staff department from student:', student.department);
      }
      
      if (currentStaff.department !== student.department) {
        console.log('Department mismatch:', { 
          staffDept: currentStaff.department, 
          studentDept: student.department 
        });
        return res.status(403).json({ error: `You can only delete students from ${currentStaff.department || 'your assigned'} department` });
      }
    }
    
    // If rep, enforce scope check before deleting
    if (req.user.role === 'rep') {
      const Admin = require('../models/Admin');
      const me = await Admin.findById(req.user.sub);
      if (!me || me.role !== 'rep') return res.status(403).json({ error: 'Unauthorized' });
      const s = await Student.findById(id);
      if (!s) return res.status(404).json({ error: 'Student not found' });
      if (s.department !== me.department || s.year !== me.year) {
        return res.status(403).json({ error: 'You can only delete students from your assigned department and year' });
      }
    }

    const student = await Student.findByIdAndDelete(id);
    console.log('Student delete result:', { deleted: !!student, studentId: id });
    
    if (!student) {
      console.log('Student not found for deletion');
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



