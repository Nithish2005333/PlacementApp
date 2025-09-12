const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
// Prefer CLOUDINARY_URL if provided; otherwise fall back to explicit vars
if (process.env.CLOUDINARY_URL) {
  // When CLOUDINARY_URL is present, cloudinary lib reads it automatically
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Basic sanity check to help diagnose "Must supply api_key"
if (!cloudinary.config().api_key || !cloudinary.config().cloud_name) {
  // eslint-disable-next-line no-console
  console.warn('[Cloudinary] Missing credentials. Ensure CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET are set.');
}

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'placement-app/profile-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ]
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

module.exports = { cloudinary, upload };
