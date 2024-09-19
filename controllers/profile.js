const User = require('../models/User');

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
  module.exports = {getUserById, getAllUsers};
