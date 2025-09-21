const mongoose = require('mongoose');
const CustomOrder = require('./models/CustomOrder');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/wood-art-gallery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkOrders() {
  try {
    console.log('=== CHECKING CUSTOM ORDERS ===');
    
    // Get all orders
    const allOrders = await CustomOrder.find().sort({ createdAt: -1 });
    console.log(`Total orders in database: ${allOrders.length}`);
    
    // Check orders by status
    const statusCounts = {};
    allOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log('Orders by status:', statusCounts);
    
    // Show some example orders
    console.log('\n=== SAMPLE ORDERS ===');
    allOrders.slice(0, 3).forEach(order => {
      console.log(`ID: ${order.orderId || order._id}`);
      console.log(`Status: ${order.status}`);
      console.log(`Customer: ${order.customerName}`);
      console.log(`Staff Designer: ${order.staffDesignerId || 'Not assigned'}`);
      console.log('---');
    });
    
    // Check specifically for completed orders
    const completedOrders = await CustomOrder.find({ status: 'completed' });
    console.log(`\nCompleted orders: ${completedOrders.length}`);
    
    if (completedOrders.length > 0) {
      console.log('Completed orders details:');
      completedOrders.forEach(order => {
        console.log(`- ${order.orderId || order._id}: ${order.customerName} (Staff: ${order.staffDesignerId || 'Not assigned'})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkOrders();
