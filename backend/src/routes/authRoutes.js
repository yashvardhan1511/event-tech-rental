const express = require('express');
const router = express.Router();
const { register, login, getMe, googleLogin, getGoogleClientId, sendOtp } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/send-otp', sendOtp);
router.get('/google-client-id', getGoogleClientId);
router.get('/me', authMiddleware, getMe);

module.exports = router;
