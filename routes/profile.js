const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authentication');
const  {getUserById,getAllUsers,getUserPosts }  = require('../controllers/profile');

router.route('/singleuser').get(authenticateUser , getUserById);
router.route('/').get( getAllUsers);
router.route('/:userId/posts').get(getUserPosts);

module.exports = router;