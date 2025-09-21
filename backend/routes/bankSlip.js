const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CustomOrder = require('../models/CustomOrder');
const Order = require('../models/Order');
const Design = require('../models/Design');
const stockEmitter = require('../stockEvents');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const { sendPaymentApprovedEmail, sendPaymentDeniedEmail } = require('../utils/emailService');

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

// Upload bank slip
router.post('/upload', upload.single('bankSlip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
    const grid = await uploadBufferToGridFS(
      req.file.buffer,
      uniqueName,
      req.file.mimetype,
      { type: 'bankSlip', originalName: req.file.originalname }
    );

    res.json({
      success: true,
      // Return a virtual URL so frontend can store one string regardless of storage
      filePath: `/api/bankSlip/file/${grid.id.toString()}`,
      fileId: grid.id,
      filename: grid.filename
    });
  } catch (error) {
    console.error('Error uploading bank slip:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading bank slip'
    });
  }
});

// Stream a bank slip file by GridFS ID
router.get('/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid file id' });
    }

    const bucket = getGridFSBucket();
    const _id = new mongoose.Types.ObjectId(id);

    const files = await bucket.find({ _id }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found in database' });
    }

    const fileDoc = files[0];
    const ext = path.extname(fileDoc.filename || '').toLowerCase();
    const contentType = fileDoc.contentType || 'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="bank-slip-${id}${ext}"`);
    res.setHeader('Content-Type', contentType);

    const stream = bucket.openDownloadStream(_id);
    stream.on('error', (err) => {
      console.error('GridFS download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Error streaming bank slip file:', error);
    res.status(500).json({ success: false, message: 'Error streaming file' });
  }
});

// Get all pending bank slip approvals
router.get('/pending', async (req, res) => {
  try {
    console.log('=== GET PENDING BANK SLIPS REQUEST ===');
    
    // Get pending custom orders
    const pendingCustomOrders = await CustomOrder.find({ 
      paymentMethod: 'bank',
      paymentStatus: 'pending'
    })
    .sort({ createdAt: -1 });

    // Get pending regular orders
    const pendingRegularOrders = await Order.find({ 
      paymentMethod: 'bank_transfer',
      paymentStatus: 'pending'
    })
    .sort({ createdAt: -1 });

    // Combine both types and mark them
    const allPendingBankSlips = [
      ...pendingCustomOrders.map(order => ({ ...order.toObject(), orderType: 'custom' })),
      ...pendingRegularOrders.map(order => ({ ...order.toObject(), orderType: 'regular' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`SUCCESS: Found ${allPendingBankSlips.length} pending bank slips (${pendingCustomOrders.length} custom, ${pendingRegularOrders.length} regular)`);

    res.json({
      success: true,
      bankSlips: allPendingBankSlips
    });

  } catch (error) {
    console.error('ERROR in fetching pending bank slips:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pending bank slips'
    });
  }
});

// Approve or deny a bank slip
router.put('/:orderId/status', async (req, res) => {
  try {
    console.log('=== UPDATE BANK SLIP STATUS REQUEST ===');
    const { orderId } = req.params;
    const { paymentStatus, notes } = req.body;

    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID provided'
      });
    }

    if (!paymentStatus || !['paid', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment status (paid/failed) is required'
      });
    }

    // Find order by orderId (readable ID) or by MongoDB _id
    let order;
    let isCustomOrder = false;

    // First try to find as custom order
    if (orderId.startsWith('WA-')) {
      order = await CustomOrder.findOne({ orderId: orderId });
      isCustomOrder = true;
    } else if (orderId.startsWith('WAG-')) {
      // Regular orders start with WAG-
      order = await Order.findOne({ orderId: orderId });
      isCustomOrder = false;
    } else if (mongoose.Types.ObjectId.isValid(orderId)) {
      // Try custom order by ID first
      order = await CustomOrder.findById(orderId);
      if (order) {
        isCustomOrder = true;
      } else {
        // Try regular order by ID
        order = await Order.findById(orderId);
        isCustomOrder = false;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check payment method based on order type
    const expectedPaymentMethod = isCustomOrder ? 'bank' : 'bank_transfer';
    if (order.paymentMethod !== expectedPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Order is not a bank payment'
      });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not in pending status'
      });
    }

    // Update payment status
    order.paymentStatus = paymentStatus;
    
    // For regular orders, also update status when payment is approved
    if (!isCustomOrder && paymentStatus === 'paid') {
      order.status = 'confirmed';
    }
    
    // For regular orders (marketplace), restore stock if payment is denied
    if (!isCustomOrder && paymentStatus === 'failed' && order.stockDeducted) {
      console.log(`Restoring stock for denied order ${order.orderId}`);
      
      // Restore stock for each item in the order
      for (const item of order.items) {
        try {
          const updatedDesign = await Design.findByIdAndUpdate(
            item.designId,
            { $inc: { quantity: item.quantity } },
            { new: true }
          );
          
          if (updatedDesign) {
            console.log(`Restored ${item.quantity} units of ${item.itemName} (Design ID: ${item.designId})`);
            
            // Emit stock update event
            stockEmitter.emit('designUpdated', {
              designId: item.designId,
              quantity: updatedDesign.quantity
            });
          } else {
            console.error(`Failed to find design ${item.designId} for stock restoration`);
          }
        } catch (stockError) {
          console.error(`Error restoring stock for design ${item.designId}:`, stockError);
        }
      }
      
      // Mark stock as restored
      order.stockDeducted = false;
      console.log(`Stock restoration completed for order ${order.orderId}`);
    }
    
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n\nPayment ${paymentStatus}: ${notes}` : `Payment ${paymentStatus}: ${notes}`;
    }

    const updatedOrder = await order.save();
    console.log(`SUCCESS: ${isCustomOrder ? 'Custom' : 'Regular'} order bank slip status updated`);

    // Send notification email based on approval/denial
    try {
      if (paymentStatus === 'paid') {
        await sendPaymentApprovedEmail(
          order.customerEmail || order.customerEmail, // field exists in both; fallback for custom order
          order.customerName || order.customerName,
          order.orderId || order._id,
          isCustomOrder ? 'custom' : 'regular',
          isCustomOrder ? (order.finalPrice || order.estimatedPrice) : order.totalAmount,
          order.paymentMethod
        );
      } else if (paymentStatus === 'failed') {
        await sendPaymentDeniedEmail(
          order.customerEmail || order.customerEmail,
          order.customerName || order.customerName,
          order.orderId || order._id,
          isCustomOrder ? 'custom' : 'regular',
          notes
        );
      }
    } catch (emailErr) {
      console.error('Error sending payment status email:', emailErr);
    }

    res.json({
      success: true,
      message: `Payment ${paymentStatus === 'paid' ? 'approved' : 'denied'} successfully`,
      order: updatedOrder
    });

  } catch (error) {
    console.error('ERROR in updating bank slip status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating bank slip status'
    });
  }
});

// Download bank slip image (supports both CustomOrder and Order; GridFS first, disk fallback)
router.get('/:orderId/download-slip', async (req, res) => {
  try {
    console.log('=== DOWNLOAD BANK SLIP REQUEST ===');
    const { orderId } = req.params;
    
    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid order ID provided' });
    }

    // Locate order (custom or regular)
    let order = null;
    let isCustom = false;

    if (orderId.startsWith('WA-')) {
      order = await CustomOrder.findOne({ orderId });
      isCustom = true;
    } else if (orderId.startsWith('WAG-')) {
      order = await Order.findOne({ orderId });
      isCustom = false;
    } else if (mongoose.Types.ObjectId.isValid(orderId)) {
      // Try custom then regular
      order = await CustomOrder.findById(orderId);
      if (order) isCustom = true; else order = await Order.findById(orderId);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Prefer GridFS fields
    const gridId = order.bankSlipId || null;
    const gridFilename = order.bankSlipFilename || '';

    if (gridId) {
      const bucket = getGridFSBucket();
      const _id = new mongoose.Types.ObjectId(gridId);

      const files = await bucket.find({ _id }).toArray();
      if (!files || files.length === 0) {
        return res.status(404).json({ success: false, message: 'Bank slip not found in database' });
      }

      const fileDoc = files[0];
      const ext = path.extname(fileDoc.filename || gridFilename || '').toLowerCase();
      const contentType = fileDoc.contentType || 'application/octet-stream';

      res.setHeader('Content-Disposition', `attachment; filename="bank-slip-${order.orderId || order._id}${ext}"`);
      res.setHeader('Content-Type', contentType);

      const stream = bucket.openDownloadStream(_id);
      stream.on('error', (err) => {
        console.error('GridFS download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming bank slip' });
        }
      });
      return stream.pipe(res);
    }

    // Fallback to disk URL field
    const diskUrl = order.bankSlipUrl;
    if (!diskUrl) {
      return res.status(404).json({ success: false, message: 'No bank slip found for this order' });
    }

    const slipPath = path.join(__dirname, '..', diskUrl);
    if (!fs.existsSync(slipPath)) {
      return res.status(404).json({ success: false, message: 'Bank slip file not found on server' });
    }

    const ext = path.extname(slipPath).toLowerCase();
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

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="bank-slip-${order.orderId || order._id}${ext}"`);

    const fileStream = fs.createReadStream(slipPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('ERROR in downloading bank slip:', error);
    res.status(500).json({ success: false, message: error.message || 'Error downloading bank slip' });
  }
});

module.exports = router;
