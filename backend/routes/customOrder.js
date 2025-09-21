const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const CustomOrder = require('../models/CustomOrder');
const User = require('../models/User');
const { sendOrderAcceptedEmail } = require('../utils/emailService');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Helper: upload a Buffer to GridFS and resolve with the file id and filename
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

// Configure multer for file uploads (memory storage for DB persistence)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Create a new custom order
router.post('/create', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'bankSlip', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== CUSTOM ORDER CREATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Uploaded files (in-memory):', Object.keys(req.files || {}));
    
    const { 
      customerName, 
      customerEmail, 
      customerPhone,
      customerAddress,
      boardColor, 
      material, 
      boardSize, 
      boardThickness, 
      description,
      totalPrice,
      paymentMethod
    } = req.body;
    
    // Validate required fields
    if (!customerName || !customerEmail || !boardColor || !material || !boardSize || !boardThickness) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if reference image was uploaded
    if (!req.files || !req.files.image || !req.files.image[0]) {
      return res.status(400).json({
        success: false,
        message: 'Reference image is required'
      });
    }

    // Check if bank slip is required and uploaded
    if (paymentMethod === 'bank' && (!req.files.bankSlip || !req.files.bankSlip[0])) {
      return res.status(400).json({
        success: false,
        message: 'Bank slip is required for bank payments'
      });
    }

    // Upload files to GridFS
    const imageFile = req.files.image[0];
    const imageUniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(imageFile.originalname)}`;
    const imageUpload = await uploadBufferToGridFS(
      imageFile.buffer,
      imageUniqueName,
      imageFile.mimetype,
      { type: 'referenceImage', originalName: imageFile.originalname, customerEmail }
    );

    // Bank slip: now store in GridFS too
    let bankSlipUpload = null;
    if (paymentMethod === 'bank' && req.files.bankSlip && req.files.bankSlip[0]) {
      const bankFile = req.files.bankSlip[0];
      const bankUniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(bankFile.originalname)}`;
      bankSlipUpload = await uploadBufferToGridFS(
        bankFile.buffer,
        bankUniqueName,
        bankFile.mimetype,
        { type: 'bankSlip', originalName: bankFile.originalname, customerEmail }
      );
    }

    // Create the custom order
    const deliveryFeeAmount = req.body.deliveryFee ? parseFloat(req.body.deliveryFee) : 250;
    const newCustomOrder = new CustomOrder({
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || '',
      boardColor,
      material,
      boardSize,
      boardThickness,
      // Prefer DB storage
      referenceImageId: imageUpload.id,
      referenceImageFilename: imageUpload.filename,
      // Keep URL field null for DB-stored images (legacy support retained for old orders)
      referenceImageUrl: null,
      description: description || '',
      estimatedPrice: totalPrice ? parseFloat(totalPrice) : 0,
      deliveryFee: deliveryFeeAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentMethod === 'bank' ? 'pending' : 'paid',
      bankSlipId: bankSlipUpload ? bankSlipUpload.id : null,
      bankSlipFilename: bankSlipUpload ? bankSlipUpload.filename : null,
      bankSlipUrl: null,
      status: 'pending'
    });

    const savedOrder = await newCustomOrder.save();
    console.log('SUCCESS: Custom order created with ID:', savedOrder._id);

    res.json({
      success: true,
      message: 'Custom design order created successfully',
      order: savedOrder
    });

  } catch (error) {
    console.error('ERROR in custom order creation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating custom order'
    });
  }
});

// Get all pending custom orders (for staff designers)
router.get('/pending', async (req, res) => {
  try {
    console.log('=== GET PENDING CUSTOM ORDERS REQUEST ===');
    
    // Only show orders that are pending AND have payment approved
    // For cash payments, paymentStatus is 'paid' by default
    // For bank payments, paymentStatus becomes 'paid' only after financial approval
    const pendingOrders = await CustomOrder.find({ 
      status: 'pending',
      paymentStatus: 'paid'
    })
      .sort({ createdAt: -1 });

    console.log(`SUCCESS: Found ${pendingOrders.length} pending custom orders with approved payments`);

    res.json({
      success: true,
      orders: pendingOrders
    });

  } catch (error) {
    console.error('ERROR in fetching pending custom orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pending orders'
    });
  }
});

// Get all accepted custom orders (for staff designers)
router.get('/accepted', async (req, res) => {
  try {
    console.log('=== GET ACCEPTED CUSTOM ORDERS REQUEST ===');
    
    const acceptedOrders = await CustomOrder.find({ status: 'accepted' })
      .sort({ updatedAt: -1 });

    console.log(`SUCCESS: Found ${acceptedOrders.length} accepted custom orders`);

    res.json({
      success: true,
      orders: acceptedOrders
    });

  } catch (error) {
    console.error('ERROR in fetching accepted custom orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching accepted orders'
    });
  }
});

// Get all completed custom orders (for staff designers)
router.get('/completed', async (req, res) => {
  try {
    console.log('=== GET COMPLETED CUSTOM ORDERS REQUEST ===');
    
    const completedOrders = await CustomOrder.find({ status: 'completed' })
      .sort({ updatedAt: -1 });

    console.log(`SUCCESS: Found ${completedOrders.length} completed custom orders`);

    res.json({
      success: true,
      orders: completedOrders
    });

  } catch (error) {
    console.error('ERROR in fetching completed custom orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching completed orders'
    });
  }
});

// Accept a custom order (for staff designers)
router.put('/:orderId/accept', async (req, res) => {
  try {
    console.log('=== ACCEPT CUSTOM ORDER REQUEST ===');
    console.log('Order ID:', req.params.orderId);
    console.log('Request body:', req.body);
    
    const { staffDesignerId, estimatedPrice, notes } = req.body;
    const { orderId } = req.params;

    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID provided'
      });
    }

    // Find order by orderId (readable ID) or by MongoDB _id
    let order;
    if (orderId.startsWith('WA-')) {
      order = await CustomOrder.findOne({ orderId: orderId });
    } else {
      // Check if it's a valid MongoDB ObjectId format
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await CustomOrder.findById(orderId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID format'
        });
      }
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending status'
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order payment has not been approved yet'
      });
    }

    // Update order
    order.status = 'accepted';
    if (staffDesignerId) {
      order.staffDesignerId = staffDesignerId;
    }
    if (estimatedPrice) {
      order.estimatedPrice = estimatedPrice;
    }
    if (notes) {
      order.notes = notes;
    }

    const updatedOrder = await order.save();
    console.log('SUCCESS: Custom order accepted');

    // Send email notification to customer (do not fail the request if email fails)
    (async () => {
      try {
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const emailResult = await sendOrderAcceptedEmail(
          updatedOrder.customerEmail,
          updatedOrder.customerName,
          updatedOrder,
          baseUrl
        );
        console.log('Order accepted email result:', emailResult);
      } catch (emailError) {
        console.error('Failed to send order accepted email:', emailError);
      }
    })();

    res.json({
      success: true,
      message: 'Order accepted successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('ERROR in accepting custom order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error accepting order'
    });
  }
});

// Get orders by staff designer
router.get('/staff/:staffDesignerId', async (req, res) => {
  try {
    console.log('=== GET STAFF DESIGNER CUSTOM ORDERS REQUEST ===');
    const { staffDesignerId } = req.params;
    const { status } = req.query;
    
    let query = { staffDesignerId };
    if (status) {
      query.status = status;
    }

    const orders = await CustomOrder.find(query)
      .sort({ updatedAt: -1 });

    console.log(`SUCCESS: Found ${orders.length} custom orders for staff designer`);

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('ERROR in fetching staff designer custom orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching orders'
    });
  }
});

// Update custom order status
router.put('/:orderId/status', async (req, res) => {
  try {
    console.log('=== UPDATE CUSTOM ORDER STATUS REQUEST ===');
    const { orderId } = req.params;
    const { status, finalPrice, notes } = req.body;

    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID provided'
      });
    }

    // Find order by orderId (readable ID) or by MongoDB _id
    let order;
    if (orderId.startsWith('WA-')) {
      order = await CustomOrder.findOne({ orderId: orderId });
    } else {
      // Check if it's a valid MongoDB ObjectId format
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await CustomOrder.findById(orderId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID format'
        });
      }
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (finalPrice) {
      order.finalPrice = finalPrice;
    }
    if (notes) {
      order.notes = notes;
    }

    const updatedOrder = await order.save();
    console.log('SUCCESS: Custom order status updated');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('ERROR in updating custom order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating order status'
    });
  }
});

// Get all custom orders
router.get('/all', async (req, res) => {
  try {
    console.log('=== GET ALL CUSTOM ORDERS REQUEST ===');
    
    const orders = await CustomOrder.find()
      .sort({ createdAt: -1 });

    console.log(`SUCCESS: Found ${orders.length} total custom orders`);

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('ERROR in fetching all custom orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching orders'
    });
  }
});

// Download reference image
router.get('/:orderId/download-image', async (req, res) => {
  try {
    console.log('=== DOWNLOAD REFERENCE IMAGE REQUEST ===');
    const { orderId } = req.params;
    
    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID provided'
      });
    }
    
    // Find order by orderId (readable ID) or by MongoDB _id
    let order;
    if (orderId.startsWith('WA-')) {
      order = await CustomOrder.findOne({ orderId: orderId });
    } else {
      // Check if it's a valid MongoDB ObjectId format
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await CustomOrder.findById(orderId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID format'
        });
      }
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Prefer downloading from GridFS
    if (order.referenceImageId) {
      const bucket = getGridFSBucket();
      if (!bucket) {
        return res.status(500).json({ success: false, message: 'File storage not available' });
      }

      const _id = new mongoose.Types.ObjectId(order.referenceImageId);
      const files = await bucket.find({ _id }).toArray();
      if (!files || files.length === 0) {
        return res.status(404).json({ success: false, message: 'Image file not found in database' });
      }

      const fileDoc = files[0];
      const ext = path.extname(fileDoc.filename || '').toLowerCase();
      let contentType = fileDoc.contentType || 'application/octet-stream';
      if (!fileDoc.contentType) {
        switch (ext) {
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.gif':
            contentType = 'image/gif';
            break;
          case '.webp':
            contentType = 'image/webp';
            break;
        }
      }

      const filename = `${order.orderId}_reference${ext || ''}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);

      const downloadStream = bucket.openDownloadStream(_id);
      downloadStream.on('error', (err) => {
        console.error('GridFS download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming image from database' });
        }
      });
      return downloadStream.pipe(res);
    }

    // Fallback: legacy path-based storage
    if (!order.referenceImageUrl) {
      return res.status(404).json({
        success: false,
        message: 'No reference image found for this order'
      });
    }

    // Construct file path
    const imagePath = path.join(__dirname, '..', order.referenceImageUrl);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found on server'
      });
    }

    // Get file extension for proper content type
    const ext = path.extname(imagePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    // Set headers for download
    const filename = `${order.orderId}_reference${ext}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);

    // Stream the file
    const fileStream = fs.createReadStream(imagePath);
    fileStream.pipe(res);
    
    console.log(`SUCCESS: Image download initiated for order ${order.orderId}`);

  } catch (error) {
    console.error('ERROR in downloading reference image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error downloading image'
    });
  }
});

// Migration route to add orderId to existing orders (run once)
router.post('/migrate-order-ids', async (req, res) => {
  try {
    console.log('=== MIGRATE ORDER IDS REQUEST ===');
    
    // Find all orders without orderId
    const ordersWithoutId = await CustomOrder.find({ 
      $or: [
        { orderId: { $exists: false } },
        { orderId: null },
        { orderId: '' }
      ]
    });

    console.log(`Found ${ordersWithoutId.length} orders without readable IDs`);
    
    let updatedCount = 0;
    const existingOrderIds = new Set();
    
    // Get all existing orderIds to avoid duplicates
    const existingOrders = await CustomOrder.find({ orderId: { $exists: true, $ne: null, $ne: '' } });
    existingOrders.forEach(order => {
      if (order.orderId) {
        existingOrderIds.add(order.orderId);
      }
    });

    for (const order of ordersWithoutId) {
      let newOrderId;
      let attempts = 0;
      
      do {
        // Generate readable order ID: WA-YYYY-MMDD-XXX
        const createdAt = order.createdAt || new Date();
        const year = createdAt.getFullYear();
        const month = String(createdAt.getMonth() + 1).padStart(2, '0');
        const day = String(createdAt.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        newOrderId = `WA-${year}-${month}${day}-${random}`;
        attempts++;
      } while (existingOrderIds.has(newOrderId) && attempts < 10);
      
      if (attempts < 10) {
        order.orderId = newOrderId;
        await order.save();
        existingOrderIds.add(newOrderId);
        updatedCount++;
        console.log(`Updated order ${order._id} with orderId: ${newOrderId}`);
      } else {
        console.error(`Failed to generate unique orderId for order ${order._id}`);
      }
    }
    
    res.json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} orders with readable IDs.`,
      updatedCount: updatedCount,
      totalFound: ordersWithoutId.length
    });

  } catch (error) {
    console.error('ERROR in migrating order IDs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error migrating order IDs'
    });
  }
});

// Notify delivery endpoint for custom orders
router.post('/:orderId/notify-delivery', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`=== NOTIFY DELIVERY REQUEST for Custom Order ${orderId} ===`);
    
    // Find the custom order
    const customOrder = await CustomOrder.findOne({ 
      $or: [
        { orderId: orderId },
        { _id: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null }
      ]
    });
    
    if (!customOrder) {
      return res.status(404).json({
        success: false,
        message: 'Custom order not found'
      });
    }
    
    // Check if order is completed
    if (customOrder.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order must be completed before notifying delivery'
      });
    }
    
    // Update delivery status to ready for delivery
    customOrder.deliveryStatus = 'ready_for_delivery';
    await customOrder.save();
    
    console.log(`Custom order ${orderId} marked as ready for delivery`);
    
    res.json({
      success: true,
      message: 'Delivery team has been notified about the completed custom order',
      order: customOrder
    });
    
  } catch (error) {
    console.error('Error notifying delivery for custom order:', error);
    res.status(500).json({
      success: false,
      message: 'Error notifying delivery team',
      error: error.message
    });
  }
});

// Delivery dashboard - custom orders
// Query param: ?section=ready|on|completed
router.get('/delivery/custom', async (req, res) => {
  try {
    const { section } = req.query;
    
    console.log(`=== DELIVERY CUSTOM ORDERS REQUEST - Section: ${section} ===`);
    
    let filter = { status: { $ne: 'cancelled' } };
    
    if (section === 'ready') {
      filter.status = 'completed';
      filter.deliveryStatus = 'ready_for_delivery';
    } else if (section === 'on') {
      filter.deliveryStatus = 'picked_up';
    } else if (section === 'completed') {
      filter.deliveryStatus = 'delivered';
    } else {
      // Default to ready
      filter.status = 'completed';
      filter.deliveryStatus = 'ready_for_delivery';
    }
    
    console.log('Filter used:', filter);
    
    const customOrders = await CustomOrder.find(filter)
      .populate('staffDesignerId', 'name email phone address')
      .sort({ updatedAt: -1 });
    
    // For orders without customerAddress, try to get it from user data
    const enrichedOrders = await Promise.all(customOrders.map(async (order) => {
      const orderObj = order.toObject();
      
      if ((!orderObj.customerAddress || orderObj.customerAddress.trim() === '') && orderObj.customerEmail) {
        try {
          const customer = await User.findOne({ email: orderObj.customerEmail });
          if (customer && customer.address) {
            orderObj.customerAddress = customer.address;
          }
        } catch (err) {
          console.warn(`Could not fetch customer data for ${orderObj.customerEmail}:`, err.message);
        }
      }
      
      return orderObj;
    }));
    
    console.log(`Found ${enrichedOrders.length} custom orders for section: ${section}`);
    
    res.json({
      success: true,
      orders: enrichedOrders,
      section: section || 'ready'
    });
    
  } catch (error) {
    console.error('Error fetching custom orders for delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom orders',
      error: error.message
    });
  }
});

// Update delivery status for custom orders
router.put('/:orderId/delivery-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;
    
    console.log(`=== UPDATE DELIVERY STATUS for Custom Order ${orderId} to ${deliveryStatus} ===`);
    
    // Validate delivery status
    const validStatuses = ['not_assigned', 'ready_for_delivery', 'picked_up', 'delivered'];
    if (!validStatuses.includes(deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status'
      });
    }
    
    // Find and update the custom order
    const customOrder = await CustomOrder.findOne({ 
      $or: [
        { orderId: orderId },
        { _id: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null }
      ]
    });
    
    if (!customOrder) {
      return res.status(404).json({
        success: false,
        message: 'Custom order not found'
      });
    }
    
    customOrder.deliveryStatus = deliveryStatus;
    await customOrder.save();
    
    console.log(`Custom order ${orderId} delivery status updated to ${deliveryStatus}`);
    
    res.json({
      success: true,
      message: `Delivery status updated to ${deliveryStatus}`,
      order: customOrder
    });
    
  } catch (error) {
    console.error('Error updating custom order delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery status',
      error: error.message
    });
  }
});

// Debug endpoint to check all custom orders and their statuses
router.get('/debug/all', async (req, res) => {
  try {
    const allOrders = await CustomOrder.find({})
      .select('orderId customerName status deliveryStatus paymentMethod cashCollected')
      .sort({ updatedAt: -1 });
    
    console.log('=== ALL CUSTOM ORDERS DEBUG ===');
    allOrders.forEach(order => {
      console.log(`Order: ${order.orderId}, Status: ${order.status}, DeliveryStatus: ${order.deliveryStatus}, Customer: ${order.customerName}`);
    });
    
    res.json({
      success: true,
      total: allOrders.length,
      orders: allOrders
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching debug data',
      error: error.message
    });
  }
});

// Collect cash for custom order (delivery person confirms cash received)
router.post('/collect-cash', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    console.log(`=== COLLECT CASH for Custom Order ${orderId} ===`);
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    // Find the custom order
    const customOrder = await CustomOrder.findOne({ 
      $or: [
        { orderId: orderId },
        { _id: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null }
      ]
    });
    
    if (!customOrder) {
      return res.status(404).json({
        success: false,
        message: 'Custom order not found'
      });
    }
    
    // Check if it's a cash payment
    if (customOrder.paymentMethod !== 'cash') {
      return res.status(400).json({
        success: false,
        message: 'This order is not a cash payment'
      });
    }
    
    // Update cash collected status
    customOrder.cashCollected = true;
    await customOrder.save();
    
    console.log(`Cash collected for custom order ${orderId}`);
    
    res.json({
      success: true,
      message: 'Cash collection recorded successfully',
      order: customOrder
    });
    
  } catch (error) {
    console.error('Error collecting cash for custom order:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording cash collection',
      error: error.message
    });
  }
});

// Delete a custom order
router.delete('/:orderId', async (req, res) => {
  try {
    console.log('=== DELETE CUSTOM ORDER REQUEST ===');
    const { orderId } = req.params;

    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID provided'
      });
    }

    // Find order by orderId (readable ID) or by MongoDB _id
    let order;
    if (orderId.startsWith('WA-')) {
      order = await CustomOrder.findOne({ orderId: orderId });
    } else {
      // Check if it's a valid MongoDB ObjectId format
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await CustomOrder.findById(orderId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID format'
        });
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Store order info for response
    const deletedOrderInfo = {
      orderId: order.orderId,
      customerName: order.customerName,
      status: order.status
    };

    // Delete the order
    await CustomOrder.findByIdAndDelete(order._id);

    console.log(`SUCCESS: Custom order deleted - ${deletedOrderInfo.orderId}`);

    res.json({
      success: true,
      message: 'Order deleted successfully',
      deletedOrder: deletedOrderInfo
    });

  } catch (error) {
    console.error('ERROR in deleting custom order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting order'
    });
  }
});

// Get custom orders by user email
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const customOrders = await CustomOrder.find({ customerEmail: email })
      .populate('staffDesignerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      orders: customOrders,
      message: `Found ${customOrders.length} custom orders for ${email}`
    });
  } catch (error) {
    console.error('Error fetching user custom orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching custom orders', 
      error: error.message 
    });
  }
});

// Release delivery payment for custom order
router.put('/:orderId/release-delivery-payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryTransactionId, paymentReleased, releaseDate } = req.body;

    const customOrder = await CustomOrder.findById(orderId);
    if (!customOrder) {
      return res.status(404).json({ success: false, message: 'Custom order not found' });
    }

    // Update payment release information
    customOrder.paymentReleased = paymentReleased || true;
    customOrder.deliveryTransactionId = deliveryTransactionId;
    customOrder.releaseDate = releaseDate || new Date();

    await customOrder.save();

    res.json({ 
      success: true, 
      message: 'Delivery payment released successfully',
      order: {
        _id: customOrder._id,
        orderId: customOrder.orderId,
        paymentReleased: customOrder.paymentReleased,
        deliveryTransactionId: customOrder.deliveryTransactionId,
        releaseDate: customOrder.releaseDate
      }
    });
  } catch (error) {
    console.error('Error releasing delivery payment:', error);
    res.status(500).json({ success: false, message: 'Error releasing delivery payment', error: error.message });
  }
});

module.exports = router;
