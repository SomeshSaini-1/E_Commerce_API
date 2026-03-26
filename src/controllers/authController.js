const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendTokenResponse, generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');

const register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  const user = await User.create({ name, email, password, role: role === 'admin' ? 'customer' : role });

  sendTokenResponse(user, 201, res);
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 403));
  }

  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
};

const refreshToken = async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required', 400));
  }

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    return next(new AppError('Invalid refresh token', 401));
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

const logout = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: user });
};

const updateMe = async (req, res, next) => {
  const { name, address } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, address },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: user });
};

const forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent. Please try again.', 500));
  }
};

const resetPassword = async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  user.refreshToken = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
};

module.exports = { register, login, refreshToken, logout, getMe, updateMe, forgotPassword, resetPassword };
