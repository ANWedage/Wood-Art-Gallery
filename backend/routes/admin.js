const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const CustomOrder = require('../models/CustomOrder');
const Design = require('../models/Design');

// GET all customers with order counts
router.get('/customers', async (req, res) => {
  try {
    // Get all customers (users with role 'customer' only, explicitly excluding designers)
    const customers = await User.find({ 
      role: { $eq: 'customer' }
    }).select('name email phone address');

    // Enhance customers with order counts
    const customersWithCounts = await Promise.all(
      customers.map(async (customer) => {
      
        const marketplaceOrdersCount = await Order.countDocuments({
          customerId: customer._id,
          status: { $ne: 'cancelled' }
        });

        // Count completed custom orders
        const customOrdersCount = await CustomOrder.countDocuments({
          customerEmail: customer.email,
          status: 'completed'
        });

        return {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          totalMarketplaceOrders: marketplaceOrdersCount,
          totalCustomOrders: customOrdersCount
        };
      })
    );

    res.json({
      success: true,
      customers: customersWithCounts,
      count: customersWithCounts.length
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: err.message
    });
  }
});

// DELETE customer
router.delete('/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    // Check if customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has role 'customer'
    if (customer.role !== 'customer') {
      return res.status(400).json({
        success: false,
        message: 'Only customers can be deleted through this endpoint'
      });
    }

    // Check for existing orders before deletion
    const marketplaceOrders = await Order.countDocuments({ customerId: customerId });
    const customOrders = await CustomOrder.countDocuments({ customerEmail: customer.email });

    if (marketplaceOrders > 0 || customOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing orders. Please handle orders first.'
      });
    }

    // Delete the customer
    await User.findByIdAndDelete(customerId);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: err.message
    });
  }
});

// GET all designers with upload counts
router.get('/designers', async (req, res) => {
  try {
    // Get all designers (users with role 'designer')
    const designers = await User.find({ role: 'designer' }).select('name email phone address');

    // Enhance designers with upload counts
    const designersWithCounts = await Promise.all(
      designers.map(async (designer) => {
        // Count total uploads (designs) by this designer
        const uploadsCount = await Design.countDocuments({
          designerId: designer._id
        });

        return {
          _id: designer._id,
          name: designer.name,
          email: designer.email,
          phone: designer.phone,
          address: designer.address,
          totalUploads: uploadsCount
        };
      })
    );

    res.json({
      success: true,
      designers: designersWithCounts,
      count: designersWithCounts.length
    });
  } catch (err) {
    console.error('Error fetching designers:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch designers',
      error: err.message
    });
  }
});

// DELETE designer
router.delete('/designers/:designerId', async (req, res) => {
  try {
    const { designerId } = req.params;

    // Check if designer exists
    const designer = await User.findById(designerId);
    if (!designer) {
      return res.status(404).json({
        success: false,
        message: 'Designer not found'
      });
    }

    // Check if user has role 'designer'
    if (designer.role !== 'designer') {
      return res.status(400).json({
        success: false,
        message: 'Only designers can be deleted through this endpoint'
      });
    }

    // Check for existing designs before deletion
    const designsCount = await Design.countDocuments({ designerId: designerId });

    if (designsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete designer with existing designs. Please handle designs first.'
      });
    }

    // Delete the designer
    await User.findByIdAndDelete(designerId);

    res.json({
      success: true,
      message: 'Designer deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting designer:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete designer',
      error: err.message
    });
  }
});

module.exports = router;
