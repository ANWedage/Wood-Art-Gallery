const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  designerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  itemName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  boardColor: { 
    type: String, 
    required: true 
  },
  boardThickness: { 
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
  imageUrl: { 
    type: String, 
    required: true 
  },
  // GridFS file ID for database-stored images (cross-PC compatible)
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  // New unique human-friendly item code
  itemCode: {
    type: String,
    unique: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save hook to generate a unique itemCode if not provided
// Format: ITM-<last4timestamp>-<6random>
// Attempts up to 5 times to avoid rare collisions
// Existing documents without itemCode will keep using Mongo _id as fallback on UI
designSchema.pre('save', async function(next) {
  if (this.itemCode) return next();
  const Design = mongoose.model('Design');
  const generateCode = () => {
    const ts = Date.now().toString().slice(-4);
    const rand = Math.random().toString(36).substring(2,8).toUpperCase();
    return `ITM-${ts}-${rand}`;
  };
  let tries = 0;
  while (tries < 5) {
    const code = generateCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Design.findOne({ itemCode: code }).lean();
    if (!exists) {
      this.itemCode = code;
      return next();
    }
    tries++;
  }
  return next(new Error('Could not generate unique item code'));
});

module.exports = mongoose.model('Design', designSchema);
