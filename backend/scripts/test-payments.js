const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wood-art-gallery';

async function testMultiplePayments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check current state of designer payments collection
    const collection = db.collection('designerpayments');
    const count = await collection.countDocuments();
    console.log(`Current designer payments count: ${count}`);

    // Check current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Check orders collection for test data
    const ordersCollection = db.collection('orders');
    const orders = await ordersCollection.find({ paymentStatus: 'paid' }).limit(2).toArray();
    
    if (orders.length > 0) {
      console.log('\nFound test orders:');
      orders.forEach(order => {
        console.log(`Order ${order.orderId} has ${order.items.length} items`);
        order.items.forEach((item, idx) => {
          console.log(`  Item ${idx + 1}: ${item.itemName} (ID: ${item._id})`);
        });
      });
    } else {
      console.log('No paid orders found for testing');
    }

    console.log('\nTest completed');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testMultiplePayments();
