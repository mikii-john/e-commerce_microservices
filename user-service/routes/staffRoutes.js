const express = require('express');
const {
  getUsers,
  blockUser,
  unblockUser,
  removeUser,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('staff', 'admin'));

router.route('/users').get(getUsers);
router.route('/users/:id').delete(removeUser);
router.route('/users/:id/block').put(blockUser);
router.route('/users/:id/unblock').put(unblockUser);

module.exports = router;
