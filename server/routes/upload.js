const express = require('express');
const { auth } = require('../middleware/auth');
const { upload, cloudinary } = require('../lib/cloudinary');
const Student = require('../models/Student');

const router = express.Router();

// Upload profile photo
router.post('/profile-photo', auth('student'), (req, res) => {
  upload.single('profilePhoto')(req, res, async (err) => {
    if (err) {
      const message = err.message || 'Upload failed';
      console.error('Multer/Cloudinary error:', err);
      return res.status(400).json({ error: message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Get current student to check for existing photo
      const currentStudent = await Student.findById(req.user.sub);
      if (!currentStudent) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Delete previous image from Cloudinary if it exists
      if (currentStudent.profilePhotoPublicId) {
        try {
          await cloudinary.uploader.destroy(currentStudent.profilePhotoPublicId);
          console.log('Deleted previous image:', currentStudent.profilePhotoPublicId);
        } catch (e) {
          console.warn('Failed to delete previous image:', e?.message || e);
        }
      }

      // Get the Cloudinary URL and public_id from the uploaded file
      const profilePhotoUrl = req.file.path;
      const publicId = req.file.filename || req.file.public_id || (req.file?.metadata && req.file.metadata.public_id);

      // Update the student's profile photo in the database
      const update = { profilePhoto: profilePhotoUrl };
      if (publicId) update.profilePhotoPublicId = publicId;
      const student = await Student.findByIdAndUpdate(req.user.sub, update, { new: true });

      res.json({ 
        success: true, 
        profilePhoto: profilePhotoUrl,
        profilePhotoPublicId: publicId,
        message: 'Profile photo uploaded successfully' 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
});

// Delete profile photo
router.delete('/profile-photo', auth('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.user.sub);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // If we have a stored public id, attempt to delete from Cloudinary
    if (student.profilePhotoPublicId) {
      try {
        await cloudinary.uploader.destroy(student.profilePhotoPublicId);
      } catch (e) {
        console.warn('Cloudinary destroy failed (continuing):', e?.message || e);
      }
    }

    // Remove profile photo URL from database
    await Student.findByIdAndUpdate(req.user.sub, { $unset: { profilePhoto: 1, profilePhotoPublicId: 1 } }, { new: true });

    res.json({ 
      success: true, 
      message: 'Profile photo removed successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
