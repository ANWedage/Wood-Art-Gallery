// scripts/migrate-bank-slips-to-gridfs.js
// Migrate legacy bank slips (custom orders + regular orders) from filesystem to MongoDB GridFS (bucket: uploads)
// Usage: node scripts/migrate-bank-slips-to-gridfs.js

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../db');
const CustomOrder = require('../models/CustomOrder');
const Order = require('../models/Order');

async function run() {
  try {
    await connectDB(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not ready');

    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    let migrated = 0, skipped = 0, failed = 0;

    async function migrateForModel(Model, modelName) {
      const docs = await Model.find({
        $and: [
          { $or: [ { bankSlipId: { $exists: false } }, { bankSlipId: null } ] },
          { bankSlipUrl: { $exists: true, $ne: null, $ne: '' } }
        ]
      });

      console.log(`Found ${docs.length} ${modelName} with legacy bankSlipUrl to migrate`);

      for (const doc of docs) {
        try {
          const relUrl = doc.bankSlipUrl;
          if (!relUrl || typeof relUrl !== 'string') {
            console.warn(`Skip ${modelName} ${doc.orderId || doc._id}: bankSlipUrl is null or invalid`);
            skipped++;
            continue;
          }
          // Normalize relative path: handle starting slash
          const relativePath = relUrl.startsWith('/') ? relUrl.slice(1) : relUrl;
          // If it's already an API url, skip
          if (relativePath.startsWith('api/') || relativePath.startsWith('api\\')) {
            console.warn(`Skip ${modelName} ${doc.orderId || doc._id}: bankSlipUrl appears to be API path: ${relUrl}`);
            skipped++;
            continue;
          }

          // Try resolving to absolute file path within backend directory
          const absPath = path.isAbsolute(relativePath)
            ? relativePath
            : path.join(__dirname, '..', relativePath);

          let filePath = absPath;
          if (!fs.existsSync(filePath)) {
            // Try resolving within uploads dir using base name
            const base = path.basename(relativePath);
            const candidate = path.join(uploadsDir, base);
            if (fs.existsSync(candidate)) {
              filePath = candidate;
            }
          }

          if (!fs.existsSync(filePath)) {
            console.warn(`Skip ${modelName} ${doc.orderId || doc._id}: File missing at ${filePath}`);
            skipped++;
            continue;
          }

          const filename = path.basename(filePath);
          const ext = path.extname(filename).toLowerCase();
          let contentType = 'application/octet-stream';
          switch (ext) {
            case '.jpg':
            case '.jpeg': contentType = 'image/jpeg'; break;
            case '.png': contentType = 'image/png'; break;
            case '.gif': contentType = 'image/gif'; break;
            case '.webp': contentType = 'image/webp'; break;
            case '.pdf': contentType = 'application/pdf'; break;
          }

          await new Promise((resolve, reject) => {
            const read = fs.createReadStream(filePath);
            const upload = bucket.openUploadStream(filename, {
              contentType,
              metadata: { type: 'bankSlip', migrated: true, order: (doc.orderId || doc._id).toString(), model: modelName }
            });
            read.on('error', reject);
            upload.on('error', reject);
            upload.on('finish', () => {
              doc.bankSlipId = upload.id;
              doc.bankSlipFilename = filename;
              resolve();
            });
            read.pipe(upload);
          });

          await doc.save();
          migrated++;
          console.log(`✓ Migrated bank slip for ${modelName} ${doc.orderId || doc._id}`);
        } catch (err) {
          failed++;
          console.error(`✗ Failed to migrate ${modelName} ${doc.orderId || doc._id}:`, err.message);
        }
      }
    }

    await migrateForModel(CustomOrder, 'CustomOrder');
    await migrateForModel(Order, 'Order');

    console.log('\n=== Bank Slip Migration Summary ===');
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log('===================================\n');

    if (migrated > 0) {
      console.log('✓ All bank slips are now stored in MongoDB and downloadable from any PC.');
    }

    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

run();
