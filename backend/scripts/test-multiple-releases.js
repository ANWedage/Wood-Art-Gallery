const mongoose = require('mongoose');
require('dotenv').config();

// Import the models
const Order = require('../models/Order');
const DesignerPayment = require('../models/DesignerPayment');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wood-art-gallery';

async function testMultipleReleases() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a paid order with items
    const order = await Order.findOne({ paymentStatus: 'paid', status: { $ne: 'cancelled' } });
    
    if (!order || !order.items.length) {
      console.log('No suitable test order found');
      process.exit(0);
    }

    console.log(`Testing with order: ${order.orderId}`);
    console.log(`Order has ${order.items.length} items`);

    // Try to release payment for the first item multiple times (should fail second time)
    const firstItem = order.items[0];
    console.log(`\nTesting item: ${firstItem.itemName} (ID: ${firstItem._id})`);

    // First release - should succeed
    try {
      const existing1 = await DesignerPayment.findOne({ 
        orderId: order.orderId, 
        orderItemId: firstItem._id 
      });
      
      if (existing1) {
        console.log('Payment already exists for this item, deleting for test...');
        await DesignerPayment.deleteOne({ _id: existing1._id });
      }

      const designerUser = await User.findById(firstItem.designerId);
      const itemPrice = firstItem.subtotal;
      const commission = +(itemPrice * 0.20).toFixed(2);
      const designerAmount = +(itemPrice - commission).toFixed(2);

      const payment1 = await DesignerPayment.create({
        orderId: order.orderId,
        orderMongoId: order._id,
        orderItemId: firstItem._id,
        orderItemDesignId: firstItem.designId,
        designerId: firstItem.designerId,
        designerName: firstItem.designerName,
        designerEmail: designerUser ? designerUser.email : '',
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        itemName: firstItem.itemName,
        quantity: firstItem.quantity,
        itemSubtotal: firstItem.subtotal,
        deliveryFee: 250,
        commission: commission,
        designerAmount: designerAmount,
        releasedBy: 'test@system'
      });
      console.log('✓ First release succeeded');

      // Second release for same item - should fail
      try {
        const payment2 = await DesignerPayment.create({
          orderId: order.orderId,
          orderMongoId: order._id,
          orderItemId: firstItem._id,
          orderItemDesignId: firstItem.designId,
          designerId: firstItem.designerId,
          designerName: firstItem.designerName,
          designerEmail: designerUser ? designerUser.email : '',
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          itemName: firstItem.itemName,
          quantity: firstItem.quantity,
          itemSubtotal: firstItem.subtotal,
          deliveryFee: 250,
          commission: commission,
          designerAmount: designerAmount,
          releasedBy: 'test@system'
        });
        console.log('✗ Second release should have failed but succeeded');
      } catch (err) {
        if (err.code === 11000) {
          console.log('✓ Second release correctly failed with duplicate key error');
        } else {
          console.log('✗ Second release failed with unexpected error:', err.message);
        }
      }

    } catch (err) {
      console.log('✗ First release failed:', err.message);
    }

    // Test releasing different items if available
    if (order.items.length > 1) {
      console.log('\nTesting different items...');
      
      const secondItem = order.items[1];
      try {
        const existing2 = await DesignerPayment.findOne({ 
          orderId: order.orderId, 
          orderItemId: secondItem._id 
        });
        
        if (existing2) {
          console.log('Payment already exists for second item, deleting for test...');
          await DesignerPayment.deleteOne({ _id: existing2._id });
        }

        const designerUser2 = await User.findById(secondItem.designerId);
        const itemPrice2 = secondItem.subtotal;
        const commission2 = +(itemPrice2 * 0.20).toFixed(2);
        const designerAmount2 = +(itemPrice2 - commission2).toFixed(2);

        const payment3 = await DesignerPayment.create({
          orderId: order.orderId,
          orderMongoId: order._id,
          orderItemId: secondItem._id,
          orderItemDesignId: secondItem.designId,
          designerId: secondItem.designerId,
          designerName: secondItem.designerName,
          designerEmail: designerUser2 ? designerUser2.email : '',
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          itemName: secondItem.itemName,
          quantity: secondItem.quantity,
          itemSubtotal: secondItem.subtotal,
          deliveryFee: 250,
          commission: commission2,
          designerAmount: designerAmount2,
          releasedBy: 'test@system'
        });
        console.log('✓ Release for different item succeeded');
      } catch (err) {
        console.log('✗ Release for different item failed:', err.message);
      }
    }

    // Show final count
    const finalCount = await DesignerPayment.countDocuments();
    console.log(`\nFinal designer payments count: ${finalCount}`);

    console.log('\nTest completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testMultipleReleases();
