// backend/routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user details by email (for profile page)
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const user = await User.findOne({ email }, '-password'); // Exclude password
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: err.message });
  }
});


// Update user profile (with optional password change)
const bcrypt = require('bcryptjs');
router.put('/profile', async (req, res) => {
  try {
    const { email, name, address, phone, password } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const updateFields = { name, address, phone };
    if (password) {
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      updateFields.password = await bcrypt.hash(password, 10);
    }
    const updated = await User.findOneAndUpdate(
      { email },
      updateFields,
      { new: true, fields: '-password' }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: err.message });
  }
});

module.exports = router;
