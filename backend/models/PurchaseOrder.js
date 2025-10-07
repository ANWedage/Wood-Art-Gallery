const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poCode: { type: String, unique: true, index: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  boardSize: { type: String, required: true },
  thickness: { type: String, required: true },
  color: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending','approved','ordered','received','cancelled'], default: 'pending' },
  receivedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate human friendly PO code e.g. PO-20250818-AB12
purchaseOrderSchema.pre('save', async function(next){
  this.updatedAt = new Date();
  if(this.poCode) return next();
  const Model = mongoose.model('PurchaseOrder');
  const gen = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    const rand = Math.random().toString(36).substr(2,4).toUpperCase();
    return `PO-${y}${m}${day}-${rand}`;
  };
  for(let i=0;i<5;i++){ // attempt 5 times
    const code = gen();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.findOne({ poCode: code }).lean();
    if(!exists){ this.poCode = code; return next(); }
  }
  return next(new Error('Could not generate unique purchase order code'));
});

purchaseOrderSchema.pre('findOneAndUpdate', function(next){
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
