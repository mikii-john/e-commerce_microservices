const express = require('express');
const {
  getStaffMembers,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/staff')
  .get(getStaffMembers)
  .post(addStaffMember);

router.route('/staff/:id')
  .put(updateStaffMember)
  .delete(removeStaffMember);

module.exports = router;
