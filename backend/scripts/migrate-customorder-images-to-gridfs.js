// scripts/migrate-customorder-images-to-gridfs.js
// Migrate existing custom order reference images from filesystem to MongoDB GridFS (bucket: uploads)
// Usage: node scripts/migrate-customorder-images-to-gridfs.js

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../db');
const CustomOrder = require('../models/CustomOrder');

async function run() {
  try {
    await connectDB(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not ready');

    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    const orders = await CustomOrder.find({
      $and: [
        { $or: [ { referenceImageId: { $exists: false } }, { referenceImageId: null } ] },
        { referenceImageUrl: { $ne: null } }
      ]
    });

    console.log(`Found ${orders.length} custom orders to migrate`);

    let migrated = 0, skipped = 0, failed = 0;
    for (const order of orders) {
      try {
        const rel = order.referenceImageUrl.startsWith('/') ? order.referenceImageUrl.slice(1) : order.referenceImageUrl;
        const fullPath = path.isAbsolute(rel) ? rel : path.join(__dirname, '..', rel);
        if (!fs.existsSync(fullPath)) {
          console.warn(`Skip: file missing for ${order.orderId || order._id}: ${fullPath}`);
          skipped++;
          continue;
        }

        const filename = path.basename(fullPath);
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        switch (ext) {
          case '.jpg':
          case '.jpeg': contentType = 'image/jpeg'; break;
          case '.png': contentType = 'image/png'; break;
          case '.gif': contentType = 'image/gif'; break;
          case '.webp': contentType = 'image/webp'; break;
        }

        await new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(fullPath);
          const uploadStream = bucket.openUploadStream(filename, { contentType, metadata: { type: 'referenceImage', migrated: true, order: order.orderId || order._id.toString() } });
          readStream.on('error', reject);
          uploadStream.on('error', reject);
          uploadStream.on('finish', () => {
            order.referenceImageId = uploadStream.id;
            order.referenceImageFilename = filename;
            resolve();
          });
          readStream.pipe(uploadStream);
        });

        await order.save();
        migrated++;
        console.log(`✓ Migrated ${order.orderId || order._id}`);
      } catch (err) {
        failed++;
        console.error(`✗ Failed ${order.orderId || order._id}:`, err.message);
      }
    }

    console.log(`Done. Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
