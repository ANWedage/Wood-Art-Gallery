const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  material: { type: String, required: true },
  boardSize: { type: String, required: true },
  thickness: { type: String, required: true },
  color: { type: String, required: true },
  price: { type: Number, default: 0, min: 0 }, // Price in Rs.
  availableQuantity: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 100, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create compound index to ensure unique combinations
stockSchema.index({ material: 1, boardSize: 1, thickness: 1, color: 1 }, { unique: true });

stockSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Static method to initialize all stock combinations
stockSchema.statics.initializeStock = async function() {
  const materials = ['MDF', 'HDF', 'Mahogany', 'Solid Wood', 'Plywood'];
  const boardSizes = ['6 x 4 inches', '8 x 6 inches', '12 x 8 inches'];
  const thicknesses = ['3mm-4mm', '5mm-6mm', '8mm-10mm'];
  const colors = ['brown', 'blue', 'tan'];

  const combinations = [];
  
  for (const material of materials) {
    for (const boardSize of boardSizes) {
      for (const thickness of thicknesses) {
        for (const color of colors) {
          combinations.push({
            material,
            boardSize,
            thickness,
            color,
            price: Math.floor(Math.random() * (200 - 100 + 1)) + 100, // Random price between 100-200
            availableQuantity: 0,
            reorderLevel: 100
          });
        }
      }
    }
  }

  // Use upsert to avoid duplicates
  for (const combo of combinations) {
    await this.findOneAndUpdate(
      { 
        material: combo.material,
        boardSize: combo.boardSize,
        thickness: combo.thickness,
        color: combo.color
      },
      combo,
      { upsert: true, new: true }
    );
  }

  console.log(`Initialized ${combinations.length} stock combinations`);
};

// Static method to update stock when PO is received
stockSchema.statics.updateFromPurchaseOrder = async function(purchaseOrder) {
  // Extract itemName to get material type
  const material = purchaseOrder.itemName || 'MDF'; // Default to MDF if not specified
  
  const stockItem = await this.findOneAndUpdate(
    {
      material: material,
      boardSize: purchaseOrder.boardSize,
      thickness: purchaseOrder.thickness,
      color: purchaseOrder.color
    },
    {
      $inc: { availableQuantity: purchaseOrder.quantity }
    },
    { new: true, upsert: true }
  );

  return stockItem;
};

// Static method to update all prices with random values between 100-200
stockSchema.statics.updateAllPrices = async function() {
  const stockItems = await this.find({});
  let updatedCount = 0;
  
  for (const item of stockItems) {
    const randomPrice = Math.floor(Math.random() * (200 - 100 + 1)) + 100;
    await this.findByIdAndUpdate(item._id, { 
      price: randomPrice,
      updatedAt: new Date() 
    });
    updatedCount++;
  }
  
  console.log(`Updated prices for ${updatedCount} stock items`);
  return updatedCount;
};

module.exports = mongoose.model('Stock', stockSchema);
