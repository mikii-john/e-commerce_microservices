const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createDispute,
  getDisputes,
  resolveDispute,
} = require('../controllers/disputeController');

// @route   GET /api/disputes
// @access  Private (Admin or Buyer)
router.route('/').get(protect, getDisputes);

// @route   POST /api/disputes/:orderId
// @access  Private (Buyer)
router.route('/:orderId').post(protect, authorize('buyer'), createDispute);

// @route   PATCH /api/disputes/:id/resolve
// @access  Private (Admin)
router.route('/:id/resolve').patch(protect, authorize('admin'), resolveDispute);

module.exports = router;
