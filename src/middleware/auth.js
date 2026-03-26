const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token provided', 401));
  }

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    return next(new AppError('User no longer exists or inactive', 401));
  }

  req.user = user;
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized to access this route`, 403));
    }
    next();
  };
};

module.exports = { protect, authorize };
