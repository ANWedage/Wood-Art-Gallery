const express = require('express');
const router = express.Router();
const SupplierPayment = require('../models/SupplierPayment');

// Get all supplier payments with optional filtering
router.get('/', async (req, res) => {
  try {
    const { supplierName, status, startDate, endDate } = req.query;
    
    const filter = {};
    if (supplierName) filter.supplierName = new RegExp(supplierName, 'i');
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }
    
    const payments = await SupplierPayment.find(filter)
      .populate('purchaseOrderId', 'status description')
      .sort({ transactionDate: -1 })
      .limit(100);
    
    // Convert any existing "pending" or other statuses to "paid"
    const updatedPayments = payments.map(payment => {
      if (payment.status !== 'paid') {
        payment.status = 'paid';
        payment.save(); // Save the update to database
      }
      return payment;
    });
    
    res.json({ 
      success: true, 
      payments: updatedPayments,
      total: updatedPayments.length 
    });
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch supplier payments', error: error.message });
  }
});

// Get payment summary/statistics
router.get('/summary', async (req, res) => {
  try {
    const totalPayments = await SupplierPayment.countDocuments();
    const pendingPayments = await SupplierPayment.countDocuments({ status: 'pending' });
    const paidPayments = await SupplierPayment.countDocuments({ status: 'paid' });
    const overduePayments = await SupplierPayment.countDocuments({ status: 'overdue' });
    
    const totalAmount = await SupplierPayment.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    
    const pendingAmount = await SupplierPayment.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    res.json({
      success: true,
      summary: {
        totalPayments,
        pendingPayments,
        paidPayments,
        overduePayments,
        totalAmount: totalAmount[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment summary', error: error.message });
  }
});

// Create a new supplier payment (called from PO submission)
router.post('/', async (req, res) => {
  try {
    const { 
      supplierName, 
      supplierEmail, 
      item, 
      color, 
      size, 
      thickness, 
      quantity, 
      paidAmount, 
      purchaseOrderId 
    } = req.body;
    
    // Validate required fields
    if (!supplierName || !supplierEmail || !item || !color || !size || !thickness || !quantity || !paidAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: supplierName, supplierEmail, item, color, size, thickness, quantity, paidAmount' 
      });
    }
    
    // Generate unique transaction ID
    const transactionId = SupplierPayment.generateTransactionId();
    
    const supplierPayment = new SupplierPayment({
      supplierName,
      supplierEmail,
      item,
      color,
      size,
      thickness,
      quantity,
      paidAmount,
      transactionId,
      purchaseOrderId,
      transactionDate: new Date()
    });
    
    await supplierPayment.save();
    
    res.json({ 
      success: true, 
      message: 'Supplier payment record created successfully',
      payment: supplierPayment
    });
  } catch (error) {
    console.error('Error creating supplier payment:', error);
    res.status(500).json({ success: false, message: 'Failed to create supplier payment', error: error.message });
  }
});

// Update payment status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const payment = await SupplierPayment.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment status', error: error.message });
  }
});

// Delete a supplier payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await SupplierPayment.findByIdAndDelete(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payment', error: error.message });
  }
});

module.exports = router;
