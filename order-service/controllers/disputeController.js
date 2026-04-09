const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const axios = require('axios');

// @desc    Create a new dispute
// @route   POST /api/disputes/:orderId
// @access  Private (Buyer)
const createDispute = async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the buyer
    if (order.buyer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to dispute this order' });
    }

    // Check if already disputed
    const existingDispute = await Dispute.findOne({ order_id: orderId });
    if (existingDispute) {
      return res.status(400).json({ message: 'Dispute already exists for this order' });
    }

    const dispute = await Dispute.create({
      order_id: orderId,
      buyer_id: req.user._id,
      reason,
    });

    // Update order status to Disputed
    order.status = 'Disputed';
    await order.save();

    res.status(201).json(dispute);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all disputes (Admin) or user's disputes
// @route   GET /api/disputes
// @access  Private (Admin or My Disputes)
const getDisputes = async (req, res) => {
  try {
    let disputes;
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      disputes = await Dispute.find()
        .populate('order_id')
        .populate('buyer_id', 'name email');
    } else if (req.user.role === 'seller') {
      // Find orders belonging to this seller
      const sellerOrders = await Order.find({ seller_id: req.user._id }).select('_id');
      const orderIds = sellerOrders.map(order => order._id);
      disputes = await Dispute.find({ order_id: { $in: orderIds } })
        .populate('order_id')
        .populate('buyer_id', 'name email');
    } else {
      disputes = await Dispute.find({ buyer_id: req.user._id })
        .populate('order_id');
    }
    res.json(disputes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve a dispute
// @route   PATCH /api/disputes/:id/resolve
// @access  Private (Admin)
const resolveDispute = async (req, res) => {
  const { resolution } = req.body; // 'Refund' or 'Release'
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Only admin or staff can resolve disputes' });
    }
    const dispute = await Dispute.findById(id);

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status === 'Resolved') {
      return res.status(400).json({ message: 'Dispute already resolved' });
    }

    const order = await Order.findById(dispute.order_id);
    if (!order) {
        return res.status(404).json({ message: 'Order associated with this dispute not found' });
    }

    const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';

    if (resolution === 'Refund') {
      await axios.post(`${paymentServiceUrl}/api/payments/refund/${dispute.order_id}`);
      dispute.resolution = 'Refund';
      // refundPayment already sets order status to 'Cancelled'
    } else if (resolution === 'Release') {
      await axios.post(`${paymentServiceUrl}/api/payments/release/${dispute.order_id}`);
      dispute.resolution = 'Release';
      order.status = 'Delivered'; // Mark as delivered upon release
      await order.save();
    } else {
      return res.status(400).json({ message: 'Invalid resolution choice. Use "Refund" or "Release"' });
    }

    dispute.status = 'Resolved';
    await dispute.save();

    res.json({ message: `Dispute resolved with ${resolution}`, dispute });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDispute,
  getDisputes,
  resolveDispute,
};
