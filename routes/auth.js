const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authentication');

const testUser = require('../middleware/testUser');
const  {submitKYC} = require('../controllers/userVerification');

const rateLimiter = require('express-rate-limit');

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    msg: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// const { register, login, updateUser } = require('../controllers/auth');
// router.post('/register', apiLimiter, register);
// router.post('/login', apiLimiter, login);
const {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateUser,
  googleLogin,
  getUsersLookingForRoomPartner,
  getSingleUser,
  getTopViewedProfiles,
  getAllUsers
} = require('../controllers/auth');

router.get('/users-looking-for', getUsersLookingForRoomPartner);
router.get('/top-viewed-profiles',  getTopViewedProfiles);
router.get('/', getAllUsers);
router.get('/:userId', getSingleUser);
router.post('/register', register);
router.post('/login', login);

router.delete('/logout', authenticateUser, logout);
router.post('/verify-email', verifyEmail);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);
router.patch('/updateUser', authenticateUser , updateUser);
router.post('/kyc', authenticateUser, submitKYC);
router.post('/google-login', googleLogin);



module.exports = router;