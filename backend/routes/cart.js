const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Design = require('../models/Design');
const User = require('../models/User');

// Get user's cart
router.get('/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let cart = await Cart.findOne({ userId: user._id }).populate({
      path: 'items.designId',
      select: 'quantity price itemName imageUrl material boardSize boardColor boardThickness description designerId',
      populate: {
        path: 'designerId',
        select: 'name email'
      }
    });
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new Cart({ userId: user._id, items: [] });
      await cart.save();
    }
    
    // Update available quantities from current design data
    for (let item of cart.items) {
      if (item.designId) {
        item.availableQuantity = item.designId.quantity;
        // Update price if it changed
        if (item.designId.price !== item.price) {
          item.price = item.designId.price;
        }
      } else {
        console.warn('Cart item missing designId:', item);
      }
    }
    
    // Filter out items with null or missing designId (invalid items)
    cart.items = cart.items.filter(item => item.designId != null);
    
    await cart.save();
    
    console.log(`Cart loaded for user ${userEmail}: ${cart.items.length} items`);
    
    res.json({
      success: true,
      cart: cart.items
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
});

// Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { userEmail, designId } = req.body;
    
    if (!userEmail || !designId) {
      return res.status(400).json({
        success: false,
        message: 'User email and Design ID are required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get design details
    const design = await Design.findById(designId).populate('designerId', 'name email');
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }
    
    // Check stock availability (always adding 1 item)
    if (design.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Item is out of stock'
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      cart = new Cart({ userId: user._id, items: [] });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.designId.toString() === designId
    );
    
    if (existingItemIndex >= 0) {
      // Item already exists in cart
      return res.status(400).json({
        success: false,
        message: 'Item is already in cart'
      });
    } else {
      // Add new item to cart with quantity 1
      const cartItem = {
        designId: design._id,
        itemName: design.itemName,
        price: design.price,
        quantity: 1,
        availableQuantity: design.quantity,
        imageUrl: design.imageUrl,
        designerName: design.designerId?.name || design.designerId?.email || 'Unknown Designer',
        designerId: design.designerId?._id,
        material: design.material,
        boardSize: design.boardSize,
        boardColor: design.boardColor,
        boardThickness: design.boardThickness,
        description: design.description
      };
      
      cart.items.push(cartItem);
    }
    
    await cart.save();
    
    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: cart.items,
      cartLength: cart.items.length
    });
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
});

// Remove item from cart
router.delete('/remove', async (req, res) => {
  try {
    const { userEmail, designId } = req.body;
    
    if (!userEmail || !designId) {
      return res.status(400).json({
        success: false,
        message: 'User email and Design ID are required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = cart.items.filter(item => 
      item.designId.toString() !== designId
    );
    
    await cart.save();
    
    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: cart.items
    });
    
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
});

// Clear entire cart
router.delete('/clear/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: []
    });
    
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
});

// Update item quantity in cart
router.put('/update', async (req, res) => {
  try {
    const { userEmail, itemId, quantity } = req.body;
    
    if (!userEmail || !itemId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'User email, item ID, and quantity are required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find cart
    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find the item in cart
    const cartItemIndex = cart.items.findIndex(item => item.designId.toString() === itemId);
    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check design availability
    const design = await Design.findById(itemId);
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    if (quantity > design.quantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot set quantity to ${quantity}. Only ${design.quantity} available.`
      });
    }

    // Update quantity
    cart.items[cartItemIndex].quantity = quantity;
    await cart.save();

    res.json({
      success: true,
      message: 'Cart item quantity updated successfully',
      cart: cart
    });

  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart item quantity',
      error: error.message
    });
  }
});

module.exports = router;
