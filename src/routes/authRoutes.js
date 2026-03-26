const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, getMe, updateMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerValidators, loginValidators, forgotPasswordValidators, resetPasswordValidators } = require('../validators/authValidators');
const { authLimiter } = require('../config/rateLimiter');

router.post('/register', authLimiter, registerValidators, validate, register);
router.post('/login', authLimiter, loginValidators, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, forgotPasswordValidators, validate, forgotPassword);
router.put('/reset-password/:token', resetPasswordValidators, validate, resetPassword);

router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateMe);

module.exports = router;
