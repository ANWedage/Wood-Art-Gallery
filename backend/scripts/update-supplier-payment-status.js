const mongoose = require('mongoose');
const SupplierPayment = require('../models/SupplierPayment');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/wood-art-gallery', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateAllPaymentStatus() {
  try {
    console.log('Connecting to database...');
    
    // Update all supplier payments to have "paid" status
    const result = await SupplierPayment.updateMany(
      {}, // Empty filter means update all documents
      { 
        $set: { 
          status: 'paid',
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} supplier payment records to "paid" status`);
    
    // Verify the update
    const totalPaidPayments = await SupplierPayment.countDocuments({ status: 'paid' });
    const totalPayments = await SupplierPayment.countDocuments();
    
    console.log(`Total payments: ${totalPayments}`);
    console.log(`Paid payments: ${totalPaidPayments}`);
    
    if (totalPaidPayments === totalPayments) {
      console.log('✅ All supplier payments now have "paid" status');
    } else {
      console.log('⚠️ Some payments may still have other status values');
    }
    
  } catch (error) {
    console.error('Error updating supplier payment status:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the update
updateAllPaymentStatus();
