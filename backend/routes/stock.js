const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const StockRelease = require('../models/StockRelease');

// Initialize all stock combinations (run once to set up the 135 combinations)
router.post('/initialize', async (req, res) => {
  try {
    await Stock.initializeStock();
    res.json({ success: true, message: 'Stock combinations initialized successfully' });
  } catch (error) {
    console.error('Error initializing stock:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize stock', error: error.message });
  }
});

// Clear all existing stock and reinitialize with correct materials
router.post('/reset', async (req, res) => {
  try {
    // Delete all existing stock records
    await Stock.deleteMany({});
    console.log('All existing stock records deleted');
    
    // Reinitialize with correct materials
    await Stock.initializeStock();
    
    res.json({ success: true, message: 'Stock cleared and reinitialized successfully with correct materials' });
  } catch (error) {
    console.error('Error resetting stock:', error);
    res.status(500).json({ success: false, message: 'Failed to reset stock', error: error.message });
  }
});

// Get all stock items with optional filtering
router.get('/', async (req, res) => {
  try {
    const { material, boardSize, thickness, color, lowStock } = req.query;
    
    const filter = {};
    if (material) filter.material = material;
    if (boardSize) filter.boardSize = boardSize;
    if (thickness) filter.thickness = thickness;
    if (color) filter.color = color;
    
    let query = Stock.find(filter).sort({ material: 1, boardSize: 1, thickness: 1, color: 1 });
    
    // Filter for low stock items
    if (lowStock === 'true') {
      query = query.where('availableQuantity').lte(100); // You can adjust this threshold
    }
    
    const stockItems = await query;
    
    res.json({ 
      success: true, 
      stock: stockItems,
      totalCombinations: stockItems.length 
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock', error: error.message });
  }
});

// Get stock summary/statistics
router.get('/summary', async (req, res) => {
  try {
    const totalItems = await Stock.countDocuments();
    const lowStockItems = await Stock.countDocuments({ 
      $expr: { $lte: ['$availableQuantity', '$reorderLevel'] } 
    });
    const outOfStockItems = await Stock.countDocuments({ availableQuantity: 0 });
    const totalQuantity = await Stock.aggregate([
      { $group: { _id: null, total: { $sum: '$availableQuantity' } } }
    ]);

    res.json({
      success: true,
      summary: {
        totalCombinations: totalItems,
        lowStockItems,
        outOfStockItems,
        totalQuantity: totalQuantity[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock summary', error: error.message });
  }
});

// Update stock quantity manually (with minimum validation)
router.put('/:id', async (req, res) => {
  try {
    const { availableQuantity, reorderLevel } = req.body;
    
    // Validate minimum quantity constraint
    if (availableQuantity !== undefined && availableQuantity < 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Available quantity cannot be less than 50' 
      });
    }
    
    const updateFields = {};
    if (availableQuantity !== undefined) updateFields.availableQuantity = availableQuantity;
    if (reorderLevel !== undefined) updateFields.reorderLevel = reorderLevel;
    
    const stockItem = await Stock.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    if (!stockItem) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }
    
    res.json({ success: true, stock: stockItem });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock', error: error.message });
  }
});

// Create a new stock release
router.post('/release', async (req, res) => {
  try {
    const { designerName, designerEmail, material, boardSize, thickness, color, quantity, notes } = req.body;
    
    // Validate required fields
    if (!designerName || !designerEmail || !material || !boardSize || !thickness || !color || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: designerName, designerEmail, material, boardSize, thickness, color, quantity' 
      });
    }
    
    // Find the stock item
    const stockItem = await Stock.findOne({
      material,
      boardSize,
      thickness,
      color
    });
    
    if (!stockItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock combination not found' 
      });
    }
    
    // Check if there's enough stock
    if (stockItem.availableQuantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Available: ${stockItem.availableQuantity}, Requested: ${quantity}` 
      });
    }
    
    // Check if release would bring stock below minimum (50)
    const newQuantity = stockItem.availableQuantity - quantity;
    if (newQuantity < 50) {
      return res.status(400).json({ 
        success: false, 
        message: `Stock cannot go below 50 units. Current: ${stockItem.availableQuantity}, Requested: ${quantity}, Would result in: ${newQuantity}` 
      });
    }
    
    // Create the stock release record
    const stockRelease = new StockRelease({
      designerName,
      designerEmail,
      material,
      boardSize,
      thickness,
      color,
      quantity,
      notes
    });
    
    await stockRelease.save();
    
    // Update the stock quantity
    stockItem.availableQuantity -= quantity;
    await stockItem.save();
    
    res.json({ 
      success: true, 
      message: 'Stock released successfully',
      stockRelease,
      updatedStock: stockItem
    });
  } catch (error) {
    console.error('Error creating stock release:', error);
    res.status(500).json({ success: false, message: 'Failed to create stock release', error: error.message });
  }
});

// Get low stock count for notification badge
router.get('/low-stock-count', async (req, res) => {
  try {
    const lowStockCount = await Stock.countDocuments({ 
      $expr: { $lte: ['$availableQuantity', '$reorderLevel'] } 
    });

    res.json({
      success: true,
      count: lowStockCount
    });
  } catch (error) {
    console.error('Error fetching low stock count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch low stock count', error: error.message });
  }
});

// Get all stock releases with optional filtering
router.get('/releases', async (req, res) => {
  try {
    const { designerEmail, material, startDate, endDate } = req.query;
    
    const filter = {};
    if (designerEmail) filter.designerEmail = designerEmail;
    if (material) filter.material = material;
    if (startDate || endDate) {
      filter.releaseDate = {};
      if (startDate) filter.releaseDate.$gte = new Date(startDate);
      if (endDate) filter.releaseDate.$lte = new Date(endDate);
    }
    
    const stockReleases = await StockRelease.find(filter)
      .sort({ releaseDate: -1 })
      .limit(100); // Limit to recent 100 releases
    
    res.json({ 
      success: true, 
      releases: stockReleases,
      total: stockReleases.length 
    });
  } catch (error) {
    console.error('Error fetching stock releases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock releases', error: error.message });
  }
});

// Update all stock prices with random values between Rs. 100-200
router.post('/update-prices', async (req, res) => {
  try {
    const updatedCount = await Stock.updateAllPrices();
    res.json({ 
      success: true, 
      message: `Successfully updated ${updatedCount} stock items with random prices between Rs. 100-200`,
      updatedCount
    });
  } catch (error) {
    console.error('Error updating stock prices:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock prices', error: error.message });
  }
});

// Get stock by specific combination (for PO form price calculation)
router.get('/combination', async (req, res) => {
  try {
    const { material, boardSize, thickness, color } = req.query;
    
    if (!material || !boardSize || !thickness || !color) {
      return res.status(400).json({ 
        success: false, 
        message: 'All parameters required: material, boardSize, thickness, color' 
      });
    }
    
    const stockItem = await Stock.findOne({
      material,
      boardSize,
      thickness,
      color
    });
    
    if (!stockItem) {
      return res.status(404).json({ success: false, message: 'Stock combination not found' });
    }
    
    res.json({ success: true, stock: stockItem });
  } catch (error) {
    console.error('Error fetching stock combination:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock combination', error: error.message });
  }
});

module.exports = router;
