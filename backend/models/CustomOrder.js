const mongoose = require('mongoose');

const customOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    sparse: true  // Allow null/undefined values to be non-unique
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String
  },
  customerAddress: {
    type: String
  },
  boardColor: {
    type: String,
    required: true
  },
  material: {
    type: String,
    required: true
  },
  boardSize: {
    type: String,
    required: true
  },
  boardThickness: {
    type: String,
    required: true
  },
  // Backward compatibility: path-based storage for older records
  referenceImageUrl: {
    type: String
  },
  // New: GridFS-based storage
  referenceImageId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  referenceImageFilename: {
    type: String,
    default: null
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['not_assigned', 'ready_for_delivery', 'picked_up', 'delivered'],
    default: 'not_assigned'
  },
  staffDesignerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedPrice: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 250
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  cashCollected: {
    type: Boolean,
    default: false
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  // Delivery payment release tracking
  paymentReleased: {
    type: Boolean,
    default: false
  },
  deliveryTransactionId: {
    type: String
  },
  releaseDate: {
    type: Date
  },
  notes: {
    type: String
  },
  // Backward compatibility: path-based storage for older records
  bankSlipUrl: {
    type: String,
    default: null
  },
  // New: GridFS-based storage for bank slips
  bankSlipId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  bankSlipFilename: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
customOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate readable order ID before saving
customOrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderId) {
    // Generate readable order ID: WA-YYYY-MMDD-XXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    this.orderId = `WA-${year}-${month}${day}-${random}`;
  }
  next();
});

module.exports = mongoose.model('CustomOrder', customOrderSchema);
