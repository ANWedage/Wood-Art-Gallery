const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const DesignerPayment = require('../models/DesignerPayment');
const User = require('../models/User');
const CustomOrder = require('../models/CustomOrder');

// GET customize order income data
router.get('/customize-order-income', async (req, res) => {
  try {
    // Get custom orders that are paid - either bank transfer approved or cash collected
    const customOrders = await CustomOrder.find({
      status: { $ne: 'cancelled' },
      $or: [
        // Bank transfer orders that are approved
        { paymentMethod: 'bank', paymentStatus: 'paid' },
        // Cash orders where delivery partner has collected cash
        { paymentMethod: 'cash', cashCollected: true }
      ]
    })
    .populate('staffDesignerId', 'name email')
    .sort({ updatedAt: -1 });

    const rows = [];
    let totals = {
      totalAmount: 0,
      delivery: 0,
      itemPrice: 0
    };

    for (const order of customOrders) {
      const totalPrice = (order.finalPrice || order.estimatedPrice || 0);
      const deliveryFee = order.deliveryFee || 250;
      const itemPrice = Math.max(0, totalPrice - deliveryFee); // Subtract delivery from total to get item price
      
      totals.totalAmount += totalPrice;
      totals.delivery += deliveryFee;
      totals.itemPrice += itemPrice;

      rows.push({
        orderId: order.orderId || order._id,
        orderMongoId: order._id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        staffDesignerName: order.staffDesignerId ? order.staffDesignerId.name : 'Not Assigned',
        staffDesignerEmail: order.staffDesignerId ? order.staffDesignerId.email : '',
        paymentMethod: order.paymentMethod === 'cash' ? 'Cash on delivery' : 'Bank payment',
        totalPrice: totalPrice,
        deliveryFee: deliveryFee,
        itemPrice: itemPrice,
        paidAt: order.updatedAt,
        status: order.status
      });
    }

    res.json({ 
      success: true, 
      rows, 
      totals,
      count: rows.length 
    });
  } catch (err) {
    console.error('Error fetching customize order income:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load customize order income', 
      error: err.message 
    });
  }
});

// GET marketplace income data
router.get('/marketplace-income', async (req, res) => {
  try {
    // Only consider orders that are paid and not cancelled.
    // For COD orders, require cashCollected=true so marketplace income is recorded only after delivery partner collects cash.
    const orders = await Order.find({
      status: { $ne: 'cancelled' },
      $or: [
        // bank transfers or payments already confirmed and not COD
        { paymentMethod: { $in: ['bank_transfer', 'bank'] }, paymentStatus: 'paid' },
        // COD orders where delivery partner has collected cash
        { paymentMethod: { $in: ['cash_on_delivery', 'cash'] }, paymentStatus: 'paid', cashCollected: true }
      ]
    }).sort({ createdAt: -1 });

    const rows = [];
    let totals = {
      totalPrice: 0,
      delivery: 0,
      itemPrice: 0,
      commission: 0,
      designerPayment: 0
    };

    for (const order of orders) {
      for (const item of order.items) {
        const deliveryFee = order.deliveryFee || 250; // flat rate per order (not per item)
        const itemTotal = item.subtotal; // price * quantity
        const itemPrice = itemTotal; // excluding delivery
        const commission = +(itemPrice * 0.20).toFixed(2);
        const designerAmount = +(itemPrice - commission).toFixed(2);

        totals.totalPrice += itemTotal + deliveryFee; // for display, treat delivery once per item for totals proportionally
        totals.delivery += deliveryFee; // this will be over-counted if multiple items share same order; adjust later
        totals.itemPrice += itemPrice;
        totals.commission += commission;
        totals.designerPayment += designerAmount;

        // Check if payment released using orderItemId for line-level uniqueness
        const paymentRecord = await DesignerPayment.findOne({ orderId: order.orderId, orderItemId: item._id });
        const designerUser = await User.findById(item.designerId);
        rows.push({
          orderId: order.orderId,
          orderMongoId: order._id,
          orderItemId: item._id, // include for frontend
          designId: item.designId,
          itemName: item.itemName,
          quantity: item.quantity,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          designerName: item.designerName,
          designerEmail: designerUser ? designerUser.email : '',
          paymentMethod: order.paymentMethod, // added
          totalPrice: itemTotal + deliveryFee,
          deliveryFee: deliveryFee,
          itemPrice: itemPrice,
          commission: commission,
          designerAmount: designerAmount,
          released: !!paymentRecord,
          releasedAt: paymentRecord ? paymentRecord.releasedAt : null,
          paymentRecordId: paymentRecord ? paymentRecord._id : null
        });
      }
    }

    // Adjust delivery totals: since delivery fee applied per order, not per item.
    // Recompute delivery by summing unique orders only.
    const uniqueOrderIds = new Set();
    let deliveryTotal = 0;
    for (const order of orders) {
      if (!uniqueOrderIds.has(order.orderId)) {
        uniqueOrderIds.add(order.orderId);
        deliveryTotal += (order.deliveryFee || 250);
      }
    }
    totals.delivery = deliveryTotal;
    // Recompute totalPrice as itemPrice + delivery
    totals.totalPrice = totals.itemPrice + totals.delivery;

    res.json({ success: true, rows, totals });
  } catch (err) {
    console.error('Error fetching marketplace income:', err);
    res.status(500).json({ success: false, message: 'Failed to load marketplace income', error: err.message });
  }
});

// POST release payment for a specific order item
router.post('/release-designer-payment', async (req, res) => {
  try {
    const { orderId, designId, orderItemId } = req.body;
    if (!orderId || !designId) return res.status(400).json({ success: false, message: 'orderId and designId required' });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Find item by orderItemId if provided, otherwise by designId
    let item;
    if (orderItemId) {
      item = order.items.find(i => i._id.toString() === orderItemId);
    } else {
      item = order.items.find(i => i.designId.toString() === designId);
    }
    if (!item) return res.status(404).json({ success: false, message: 'Order item not found' });

    // Check for existing payment using orderItemId for line-level uniqueness
    const existing = await DesignerPayment.findOne({ orderId, orderItemId: item._id });
    if (existing) return res.status(400).json({ success: false, message: 'Payment already released for this order line' });

    const deliveryFee = order.deliveryFee || 250;
    const itemPrice = item.subtotal; // exclude delivery
    const commission = +(itemPrice * 0.20).toFixed(2);
    const designerAmount = +(itemPrice - commission).toFixed(2);

    // Fetch designer user for email
    const designerUser = await User.findById(item.designerId);

    let payment;
    try {
      payment = await DesignerPayment.create({
        orderId: order.orderId,
        orderMongoId: order._id,
        orderItemId: item._id, // unique line item ID
        orderItemDesignId: item.designId,
        designerId: item.designerId,
        designerName: item.designerName,
        designerEmail: designerUser ? designerUser.email : '',
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        itemName: item.itemName,
        quantity: item.quantity,
        itemSubtotal: item.subtotal,
        deliveryFee: deliveryFee,
        commission: commission,
        designerAmount: designerAmount,
        releasedBy: req.userEmail || 'financial@system'
      });
    } catch (createError) {
      // Handle duplicate key error from MongoDB
      if (createError.code === 11000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Payment already released for this order line item' 
        });
      }
      throw createError;
    }

    res.json({ success: true, message: 'Payment released successfully', payment });
  } catch (err) {
    console.error('Error releasing payment:', err);
    res.status(500).json({ success: false, message: 'Failed to release payment', error: err.message });
  }
});

// GET designer payment history
router.get('/designer-payment-history/:designerEmail', async (req, res) => {
  try {
    const { designerEmail } = req.params;
    const payments = await DesignerPayment.find({ designerEmail }).sort({ releasedAt: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    console.error('Error fetching designer payment history:', err);
    res.status(500).json({ success: false, message: 'Failed to load payment history', error: err.message });
  }
});

module.exports = router;
