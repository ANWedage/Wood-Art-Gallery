const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../models/Order');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wood-art-gallery';

async function createTestOrderWithMultipleItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a customer and designer
    const customer = await User.findOne({ role: 'customer' });
    const designer = await User.findOne({ role: 'designer' });

    if (!customer || !designer) {
      console.log('Need at least one customer and one designer user');
      process.exit(0);
    }

    // Create a test order with multiple items
    const testOrder = new Order({
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: '+1234567890',
      customerAddress: '123 Test Street',
      items: [
        {
          designId: new mongoose.Types.ObjectId(),
          itemName: 'Test Item 1',
          price: 100,
          quantity: 2,
          imageUrl: '/test1.jpg',
          designerName: designer.name,
          designerId: designer._id,
          material: 'Wood',
          boardSize: '12x8',
          boardColor: 'Natural',
          boardThickness: '0.5mm',
          description: 'Test description 1',
          subtotal: 200 // price * quantity
        },
        {
          designId: new mongoose.Types.ObjectId(),
          itemName: 'Test Item 2',
          price: 150,
          quantity: 1,
          imageUrl: '/test2.jpg',
          designerName: designer.name,
          designerId: designer._id,
          material: 'Wood',
          boardSize: '10x6',
          boardColor: 'Dark',
          boardThickness: '1mm',
          description: 'Test description 2',
          subtotal: 150 // price * quantity
        },
        {
          designId: new mongoose.Types.ObjectId(),
          itemName: 'Test Item 3',
          price: 75,
          quantity: 3,
          imageUrl: '/test3.jpg',
          designerName: designer.name,
          designerId: designer._id,
          material: 'Wood',
          boardSize: '8x4',
          boardColor: 'Light',
          boardThickness: '0.3mm',
          description: 'Test description 3',
          subtotal: 225 // price * quantity
        }
      ],
      totalAmount: 825, // 200 + 150 + 225 + 250 delivery
      deliveryFee: 250,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'paid', // COD is auto-paid
      status: 'confirmed'
    });

    await testOrder.save();
    console.log(`✓ Created test order: ${testOrder.orderId}`);
    console.log(`✓ Order has ${testOrder.items.length} items`);
    
    testOrder.items.forEach((item, idx) => {
      console.log(`  Item ${idx + 1}: ${item.itemName} (ID: ${item._id}) - Rs. ${item.subtotal}`);
    });

    console.log('\nNow you can test releasing multiple payments for different items!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create test order:', error);
    process.exit(1);
  }
}

createTestOrderWithMultipleItems();
