const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
  // Staff designer information (will be populated from auth context later)
  staffDesignerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // For now, we'll use a default staff designer
  },
  staffDesignerName: {
    type: String,
    default: 'Staff Designer'
  },
  staffDesignerEmail: {
    type: String,
    default: 'staff@gmail.com'
  },
  
  // Material specifications (same as stock release form)
  material: {
    type: String,
    required: true,
    enum: ['MDF', 'HDF', 'Mahogany', 'Solid Wood', 'Plywood']
  },
  boardSize: {
    type: String,
    required: true,
    enum: ['6 x 4 inches', '8 x 6 inches', '12 x 8 inches']
  },
  thickness: {
    type: String,
    required: true,
    enum: ['3mm-4mm', '5mm-6mm', '8mm-10mm']
  },
  color: {
    type: String,
    required: true,
    enum: ['brown', 'blue', 'tan']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Request status
  status: {
    type: String,
    enum: ['pending', 'approved', 'fulfilled', 'rejected'],
    default: 'pending'
  },
  
  // Admin notes (for approval/rejection)
  adminNotes: {
    type: String,
    trim: true
  },
  
  // Fulfillment details
  fulfilledAt: {
    type: Date
  },
  fulfilledBy: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
materialRequestSchema.index({ staffDesignerId: 1 });
materialRequestSchema.index({ status: 1 });
materialRequestSchema.index({ createdAt: -1 });
materialRequestSchema.index({ material: 1, boardSize: 1, thickness: 1, color: 1 });

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
