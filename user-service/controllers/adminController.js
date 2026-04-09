const User = require('../models/User');

// @desc    Get all staff members
// @route   GET /api/admin/staff
// @access  Private/Admin
const getStaffMembers = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a new staff member
// @route   POST /api/admin/staff
// @access  Private/Admin
const addStaffMember = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role: 'staff',
    });

    if (staff) {
      res.status(201).json({
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid staff data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update staff member
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
const updateStaffMember = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const staff = await User.findById(req.params.id);

    if (staff && staff.role === 'staff') {
      staff.name = name || staff.name;
      staff.email = email || staff.email;
      if (password) {
        staff.password = password;
      }

      const updatedStaff = await staff.save();
      res.json({
        _id: updatedStaff._id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        role: updatedStaff.role,
      });
    } else {
      res.status(404).json({ message: 'Staff member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove staff member
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
const removeStaffMember = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (staff && staff.role === 'staff') {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'Staff member removed' });
    } else {
      res.status(404).json({ message: 'Staff member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStaffMembers,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
};
