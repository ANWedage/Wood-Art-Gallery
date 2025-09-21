const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const User = require('../models/User');
const Design = require('../models/Design');
const { sendDesignDeletionEmail } = require('../utils/emailService');
const stockEmitter = require('../stockEvents');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to get GridFS bucket
function getGridFSBucket() {
  const db = mongoose.connection.db;
  if (!db) return null;
  return new GridFSBucket(db, { bucketName: 'images' });
}

// Route to serve images from GridFS
router.get('/image/:id', async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('file', (file) => {
      res.set('Content-Type', file.contentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31557600'); // Cache for 1 year
    });

    downloadStream.on('error', () => {
      res.status(404).json({ success: false, message: 'Image not found' });
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid image ID' });
  }
});

// Upload design route
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log('=== DESIGN UPLOAD REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    // Check if image was uploaded
    if (!req.file) {
      console.log('ERROR: No image file received');
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    // Extract form data
    const { 
      email, 
      itemName, 
      description, 
      price, 
      quantity, 
      boardColor, 
      boardThickness, 
      material, 
      boardSize 
    } = req.body;

    console.log('Looking for designer with email:', email);

    // Find the designer user
    const designer = await User.findOne({ email });
    if (!designer) {
      console.log('ERROR: Designer not found for email:', email);
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }

    console.log('Designer found:', designer._id);

    // Save image to GridFS for cross-PC access
    let imageId = null;
    let imageUrl = `/uploads/${req.file.filename}`; // fallback
    
    try {
      const bucket = getGridFSBucket();
      if (bucket) {
        const originalName = req.file.originalname || 'design-image';
        const uploadStream = bucket.openUploadStream(originalName, {
          contentType: req.file.mimetype
        });
        
        const fileBuffer = fs.readFileSync(req.file.path);
        
        const gridFile = await new Promise((resolve, reject) => {
          uploadStream.end(fileBuffer, (error, file) => {
            if (error) return reject(error);
            resolve(file);
          });
        });
        
        imageId = gridFile._id;
        imageUrl = `/api/design/image/${imageId.toString()}`;
        
        // Clean up temporary disk file
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.log('Warning: Could not delete temp file:', e.message);
        }
        
        console.log('Image saved to GridFS with ID:', imageId);
      }
    } catch (error) {
      console.warn('GridFS upload failed, using disk storage:', error.message);
    }

    // Create new design document
    const designData = {
      designerId: designer._id,
      itemName,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      boardColor,
      boardThickness,
      material,
      boardSize,
      imageUrl,
      imageId
    };

    console.log('Creating design with data:', designData);

    const design = new Design(designData);
    const savedDesign = await design.save();

    console.log('SUCCESS: Design saved with ID:', savedDesign._id);

    res.json({
      success: true,
      message: 'Design uploaded and saved successfully',
      designId: savedDesign._id,
      itemCode: savedDesign.itemCode
    });

  } catch (error) {
    console.error('ERROR in design upload:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading design'
    });
  }
});

// Get all designs by designer
router.get('/my-uploads', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Designer email is required' 
      });
    }

    console.log('Fetching designs for designer:', email);

    // Find the designer
    const designer = await User.findOne({ email });
    if (!designer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }

    // Find all designs by this designer
    const designs = await Design.find({ designerId: designer._id }).sort({ createdAt: -1 });
    
    console.log(`Found ${designs.length} designs for designer ${email}`);

    res.json({ 
      success: true, 
      designs,
      count: designs.length
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching designs' 
    });
  }
});

// Update design route
router.put('/update/:designId', upload.single('image'), async (req, res) => {
  try {
    const { designId } = req.params;
    const { email, itemName, description, price, quantity, boardColor, boardThickness, material, boardSize } = req.body;

    console.log('=== DESIGN UPDATE REQUEST ===');
    console.log('Design ID:', designId);
    console.log('Request body:', req.body);
    console.log('New file:', req.file);

    // Find the designer
    const designer = await User.findOne({ email });
    if (!designer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }

    // Find the design and verify ownership
    const existingDesign = await Design.findById(designId);
    if (!existingDesign) {
      return res.status(404).json({ 
        success: false, 
        message: 'Design not found' 
      });
    }

    if (existingDesign.designerId.toString() !== designer._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to edit this design' 
      });
    }

    // Update design data
    const updateData = {
      itemName,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      boardColor,
      boardThickness,
      material,
      boardSize
    };

    // If new image is uploaded, save to GridFS and update imageUrl
    if (req.file) {
      let newImageId = null;
      let newImageUrl = `/uploads/${req.file.filename}`; // fallback
      
      try {
        const bucket = getGridFSBucket();
        if (bucket) {
          // Delete old GridFS image if exists
          if (existingDesign.imageId) {
            try {
              await bucket.delete(existingDesign.imageId);
            } catch (e) {
              console.log('Could not delete old GridFS image:', e.message);
            }
          }
          
          // Upload new image to GridFS
          const originalName = req.file.originalname || 'design-image';
          const uploadStream = bucket.openUploadStream(originalName, {
            contentType: req.file.mimetype
          });
          
          const fileBuffer = fs.readFileSync(req.file.path);
          
          const gridFile = await new Promise((resolve, reject) => {
            uploadStream.end(fileBuffer, (error, file) => {
              if (error) return reject(error);
              resolve(file);
            });
          });
          
          newImageId = gridFile._id;
          newImageUrl = `/api/design/image/${newImageId.toString()}`;
          
          // Clean up temporary disk file
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            console.log('Warning: Could not delete temp file:', e.message);
          }
        }
      } catch (error) {
        console.warn('GridFS upload failed during update, using disk storage:', error.message);
      }
      
      updateData.imageUrl = newImageUrl;
      updateData.imageId = newImageId;
    }

    const updatedDesign = await Design.findByIdAndUpdate(designId, updateData, { new: true });

    // Emit design update event for real-time updates
    stockEmitter.emit('designUpdated', {
      designId: updatedDesign._id,
      quantity: updatedDesign.quantity,
      price: updatedDesign.price,
      itemName: updatedDesign.itemName,
      description: updatedDesign.description,
      material: updatedDesign.material,
      boardSize: updatedDesign.boardSize,
      boardColor: updatedDesign.boardColor,
      boardThickness: updatedDesign.boardThickness
    });

    console.log('SUCCESS: Design updated');

    res.json({
      success: true,
      message: 'Design updated successfully',
      design: updatedDesign
    });

  } catch (error) {
    console.error('ERROR in design update:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating design'
    });
  }
});

// Get all designs from all designers (for customer marketplace)
router.get('/all-designs', async (req, res) => {
  try {
    console.log('Fetching all designs for customer marketplace');

    // Find all designs, populate designer information, and sort by creation date
    const designs = await Design.find({})
      .populate('designerId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${designs.length} total designs`);

    res.json({ 
      success: true, 
      designs,
      count: designs.length
    });
  } catch (error) {
    console.error('Error fetching all designs:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching designs' 
    });
  }
});

// Delete design route
router.delete('/delete/:designId', async (req, res) => {
  try {
    const { designId } = req.params;
    const { email } = req.query;

    console.log('=== DESIGN DELETE REQUEST ===');
    console.log('Design ID:', designId);
    console.log('Designer Email:', email);

    // Find the designer user
    const designer = await User.findOne({ email });
    if (!designer) {
      console.log('ERROR: Designer not found for email:', email);
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }

    // Find the design and verify ownership
    const design = await Design.findById(designId);
    if (!design) {
      console.log('ERROR: Design not found with ID:', designId);
      return res.status(404).json({ 
        success: false, 
        message: 'Design not found' 
      });
    }

    // Check if the designer owns this design
    if (design.designerId.toString() !== designer._id.toString()) {
      console.log('ERROR: User does not own this design');
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to delete this design' 
      });
    }

    // Delete image from GridFS or filesystem
    if (design.imageId) {
      // Delete from GridFS
      try {
        const bucket = getGridFSBucket();
        if (bucket) {
          await bucket.delete(design.imageId);
          console.log('Image deleted from GridFS:', design.imageId);
        }
      } catch (error) {
        console.log('Warning: Could not delete GridFS image:', error.message);
      }
    } else if (design.imageUrl && design.imageUrl.startsWith('/uploads/')) {
      // Delete from filesystem (legacy)
      const imagePath = path.join(__dirname, '..', design.imageUrl);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('Image file deleted:', imagePath);
        } catch (fileError) {
          console.log('Warning: Could not delete image file:', fileError.message);
        }
      }
    }

    // Delete the design from database
    await Design.findByIdAndDelete(designId);
    
    console.log('SUCCESS: Design deleted');

    res.json({
      success: true,
      message: 'Design deleted successfully'
    });

  } catch (error) {
    console.error('ERROR in design deletion:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting design'
    });
  }
});

// Admin (inventory) delete design route - bypasses designer ownership (ensure protected in real auth)
router.delete('/admin-delete/:designId', async (req, res) => {
  try {
    const { designId } = req.params;
    console.log('=== ADMIN DESIGN DELETE REQUEST ===');
    console.log('Design ID:', designId);

    const design = await Design.findById(designId).populate('designerId','name email');
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    const designerEmail = design.designerId?.email;
    const designerName = design.designerId?.name;

    // Remove image from GridFS or filesystem
    if (design.imageId) {
      try {
        const bucket = getGridFSBucket();
        if (bucket) {
          await bucket.delete(design.imageId);
        }
      } catch (e) { 
        console.log('GridFS image delete warning:', e.message); 
      }
    } else if (design.imageUrl && design.imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', design.imageUrl);
      if (fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) { console.log('Image delete warning:', e.message); }
      }
    }

    const itemName = design.itemName;
    const itemCode = design.itemCode;

    await Design.findByIdAndDelete(designId);
    // Fire and forget email (do not block response)
    sendDesignDeletionEmail(designerEmail, designerName, itemName, itemCode, 'Violation of marketplace terms and conditions').catch(()=>{});
    res.json({ success: true, message: 'Design removed from marketplace and designer notified' });
  } catch (error) {
    console.error('ERROR in admin design deletion:', error);
    res.status(500).json({ success: false, message: error.message || 'Error deleting design' });
  }
});

module.exports = router;
