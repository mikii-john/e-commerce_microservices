const axios = require('axios');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// @desc    Initialize Chapa payment
// @route   POST /api/payments/initialize/:orderId
// @access  Private
const initializePayment = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId).populate('buyer_id');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Order is not in pending status' });
    }

    const tx_ref = `tx-${orderId}-${Date.now()}`;

    const chapaData = {
      amount: order.totalPrice,
      currency: 'ETB',
      email: order.buyer_id.email,
      first_name: order.buyer_id.name.split(' ')[0],
      last_name: order.buyer_id.name.split(' ')[1] || 'User',
      tx_ref,
      callback_url: `${process.env.BACKEND_URL}/api/payments/verify/${tx_ref}`,
      return_url: `${process.env.FRONTEND_URL}/payment-success`,
      "customization[title]": "E-commerce Payment",
      "customization[description]": `Payment for Order #${orderId}`,
    };

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      chapaData,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'success') {
      // Save payment in database
      await Payment.create({
        order_id: orderId,
        tx_ref,
        amount: order.totalPrice,
        status: 'Pending',
        chapa_reference: response.data.data.checkout_url,
      });

      res.status(200).json({
        message: 'Payment initialized',
        checkout_url: response.data.data.checkout_url,
      });
    } else {
      res.status(400).json({ message: 'Payment initialization failed', details: response.data });
    }
  } catch (error) {
    console.error('Chapa Initialization Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Server error during payment initialization' });
  }
};

// @desc    Verify Chapa payment
// @route   GET /api/payments/verify/:tx_ref
// @access  Public (Callback from Chapa)
const verifyPayment = async (req, res) => {
  const { tx_ref } = req.params;

  try {
    const payment = await Payment.findOne({ tx_ref });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status === 'success') {
      await holdPayment(payment.order_id);

      // Redirect or respond
      if (process.env.FRONTEND_URL) {
          res.redirect(`${process.env.FRONTEND_URL}/payment-success?tx_ref=${tx_ref}`);
      } else {
          res.status(200).json({ message: 'Payment verified and order updated' });
      }
    } else {
      payment.status = 'Failed';
      await payment.save();
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Chapa Verification Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Server error during payment verification' });
  }
};

// @desc    Hold payment (Status = Held, Order = Paid)
const holdPayment = async (orderId) => {
  const payment = await Payment.findOne({ order_id: orderId });
  const order = await Order.findById(orderId);

  if (payment && order) {
    payment.status = 'Held';
    await payment.save();

    order.status = 'Paid';
    order.isPaid = true;
    order.paidAt = Date.now();
    await order.save();
    return true;
  }
  return false;
};

// @desc    Release payment (Status = Released, Order = Completed)
const releasePayment = async (orderId) => {
  const payment = await Payment.findOne({ order_id: orderId });
  const order = await Order.findById(orderId);

  if (payment && order) {
    if (payment.status !== 'Held') {
      throw new Error('Payment can only be released from "Held" status');
    }

    payment.status = 'Released';
    await payment.save();

    return true;
  }
  return false;
};

const refundPayment = async (orderId) => {
  const payment = await Payment.findOne({ order_id: orderId });
  const order = await Order.findById(orderId);

  if (payment && order) {
    payment.status = 'Refunded';
    await payment.save();

    order.status = 'Cancelled';
    order.isPaid = false;
    await order.save();
    return true;
  }
  return false;
};

// Endpoint wrappers for inter-service communication
const releasePaymentEndpoint = async (req, res) => {
  try {
    const success = await releasePayment(req.params.orderId);
    if (success) {
      res.status(200).json({ success: true, message: 'Payment released' });
    } else {
      res.status(400).json({ success: false, message: 'Payment release failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const refundPaymentEndpoint = async (req, res) => {
  try {
    const success = await refundPayment(req.params.orderId);
    if (success) {
      res.status(200).json({ success: true, message: 'Payment refunded' });
    } else {
      res.status(400).json({ success: false, message: 'Payment refund failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  holdPayment,
  releasePayment,
  refundPayment,
  releasePaymentEndpoint,
  refundPaymentEndpoint,
};
