const mongoose = require('mongoose');

const designerPaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  orderMongoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // unique line item ID
  orderItemDesignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', required: true },
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  designerName: { type: String, required: true },
  designerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  itemSubtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  commission: { type: Number, required: true },
  designerAmount: { type: Number, required: true },
  releasedBy: { type: String }, // email / name of financial user
  status: { type: String, enum: ['released'], default: 'released' },
  releasedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent duplicate payment for same order line item (not just design)
designerPaymentSchema.index({ orderId: 1, orderItemId: 1 }, { unique: true });

// Remove any legacy indexes that might conflict
designerPaymentSchema.pre('save', function(next) {
  // Ensure orderItemId is present for new records
  if (!this.orderItemId) {
    return next(new Error('orderItemId is required'));
  }
  next();
});

module.exports = mongoose.model('DesignerPayment', designerPaymentSchema);
