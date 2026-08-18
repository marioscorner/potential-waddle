import argon2 from 'argon2';

const verifyPassword = async (plainPassword, hash) => {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const optionalAuth = (req, res, next) => {
  // Check if authenticated, but don't block if not
  next();
};

export {
  verifyPassword,
  requireAuth,
  optionalAuth,
};
