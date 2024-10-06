const User = require('../models/User');
const Post = require('../models/post');
const getUserById = async (req, res) => {

  const userId = req.user.userId;
console.log(userId);
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {

    return res.status(500).json({ message: `Error fetching user: ${error.message}` });
  }
};
const getAllUsers = async (req, res) => {
    try {
      const users = await User.find().exec();
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  }
  const getUserPosts = async (req, res, next) => {
    try {
      const { userId } = req.params; // Get the userId from the URL
      const posts = await Post.find({ 'jobPoster.createdBy': userId }); // Find posts where jobPoster createdBy matches the userId
  
      if (!posts || posts.length === 0) {
        return res.status(404).json({ message: 'No posts found for this user' });
      }
  
      res.status(200).json({ posts });
    } catch (error) {
      next(error); // Handle error
    }
  };

  module.exports = {getUserById, getAllUsers,getUserPosts };
