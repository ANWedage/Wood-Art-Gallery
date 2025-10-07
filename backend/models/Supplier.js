const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

supplierSchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

supplierSchema.pre('findOneAndUpdate', function(next){
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Supplier', supplierSchema);
