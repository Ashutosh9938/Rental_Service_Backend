const express = require('express');
const router = express.Router();
const { submitKYC, verify } = require('../controllers/userVerification');
const { authenticateUser } = require('../middleware/authentication');

router.post('/submit', authenticateUser ,submitKYC);
router.post('/verify',authenticateUser , verify);

module.exports = router;
