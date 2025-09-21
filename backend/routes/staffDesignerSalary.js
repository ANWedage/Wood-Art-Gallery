const express = require('express');
const router = express.Router();
const StaffDesignerSalary = require('../models/StaffDesignerSalary');
const User = require('../models/User');

// Get all staff designer salaries
router.get('/', async (req, res) => {
  try {
    const salaries = await StaffDesignerSalary.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      salaries
    });
  } catch (error) {
    console.error('Error fetching salaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salaries',
      error: error.message
    });
  }
});

// Get staff designers (users with role 'staff_designer' or 'staffdesigner')
router.get('/staff-designers', async (req, res) => {
  try {
    const staffDesigners = await User.find({ 
      $or: [
        { role: 'staff_designer' },
        { role: 'staffdesigner' }
      ]
    })
      .select('name email')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      staffDesigners
    });
  } catch (error) {
    console.error('Error fetching staff designers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff designers',
      error: error.message
    });
  }
});

// Create new staff designer salary
router.post('/', async (req, res) => {
  try {
    const {
      staffDesignerName,
      staffDesignerEmail,
      year,
      month,
      basicSalary,
      allowances = 0,
      taxPercentage = 0,
      loanInstallments = 0
    } = req.body;

    // Validate required fields
    if (!staffDesignerName || !staffDesignerEmail || !year || !month || !basicSalary) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: staffDesignerName, staffDesignerEmail, year, month, basicSalary'
      });
    }

    // Validate staff designer exists (check both role formats)
    const staffDesigner = await User.findOne({ 
      name: staffDesignerName, 
      email: staffDesignerEmail, 
      $or: [
        { role: 'staff_designer' },
        { role: 'staffdesigner' }
      ]
    });

    if (!staffDesigner) {
      return res.status(400).json({
        success: false,
        message: 'Staff designer not found with the provided name and email'
      });
    }

    // Check if salary record already exists for this staff designer, year, and month
    const existingSalary = await StaffDesignerSalary.findOne({
      staffDesignerEmail,
      year,
      month
    });

    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: `Salary record already exists for ${staffDesignerName} in ${month} ${year}`
      });
    }

    // Create new salary record
    const salary = new StaffDesignerSalary({
      staffDesignerName,
      staffDesignerEmail,
      year: parseInt(year),
      month,
      basicSalary: parseFloat(basicSalary),
      allowances: parseFloat(allowances) || 0,
      taxPercentage: parseFloat(taxPercentage) || 0,
      loanInstallments: parseFloat(loanInstallments) || 0
    });

    await salary.save();

    res.status(201).json({
      success: true,
      message: 'Salary record created successfully',
      salary
    });
  } catch (error) {
    console.error('Error creating salary:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Salary record already exists for this staff designer in the specified month and year'
      });
    }

    if (error.message.includes('Loan installments cannot exceed basic salary')) {
      return res.status(400).json({
        success: false,
        message: 'Loan installments cannot exceed basic salary'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create salary record',
      error: error.message
    });
  }
});

// Get salary by ID
router.get('/:id', async (req, res) => {
  try {
    const salary = await StaffDesignerSalary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    res.json({
      success: true,
      salary
    });
  } catch (error) {
    console.error('Error fetching salary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary record',
      error: error.message
    });
  }
});

// Update salary by ID
router.put('/:id', async (req, res) => {
  try {
    const {
      staffDesignerName,
      staffDesignerEmail,
      year,
      month,
      basicSalary,
      allowances,
      taxPercentage,
      loanInstallments
    } = req.body;

    const salary = await StaffDesignerSalary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    // Validate staff designer exists if email is being changed
    if (staffDesignerEmail && staffDesignerEmail !== salary.staffDesignerEmail) {
      const staffDesigner = await User.findOne({ 
        name: staffDesignerName, 
        email: staffDesignerEmail, 
        $or: [
          { role: 'staff_designer' },
          { role: 'staffdesigner' }
        ]
      });

      if (!staffDesigner) {
        return res.status(400).json({
          success: false,
          message: 'Staff designer not found with the provided name and email'
        });
      }
    }

    // Update fields
    if (staffDesignerName !== undefined) salary.staffDesignerName = staffDesignerName;
    if (staffDesignerEmail !== undefined) salary.staffDesignerEmail = staffDesignerEmail;
    if (year !== undefined) salary.year = parseInt(year);
    if (month !== undefined) salary.month = month;
    if (basicSalary !== undefined) salary.basicSalary = parseFloat(basicSalary);
    if (allowances !== undefined) salary.allowances = parseFloat(allowances) || 0;
    if (taxPercentage !== undefined) salary.taxPercentage = parseFloat(taxPercentage) || 0;
    if (loanInstallments !== undefined) salary.loanInstallments = parseFloat(loanInstallments) || 0;

    await salary.save();

    res.json({
      success: true,
      message: 'Salary record updated successfully',
      salary
    });
  } catch (error) {
    console.error('Error updating salary:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Salary record already exists for this staff designer in the specified month and year'
      });
    }

    if (error.message.includes('Loan installments cannot exceed basic salary')) {
      return res.status(400).json({
        success: false,
        message: 'Loan installments cannot exceed basic salary'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update salary record',
      error: error.message
    });
  }
});

// Delete salary by ID
router.delete('/:id', async (req, res) => {
  try {
    const salary = await StaffDesignerSalary.findByIdAndDelete(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    res.json({
      success: true,
      message: 'Salary record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting salary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete salary record',
      error: error.message
    });
  }
});

module.exports = router;
