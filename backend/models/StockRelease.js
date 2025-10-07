const mongoose = require('mongoose');

const stockReleaseSchema = new mongoose.Schema({
  designerName: {
    type: String,
    required: true,
    trim: true
  },
  designerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
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
  releaseDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for efficient queries
stockReleaseSchema.index({ designerEmail: 1 });
stockReleaseSchema.index({ material: 1, boardSize: 1, thickness: 1, color: 1 });
stockReleaseSchema.index({ releaseDate: -1 });

module.exports = mongoose.model('StockRelease', stockReleaseSchema);
