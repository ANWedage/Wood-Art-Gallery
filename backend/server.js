// backend/server.js
// Express server setup for Wood Art Gallery backend

require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail, testEmailConnection } = require('./utils/emailService');
const stockEmitter = require('./stockEvents');

// Import routes
const userRoutes = require('./routes/user');
const designRoutes = require('./routes/design');
const customOrderRoutes = require('./routes/customOrder');
const supplierRoutes = require('./routes/supplier');
const purchaseOrderRoutes = require('./routes/purchaseOrder');
const stockRoutes = require('./routes/stock');
const bankSlipRoutes = require('./routes/bankSlip');
const orderRoutes = require('./routes/order');
const financialRoutes = require('./routes/financial');
const adminRoutes = require('./routes/admin');
const supplierPaymentRoutes = require('./routes/supplierPayment');
const staffDesignerSalaryRoutes = require('./routes/staffDesignerSalary');
const materialRequestRoutes = require('./routes/materialRequest');
const deliveryRoutes = require('./routes/delivery');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// Connect to MongoDB
connectDB(process.env.MONGODB_URI);

// Routes
app.use('/api/user', userRoutes);
app.use('/api/design', designRoutes);
app.use('/api/customOrder', customOrderRoutes);
app.use('/api/bankSlip', bankSlipRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', orderRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/supplier-payments', supplierPaymentRoutes);
app.use('/api/staff-designer-salaries', staffDesignerSalaryRoutes);
app.use('/api/material-requests', materialRequestRoutes);
app.use('/api/delivery', deliveryRoutes);


app.post('/api/register', async (req, res) => {
  try {
    const { name, address, phone, email, password, role } = req.body;
    if (!name || !address || !phone || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, address, phone, email, password: hashed, role });
    
    // Send welcome email with credentials
    try {
      const emailResult = await sendWelcomeEmail(email, name, password, role || 'customer');
      console.log('Email sending result:', emailResult);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }
    
    res.json({ 
      success: true, 
      user: { email: user.email, role: user.role },
      message: 'Registration successful! Please check your email for login credentials.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    // Return user ID, name, email and role for cart functionality
    res.json({ 
      success: true, 
      user: { 
        _id: user._id,
        name: user.name,
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

// Test email configuration endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const result = await testEmailConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Email test failed', error: error.message });
  }
});

// SSE endpoint for real-time updates
let sseClients = [];

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  // Add client to list
  sseClients.push(res);

  // Send initial connection event
  res.write('data: {"type": "connected"}\n\n');

  // Remove client when connection is closed
  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Function to broadcast events to all connected clients
function broadcastToClients(event, data) {
  const eventData = JSON.stringify({ type: event, data });
  sseClients.forEach(client => {
    try {
      client.write(`data: ${eventData}\n\n`);
    } catch (err) {
      // Remove disconnected clients
      sseClients = sseClients.filter(c => c !== client);
    }
  });
}

// Listen for design update events
stockEmitter.on('designUpdated', (designData) => {
  broadcastToClients('designUpdated', designData);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
