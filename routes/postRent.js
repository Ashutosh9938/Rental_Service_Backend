const express = require('express');
const { authenticateUser } = require('../middleware/authentication');

const router = express.Router();
const { postRent, updatePost, deletePost, getAllPosts, getPost, getFeaturedHouse } = require('../controllers/postRent');

router.route('/').post(authenticateUser, postRent).get(getAllPosts);
router.route('/featured').get(getFeaturedHouse);  // Route for the featured house
router.route('/:id').get(getPost);
router.patch('/:id', authenticateUser, updatePost);
router.delete('/:id', authenticateUser, deletePost);


module.exports = router;
