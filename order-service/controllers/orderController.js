const Order = require('../models/Order');
const Product = require('../models/Product');
const axios = require('axios');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Buyer
const createOrder = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    try {
      const enrichedOrderItems = [];
      let seller_id = null;

      // 1. Verify stock and enrich items with product details
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Product not found: ${item.product}` });
        }
        if (product.stock < item.qty) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }

        // Set seller_id from the first product (assuming one seller for simplified logic)
        if (!seller_id) {
          seller_id = product.seller_id;
        }

        enrichedOrderItems.push({
          name: product.name,
          qty: Number(item.qty),
          image: product.image,
          price: product.price,
          product: product._id,
        });
      }

      // 2. Reduce stock for all items
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.qty }
        });
      }

      // 3. Create the order with enriched items
      const order = new Order({
        orderItems: enrichedOrderItems,
        buyer_id: req.user._id,
        seller_id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        status: 'Pending',
        isPaid: false,
      });

      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during order creation', error: error.message });
    }
  }
};

// @desc    Get buyer orders
// @route   GET /api/orders/buyer
// @access  Private/Buyer
const getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer_id: req.user._id })
      .populate('orderItems.product', 'name price image')
      .populate('seller_id', 'name email');
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller
// @access  Private/Seller
const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller_id: req.user._id })
      .populate('orderItems.product', 'name price image')
      .populate('buyer_id', 'name email');
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Ship order and add tracking number
// @route   PUT /api/orders/:id/ship
// @access  Private/Seller
const shipOrder = async (req, res) => {
  try {
    const { tracking_number } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the seller
    if (order.seller_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the seller can ship this order' });
    }

    if (order.status !== 'Paid') {
      return res.status(400).json({ message: 'Order must be Paid to be shipped' });
    }

    if (!tracking_number) {
      return res.status(400).json({ message: 'Tracking number is required' });
    }

    order.tracking_number = tracking_number;
    order.status = 'Shipped';
    await order.save();

    res.status(200).json({ message: 'Order shipped successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during shipping' });
  }
};

// @desc    Confirm delivery and release payment
// @route   PUT /api/orders/:id/confirm-delivery
// @access  Private/Buyer
const confirmDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the user is the buyer
    if (order.buyer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the buyer can confirm delivery' });
    }

    // Check if order status is appropriate (Paid or Shipped)
    if (order.status !== 'Paid' && order.status !== 'Shipped') {
      return res.status(400).json({ message: 'Order must be Paid or Shipped to confirm delivery' });
    }

    // Release payment via escrow logic
    const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
    const response = await axios.post(`${paymentServiceUrl}/api/payments/release/${order._id}`);
    const success = response.data.success;

    if (success) {
      order.status = 'Delivered';
      await order.save();
      res.status(200).json({ message: 'Delivery confirmed and payment released' });
    } else {
      res.status(400).json({ message: 'Payment release failed. Please contact support.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during delivery confirmation' });
  }
};

// @desc    Get all orders for admin and staff
// @route   GET /api/orders
// @access  Private/Admin/Staff
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('orderItems.product', 'name price image')
      .populate('buyer_id', 'name email')
      .populate('seller_id', 'name email');
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getAllOrders,
  confirmDelivery,
  shipOrder,
};
