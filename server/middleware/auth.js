const jwt = require('jsonwebtoken');

function auth(requiredRole) {
  return function (req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
      const payload = jwt.verify(token, JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch (e) {
      console.error('JWT verification error:', e);
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

module.exports = { auth };



