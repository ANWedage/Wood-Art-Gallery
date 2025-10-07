// Migration script to move existing images from filesystem to MongoDB GridFS
// This ensures all images are accessible from any PC accessing the same database
// Usage: node scripts/migrate-images-to-gridfs.js

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const connectDB = require('../db');
const Design = require('../models/Design');

async function migrateImages() {
  try {
    console.log('Starting image migration to GridFS...');
    
    // Connect to database
    await connectDB(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not ready');
    }
    
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // Find all designs that don't have imageId (haven't been migrated)
    const designs = await Design.find({
      $or: [
        { imageId: { $exists: false } },
        { imageId: null }
      ]
    });
    
    console.log(`Found ${designs.length} designs to migrate`);
    
    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const design of designs) {
      try {
        // Skip if imageUrl doesn't point to uploads folder
        if (!design.imageUrl || !design.imageUrl.startsWith('/uploads/')) {
          console.log(`Skipping design ${design._id}: No valid imageUrl`);
          skipped++;
          continue;
        }
        
        // Check if file exists on disk
        const filename = path.basename(design.imageUrl);
        const filePath = path.join(uploadsDir, filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`Skipping design ${design._id}: File not found at ${filePath}`);
          skipped++;
          continue;
        }
        
        // Read file and upload to GridFS
        const fileBuffer = fs.readFileSync(filePath);
        const contentType = getContentType(filename);
        
        const uploadStream = bucket.openUploadStream(filename, {
          contentType: contentType
        });
        
        const gridFile = await new Promise((resolve, reject) => {
          uploadStream.end(fileBuffer, (error, file) => {
            if (error) return reject(error);
            resolve(file);
          });
        });
        
        // Update design with new GridFS info
        await Design.updateOne(
          { _id: design._id },
          {
            $set: {
              imageId: gridFile._id,
              imageUrl: `/api/design/image/${gridFile._id.toString()}`
            }
          }
        );
        
        // Optionally remove the old file from disk
        try {
          fs.unlinkSync(filePath);
          console.log(`✓ Migrated and removed: ${filename}`);
        } catch (e) {
          console.log(`✓ Migrated (but could not remove): ${filename}`);
        }
        
        migrated++;
        
      } catch (error) {
        console.error(`✗ Failed to migrate design ${design._id}:`, error.message);
        failed++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log('========================\n');
    
    if (migrated > 0) {
      console.log('✓ Images are now stored in MongoDB and accessible from any PC!');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

// Run migration
migrateImages();
