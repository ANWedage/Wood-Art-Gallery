const express = require('express');
const router = express.Router();
const MaterialRequest = require('../models/MaterialRequest');

// Get all material requests (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { status, staffDesignerId } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (staffDesignerId) filter.staffDesignerId = staffDesignerId;
    
    const requests = await MaterialRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(100); // Limit to recent 100 requests
    
    res.json({ 
      success: true, 
      requests: requests,
      total: requests.length 
    });
  } catch (error) {
    console.error('Error fetching material requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch material requests', 
      error: error.message 
    });
  }
});

// Get a single material request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Material request not found' 
      });
    }
    
    res.json({ 
      success: true, 
      request: request 
    });
  } catch (error) {
    console.error('Error fetching material request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch material request', 
      error: error.message 
    });
  }
});

// Create a new material request
router.post('/', async (req, res) => {
  try {
    const { material, boardSize, thickness, color, quantity, description } = req.body;
    
    // Validate required fields
    if (!material || !boardSize || !thickness || !color || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: material, boardSize, thickness, color, quantity' 
      });
    }
    
    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be greater than 0' 
      });
    }
    
    // Create the material request
    const materialRequest = new MaterialRequest({
      material,
      boardSize,
      thickness,
      color,
      quantity,
      description: description || '',
      // Default staff designer info (later this will come from auth context)
      staffDesignerName: 'Staff Designer',
      staffDesignerEmail: 'staff@gmail.com'
    });
    
    await materialRequest.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Material request created successfully',
      request: materialRequest
    });
  } catch (error) {
    console.error('Error creating material request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create material request', 
      error: error.message 
    });
  }
});

// Update a material request
router.put('/:id', async (req, res) => {
  try {
    const { material, boardSize, thickness, color, quantity, description, status, adminNotes } = req.body;
    
    const request = await MaterialRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Material request not found' 
      });
    }
    
    // Build update object with provided fields
    const updateFields = {};
    if (material) updateFields.material = material;
    if (boardSize) updateFields.boardSize = boardSize;
    if (thickness) updateFields.thickness = thickness;
    if (color) updateFields.color = color;
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Quantity must be greater than 0' 
        });
      }
      updateFields.quantity = quantity;
    }
    if (description !== undefined) updateFields.description = description;
    if (status) {
      updateFields.status = status;
      if (status === 'fulfilled') {
        updateFields.fulfilledAt = new Date();
        updateFields.fulfilledBy = 'Admin'; // Later this will come from auth context
      }
    }
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
    
    const updatedRequest = await MaterialRequest.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Material request updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error updating material request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update material request', 
      error: error.message 
    });
  }
});

// Delete a material request
router.delete('/:id', async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Material request not found' 
      });
    }
    
    await MaterialRequest.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Material request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete material request', 
      error: error.message 
    });
  }
});

// Bulk update status (for admin use)
router.post('/bulk-update', async (req, res) => {
  try {
    const { requestIds, status, adminNotes } = req.body;
    
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request IDs array is required' 
      });
    }
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }
    
    const updateFields = { status };
    if (adminNotes) updateFields.adminNotes = adminNotes;
    if (status === 'fulfilled') {
      updateFields.fulfilledAt = new Date();
      updateFields.fulfilledBy = 'Admin'; // Later this will come from auth context
    }
    
    const result = await MaterialRequest.updateMany(
      { _id: { $in: requestIds } },
      updateFields
    );
    
    res.json({ 
      success: true, 
      message: `Updated ${result.modifiedCount} material requests`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating material requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to bulk update material requests', 
      error: error.message 
    });
  }
});

// Get material request statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalRequests = await MaterialRequest.countDocuments();
    const pendingRequests = await MaterialRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await MaterialRequest.countDocuments({ status: 'approved' });
    const fulfilledRequests = await MaterialRequest.countDocuments({ status: 'fulfilled' });
    const rejectedRequests = await MaterialRequest.countDocuments({ status: 'rejected' });
    
    res.json({
      success: true,
      stats: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        fulfilled: fulfilledRequests,
        rejected: rejectedRequests
      }
    });
  } catch (error) {
    console.error('Error fetching material request stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch material request statistics', 
      error: error.message 
    });
  }
});

module.exports = router;
