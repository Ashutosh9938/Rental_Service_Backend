const User = require('../models/User');

const getUserById = async (req, res) => {
  // Extract the userId from req.params
  const { id } = req.params;

  try {
    // Use the extracted id to find the user
    const user = await User.findById(id).exec();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the found user
    return res.status(200).json(user);
  } catch (error) {
    // Handle any errors that occur during the fetch
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
