const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema({
  supplierName: { type: String, required: true },
  supplierEmail: { type: String, required: true },
  item: { type: String, required: true }, // Material type (MDF, HDF, etc.)
  color: { type: String, required: true },
  size: { type: String, required: true }, // Board size
  thickness: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  paidAmount: { type: Number, required: true, min: 0 }, // Total amount from PO
  transactionDate: { type: Date, default: Date.now },
  transactionId: { type: String, required: true, unique: true },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  status: { type: String, enum: ['paid'], default: 'paid' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate readable transaction ID
supplierPaymentSchema.statics.generateTransactionId = function() {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 digit random
  return `TXN-${timestamp}-${random}`;
};

supplierPaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);
