const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Design = require('../models/Design');
const User = require('../models/User');
const Cart = require('../models/Cart');
const stockEmitter = require('../stockEvents');
const multer = require('multer');
const path = require('path');
const { Readable } = require('stream');

// Configure multer for bank slip uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: lazily create and cache a GridFS bucket
let gridFSBucket = null;
function getGridFSBucket() {
  if (gridFSBucket) return gridFSBucket;
  const conn = mongoose.connection;
  if (conn && conn.readyState === 1 && conn.db) {
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
  }
  return gridFSBucket;
}

async function uploadBufferToGridFS(buffer, filename, contentType, metadata = {}) {
  const bucket = getGridFSBucket();
  if (!bucket) throw new Error('Database connection is not ready for file upload');

  return await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, { contentType, metadata });
    const src = Readable.from(buffer);
    src.on('error', reject);
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve({ id: uploadStream.id, filename });
    });
    src.pipe(uploadStream);
  });
}

// Create new order from cart or individual item
router.post('/create', async (req, res) => {
  try {
    const { 
      userEmail, 
      items, // Array of items if ordering from cart, single item if individual
      paymentMethod, 
      bankSlipUrl,
      orderType = 'cart' // 'cart' or 'individual'
    } = req.body;

    if (!userEmail || !items || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'User email, items, and payment method are required'
      });
    }

    // Find customer
    const customer = await User.findOne({ email: userEmail });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate and process items
    const processedItems = [];
    let totalAmount = 0;
    const designersToNotify = new Set();

    for (const item of items) {
      // Get current design data
      const design = await Design.findById(item.designId).populate('designerId', 'name email');
      if (!design) {
        return res.status(404).json({
          success: false,
          message: `Design ${item.designId} not found`
        });
      }

      // Check stock availability
      if (item.quantity > design.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${design.itemName}. Only ${design.quantity} available.`
        });
      }

      const subtotal = design.price * item.quantity;
      totalAmount += subtotal;

      processedItems.push({
        designId: design._id,
        itemName: design.itemName,
        price: design.price,
        quantity: item.quantity,
        imageUrl: design.imageUrl,
        designerName: design.designerId?.name || design.designerId?.email || 'Unknown Designer',
        designerId: design.designerId._id,
        material: design.material,
        boardSize: design.boardSize,
        boardColor: design.boardColor,
        boardThickness: design.boardThickness,
        description: design.description,
        subtotal: subtotal
      });

      designersToNotify.add(design.designerId._id.toString());
    }

    // Extract GridFS file ID from virtual URL if provided
    let bankSlipId = null;
    let bankSlipFilename = null;
    if (bankSlipUrl && bankSlipUrl.startsWith('/api/bankSlip/file/')) {
      // Extract GridFS ID from virtual URL like "/api/bankSlip/file/67123abc..."
      bankSlipId = bankSlipUrl.replace('/api/bankSlip/file/', '');
      bankSlipFilename = `bank-slip-${Date.now()}`;
    }

    // Create order
    const deliveryFee = 250; // Standard delivery fee
    const order = new Order({
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: processedItems,
      totalAmount: totalAmount,
      deliveryFee: deliveryFee,
      paymentMethod: paymentMethod,
      bankSlipId: bankSlipId,
      bankSlipFilename: bankSlipFilename,
      bankSlipUrl: bankSlipId ? null : bankSlipUrl, // Keep legacy URL only if not GridFS
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'paid' : 'pending',
      status: paymentMethod === 'cash_on_delivery' ? 'confirmed' : 'pending'
    });

    await order.save();

    // Deduct stock for each item
    for (const item of processedItems) {
      await Design.findByIdAndUpdate(
        item.designId,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      // Emit stock update event
      stockEmitter.emit('designUpdated', {
        designId: item.designId,
        quantity: (await Design.findById(item.designId)).quantity
      });
    }

    // Mark stock as deducted
    order.stockDeducted = true;
    await order.save();

    // Clear cart if this was a cart order
    if (orderType === 'cart') {
      await Cart.findOneAndUpdate(
        { userId: customer._id },
        { $set: { items: [] } }
      );
    }

    // TODO: Notify designers (this could be done via email or in-app notifications)

    res.json({
      success: true,
      message: 'Order created successfully',
      order: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// Create new order with bank slip upload (GridFS)
router.post('/create-with-bankslip', upload.single('bankSlip'), async (req, res) => {
  try {
    const { 
      userEmail, 
      items, // JSON string of items array
      paymentMethod, 
      orderType = 'cart'
    } = req.body;

    if (!userEmail || !items || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'User email, items, and payment method are required'
      });
    }

    // Parse items if it's a string
    let parsedItems;
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid items format'
      });
    }

    // Check if bank slip is required and uploaded
    if (paymentMethod === 'bank_transfer' && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Bank slip is required for bank transfer payments'
      });
    }

    // Find customer
    const customer = await User.findOne({ email: userEmail });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate and process items
    const processedItems = [];
    let totalAmount = 0;
    const designersToNotify = new Set();

    for (const item of parsedItems) {
      // Get current design data
      const design = await Design.findById(item.designId).populate('designerId', 'name email');
      if (!design) {
        return res.status(404).json({
          success: false,
          message: `Design ${item.designId} not found`
        });
      }

      // Check stock availability
      if (item.quantity > design.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${design.itemName}. Only ${design.quantity} available.`
        });
      }

      const subtotal = design.price * item.quantity;
      totalAmount += subtotal;

      processedItems.push({
        designId: design._id,
        itemName: design.itemName,
        price: design.price,
        quantity: item.quantity,
        imageUrl: design.imageUrl,
        designerName: design.designerId?.name || design.designerId?.email || 'Unknown Designer',
        designerId: design.designerId._id,
        material: design.material,
        boardSize: design.boardSize,
        boardColor: design.boardColor,
        boardThickness: design.boardThickness,
        description: design.description,
        subtotal: subtotal
      });

      designersToNotify.add(design.designerId._id.toString());
    }

    // Upload bank slip to GridFS if provided
    let bankSlipUpload = null;
    if (paymentMethod === 'bank_transfer' && req.file) {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
      bankSlipUpload = await uploadBufferToGridFS(
        req.file.buffer,
        uniqueName,
        req.file.mimetype,
        { type: 'bankSlip', originalName: req.file.originalname, customerEmail: userEmail }
      );
    }

    // Create order
    const deliveryFee = 250; // Standard delivery fee
    const order = new Order({
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: processedItems,
      totalAmount: totalAmount,
      deliveryFee: deliveryFee,
      paymentMethod: paymentMethod,
      bankSlipId: bankSlipUpload ? bankSlipUpload.id : null,
      bankSlipFilename: bankSlipUpload ? bankSlipUpload.filename : null,
      bankSlipUrl: null, // Using GridFS instead
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'paid' : 'pending',
      status: paymentMethod === 'cash_on_delivery' ? 'confirmed' : 'pending'
    });

    await order.save();

    // Deduct stock for each item
    for (const item of processedItems) {
      await Design.findByIdAndUpdate(
        item.designId,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      // Emit stock update event
      stockEmitter.emit('designUpdated', {
        designId: item.designId,
        quantity: (await Design.findById(item.designId)).quantity
      });
    }

    // Mark order as having stock deducted
    order.stockDeducted = true;
    await order.save();

    // Clear cart if ordering from cart
    if (orderType === 'cart') {
      await Cart.findOneAndDelete({ userEmail: userEmail });
    }

    res.json({
      success: true,
      message: 'Order created successfully',
      orderId: order.orderId,
      order: order
    });

  } catch (error) {
    console.error('Error creating order with bank slip:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// Get orders by designer (for designer dashboard)
router.get('/designer/:designerEmail', async (req, res) => {
  try {
    const { designerEmail } = req.params;

    // Find designer
    const designer = await User.findOne({ email: designerEmail });
    if (!designer) {
      return res.status(404).json({
        success: false,
        message: 'Designer not found'
      });
    }

    // Find orders containing items from this designer with paid payment status
    const orders = await Order.find({
      'items.designerId': designer._id,
      status: { $ne: 'cancelled' },
      paymentStatus: 'paid' // Only show orders with paid payment status
    }).populate('customerId', 'name email phone address')
      .sort({ orderDate: -1 });

    // Filter items for this designer only
    const designerOrders = orders.map(order => {
      const designerItems = order.items.filter(item => 
        item.designerId.toString() === designer._id.toString()
      );
      
      const designerTotal = designerItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        _id: order._id,
        orderId: order.orderId,
        customer: order.customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        items: designerItems,
        designerTotal: designerTotal,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        orderDate: order.orderDate,
        deliveryDate: order.deliveryDate,
        notes: order.notes
      };
    });

    res.json({
      success: true,
      orders: designerOrders
    });

  } catch (error) {
    console.error('Error fetching designer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get orders by customer
router.get('/customer/:customerEmail', async (req, res) => {
  try {
    const { customerEmail } = req.params;

    // Find customer
    const customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const orders = await Order.find({ customerId: customer._id })
      .sort({ orderDate: -1 });

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Update order status (for designer/admin use)
router.put('/update-status', async (req, res) => {
  try {
    const { orderId, status, deliveryStatus, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
    if (notes !== undefined) updateData.notes = notes;

    const order = await Order.findOneAndUpdate(
      { orderId: orderId },
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
});

// Notify delivery (for designer use)
router.post('/notify-delivery', async (req, res) => {
  try {
    const { orderId, designerEmail } = req.body;

    if (!orderId || !designerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and designer email are required'
      });
    }

    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status to ready for delivery
    order.status = 'ready_for_delivery';
    order.deliveryStatus = 'not_assigned';
    await order.save();

    // TODO: Send notification to delivery team
    console.log(`Designer ${designerEmail} has marked order ${orderId} as ready for delivery`);

    res.json({
      success: true,
      message: 'Delivery team has been notified',
      order: order
    });

  } catch (error) {
    console.error('Error notifying delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error notifying delivery team',
      error: error.message
    });
  }
});

// Delivery dashboard - marketplace orders
// Query param: ?section=ready|on|completed
router.get('/delivery/marketplace', async (req, res) => {
  try {
    const { section } = req.query;

    let filter = { 'items.0': { $exists: true }, status: { $ne: 'cancelled' } };

    if (section === 'ready') {
      filter.status = 'ready_for_delivery';
      filter.deliveryStatus = 'not_assigned';
    } else if (section === 'on') {
      // Orders that have been picked up or are in transit
      filter.deliveryStatus = { $in: ['picked_up', 'in_transit'] };
    } else if (section === 'completed') {
      filter.deliveryStatus = 'delivered';
    } else {
      // default: return ready items
      filter.status = 'ready_for_delivery';
      filter.deliveryStatus = 'not_assigned';
    }

    const orders = await Order.find(filter)
      .populate('customerId', 'name email phone address')
      .populate('items.designerId', 'name email phone address')
      .sort({ orderDate: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching marketplace delivery orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching delivery orders', error: error.message });
  }
});

// Mark cash collected by delivery partner
router.post('/collect-cash', async (req, res) => {
  try {
    const { orderId, collectedBy } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId required' });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only allow for COD orders
    if (!(order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'cash')) {
      return res.status(400).json({ success: false, message: 'Order is not cash on delivery' });
    }

    order.cashCollected = true;
    order.cashCollectedAt = new Date();
    if (collectedBy) order.cashCollectedBy = collectedBy;
    // Mark paymentStatus as paid when delivery partner collects cash
    order.paymentStatus = 'paid';

    await order.save();

    res.json({ success: true, message: 'Cash collected recorded', order });
  } catch (err) {
    console.error('Error collecting cash:', err);
    res.status(500).json({ success: false, message: 'Failed to record cash collection', error: err.message });
  }
});

// Get orders by user email
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const orders = await Order.find({ customerEmail: email })
      .populate('items.designerId', 'name email')
      .sort({ orderDate: -1 });

    res.json({ 
      success: true, 
      orders: orders,
      message: `Found ${orders.length} orders for ${email}`
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching orders', 
      error: error.message 
    });
  }
});

// Release delivery payment
router.put('/:orderId/release-delivery-payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryTransactionId, paymentReleased, releaseDate } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update payment release information
    order.paymentReleased = paymentReleased || true;
    order.deliveryTransactionId = deliveryTransactionId;
    order.releaseDate = releaseDate || new Date();

    await order.save();

    res.json({ 
      success: true, 
      message: 'Delivery payment released successfully',
      order: {
        _id: order._id,
        orderId: order.orderId,
        paymentReleased: order.paymentReleased,
        deliveryTransactionId: order.deliveryTransactionId,
        releaseDate: order.releaseDate
      }
    });
  } catch (error) {
    console.error('Error releasing delivery payment:', error);
    res.status(500).json({ success: false, message: 'Error releasing delivery payment', error: error.message });
  }
});

module.exports = router;
