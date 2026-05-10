const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const logoDir = path.join(__dirname, '..', 'public', 'uploads', 'hospitals', 'logos');
const docDir = path.join(__dirname, '..', 'public', 'uploads', 'hospitals', 'documents');
const patientPhotoDir = path.join(__dirname, '..', 'public', 'uploads', 'patients', 'photos');
const patientCvDir = path.join(__dirname, '..', 'public', 'uploads', 'patients', 'cvs');

ensureDir(logoDir);
ensureDir(docDir);
ensureDir(patientPhotoDir);
ensureDir(patientCvDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route to appropriate folder based on field name
    if (file.fieldname === 'profile_photo') {
      cb(null, patientPhotoDir);
    } else if (file.fieldname === 'cv') {
      cb(null, patientCvDir);
    } else if (file.fieldname === 'logo') {
      cb(null, logoDir);
    } else if (file.fieldname === 'verification_doc') {
      cb(null, docDir);
    } else {
      cb(null, logoDir); // default
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = file.fieldname + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, safeName);
  }
});

// Allow common image types for logo, and pdf/image for verification doc
const allowedMime = {
  logo: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
  verification_doc: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  profile_photo: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
  cv: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

const fileFilter = (req, file, cb) => {
  const list = allowedMime[file.fieldname] || [];
  if (!list.length) return cb(null, false);
  if (list.includes(file.mimetype)) return cb(null, true);
  return cb(new Error(`Invalid file type for ${file.fieldname}`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per file
  }
});

module.exports = upload;
