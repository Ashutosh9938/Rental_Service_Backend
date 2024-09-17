const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authentication');
const  {getUserById,getAllUsers}  = require('../controllers/profile');

router.route('/:id').get( getUserById);
router.route('/').get( getAllUsers);

module.exports = router;