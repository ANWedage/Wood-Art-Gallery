const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CustomOrder = require('../models/CustomOrder');

// Get delivery overview statistics
router.get('/overview', async (req, res) => {
  try {
    console.log('Fetching delivery overview data...');

    // Get current date for today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Fetch marketplace orders statistics
    const [
      readyMarketplaceOrders,
      onDeliveryMarketplaceOrders,
      completedTodayMarketplace
    ] = await Promise.all([
      Order.countDocuments({ deliveryStatus: 'ready_for_delivery' }),
      Order.countDocuments({ deliveryStatus: 'picked_up' }),
      Order.countDocuments({ 
        deliveryStatus: 'delivered',
        $or: [
          { deliveryDate: { $gte: today, $lt: tomorrow } },
          { 
            deliveryDate: { $exists: false },
            updatedAt: { $gte: today, $lt: tomorrow }
          }
        ]
      })
    ]);

    // Fetch custom orders statistics
    const [
      readyCustomOrders,
      onDeliveryCustomOrders,
      completedTodayCustom
    ] = await Promise.all([
      CustomOrder.countDocuments({ deliveryStatus: 'ready_for_delivery' }),
      CustomOrder.countDocuments({ deliveryStatus: 'picked_up' }),
      CustomOrder.countDocuments({ 
        deliveryStatus: 'delivered',
        $or: [
          { deliveryDate: { $gte: today, $lt: tomorrow } },
          { 
            deliveryDate: { $exists: false },
            updatedAt: { $gte: today, $lt: tomorrow }
          }
        ]
      })
    ]);

    // Calculate actual delivery revenue from released payments this month
    const [
      releasedMarketplaceRevenue,
      releasedCustomRevenue
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            deliveryStatus: 'delivered',
            paymentReleased: true,
            $or: [
              { deliveryDate: { $gte: startOfMonth, $lt: startOfNextMonth } },
              { 
                deliveryDate: { $exists: false },
                updatedAt: { $gte: startOfMonth, $lt: startOfNextMonth }
              }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$deliveryFee' }
          }
        }
      ]),
      CustomOrder.aggregate([
        {
          $match: {
            deliveryStatus: 'delivered',
            paymentReleased: true,
            $or: [
              { deliveryDate: { $gte: startOfMonth, $lt: startOfNextMonth } },
              { 
                deliveryDate: { $exists: false },
                updatedAt: { $gte: startOfMonth, $lt: startOfNextMonth }
              }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$deliveryFee' }
          }
        }
      ])
    ]);

    // Compile overview data
    const overviewData = {
      readyToDelivery: readyMarketplaceOrders + readyCustomOrders,
      onTheDelivery: onDeliveryMarketplaceOrders + onDeliveryCustomOrders,
      completedDelivery: completedTodayMarketplace + completedTodayCustom,
      totalRevenue: Math.round(
        (releasedMarketplaceRevenue[0]?.total || 0) + (releasedCustomRevenue[0]?.total || 0)
      )
    };

    console.log('Delivery overview data:', overviewData);

    res.json({
      success: true,
      data: overviewData,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error fetching delivery overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery overview data',
      error: error.message
    });
  }
});

module.exports = router;
