const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    required: true
  },
  itemName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  availableQuantity: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  designerName: { type: String, required: true },
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  material: { type: String, required: true },
  boardSize: { type: String, required: true },
  boardColor: { type: String, required: true },
  boardThickness: { type: String, required: true },
  description: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
