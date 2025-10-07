// Test script to verify GridFS bank slip functionality
// This will test the bank slip upload endpoint

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testBankSlipUpload() {
  try {
    // Create a dummy image file for testing
    const testImageBuffer = Buffer.from('Test bank slip image data', 'utf8');
    
    const formData = new FormData();
    formData.append('bankSlip', testImageBuffer, {
      filename: 'test-bank-slip.jpg',
      contentType: 'image/jpeg'
    });

    const response = await fetch('http://localhost:5000/api/bankSlip/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Bank slip upload test result:', result);

    if (result.success) {
      console.log('✅ Bank slip uploaded successfully to GridFS');
      console.log('File Path:', result.filePath);
      console.log('File ID:', result.fileId);
      console.log('Filename:', result.filename);
    } else {
      console.log('❌ Bank slip upload failed:', result.message);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testBankSlipUpload();
