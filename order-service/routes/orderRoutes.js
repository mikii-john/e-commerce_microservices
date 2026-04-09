const express = require('express');
const router = express.Router();
const {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getAllOrders,
  confirmDelivery,
  shipOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/orders
// @access  Private/Admin/Staff
router.get('/', protect, authorize('admin', 'staff'), getAllOrders);

// @route   POST /api/orders
// @access  Private/Buyer
router.post('/', protect, authorize('buyer'), createOrder);

// @route   GET /api/orders/buyer
// @access  Private/Buyer
router.get('/buyer', protect, authorize('buyer'), getBuyerOrders);

// @route   GET /api/orders/seller
// @access  Private/Seller
router.get('/seller', protect, authorize('seller'), getSellerOrders);

// @route   PUT /api/orders/:id/ship
// @access  Private/Seller
router.put('/:id/ship', protect, authorize('seller'), shipOrder);

// @route   PUT /api/orders/:id/confirm-delivery
// @access  Private/Buyer
router.put('/:id/confirm-delivery', protect, authorize('buyer'), confirmDelivery);

module.exports = router;
