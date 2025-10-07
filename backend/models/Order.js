const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    required: true
  },
  itemName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, required: true },
  designerName: { type: String, required: true },
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  material: { type: String, required: true },
  boardSize: { type: String, required: true },
  boardColor: { type: String, required: true },
  boardThickness: { type: String, required: true },
  description: { type: String, required: true },
  subtotal: { type: Number, required: true } // price * quantity
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
    // Remove required: true to let pre-save hook generate it
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  customerAddress: { type: String },
  
  items: [orderItemSchema],
  
  totalAmount: { type: Number, required: true },
  deliveryFee: { type: Number, default: 250 }, // Standard delivery fee
  
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'bank_transfer'],
    required: true
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  
  // Backward compatibility: disk-based storage
  bankSlipUrl: { type: String }, // For bank transfer payments
  // New: GridFS-based storage
  bankSlipId: { type: mongoose.Schema.Types.ObjectId, default: null },
  bankSlipFilename: { type: String, default: null },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  deliveryStatus: {
    type: String,
    enum: ['not_assigned', 'assigned', 'picked_up', 'in_transit', 'delivered'],
    default: 'not_assigned'
  },
  
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  designerNotified: { type: Boolean, default: false },
  stockDeducted: { type: Boolean, default: false },
  
  orderDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  
  notes: { type: String },
  
  // Track cash collection by delivery partner for COD orders
  cashCollected: { type: Boolean, default: false },
  cashCollectedAt: { type: Date },
  cashCollectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Delivery payment release tracking
  paymentReleased: { type: Boolean, default: false },
  deliveryTransactionId: { type: String },
  releaseDate: { type: Date }
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    this.orderId = `WAG-${year}${month}${day}-${timestamp}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
