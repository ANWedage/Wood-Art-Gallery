const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wood-art-gallery';

async function migrateDesignerPayments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('designerpayments');

    // Drop all existing indexes on the collection
    try {
      const indexes = await collection.indexes();
      console.log('Existing indexes:', indexes);
      
      // Drop the old unique index if it exists
      try {
        await collection.dropIndex({ orderId: 1, orderItemDesignId: 1 });
        console.log('Dropped old index: orderId + orderItemDesignId');
      } catch (err) {
        console.log('Old index not found or already dropped');
      }

      // Drop any other indexes except _id
      for (const index of indexes) {
        if (index.name !== '_id_') {
          try {
            await collection.dropIndex(index.name);
            console.log(`Dropped index: ${index.name}`);
          } catch (err) {
            console.log(`Could not drop index ${index.name}: ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.log('Error managing indexes:', err.message);
    }

    // Clear all existing designer payment records to start fresh
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing designer payment records`);

    // Create the new unique index
    try {
      await collection.createIndex({ orderId: 1, orderItemId: 1 }, { unique: true });
      console.log('Created new unique index: orderId + orderItemId');
    } catch (err) {
      console.log('Error creating new index:', err.message);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateDesignerPayments();
