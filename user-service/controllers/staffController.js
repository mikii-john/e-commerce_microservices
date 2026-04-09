const User = require('../models/User');

// @desc    Get all buyers and sellers
// @route   GET /api/staff/users
// @access  Private/Staff/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['buyer', 'seller'] } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Block a user
// @route   PUT /api/staff/users/:id/block
// @access  Private/Staff/Admin
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin' || user.role === 'staff') {
      return res.status(403).json({ message: 'Cannot block admin or staff' });
    }

    user.status = 'blocked';
    await user.save();

    res.json({ message: 'User blocked successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Unblock a user
// @route   PUT /api/staff/users/:id/unblock
// @access  Private/Staff/Admin
const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'active';
    await user.save();

    res.json({ message: 'User unblocked successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove a seller or buyer
// @route   DELETE /api/staff/users/:id
// @access  Private/Staff/Admin
const removeUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin' || user.role === 'staff') {
      return res.status(403).json({ message: 'Cannot remove admin or staff' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUsers,
  blockUser,
  unblockUser,
  removeUser,
};
