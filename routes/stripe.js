const express = require('express');
const router = express.Router();
// const { authenticateUsers } = require('../middleware/full-auth');
const { createPaymentIntent } = require('../controllers/stripe');
const { authenticateUser } = require('../middleware/authentication');

router.post('/create-payment-intent',authenticateUser ,createPaymentIntent);

module.exports = router;