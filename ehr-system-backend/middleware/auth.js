// JWT Authentication Middleware
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const verifyPatient = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }
    next();
  });
};

const verifyHospital = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Access denied. Hospitals only.' });
    }
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    console.log(`[AUTH DEBUG] User: ${req.user.username}, Role: ${req.user.role}, Path: ${req.originalUrl}`);
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
  });
};

module.exports = {
  verifyToken,
  verifyPatient,
  verifyHospital,
  verifyAdmin
};
