const mongoose = require('mongoose');

const staffDesignerSalarySchema = new mongoose.Schema({
  staffDesignerName: {
    type: String,
    required: true,
    trim: true
  },
  staffDesignerEmail: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 2025,
    max: 2030
  },
  month: {
    type: String,
    required: true,
    enum: ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December']
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0,
    max: 200000
  },
  allowances: {
    type: Number,
    default: 0,
    min: 0
  },
  taxPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  loanInstallments: {
    type: Number,
    default: 0,
    min: 0
  },
  // Calculated fields
  epfCompanyShare: {
    type: Number,
    default: 0
  },
  epfEmployeeShare: {
    type: Number,
    default: 0
  },
  etfCompanyShare: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  transactionId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate derived fields
staffDesignerSalarySchema.pre('save', function(next) {
  // Validate loan installments don't exceed basic salary
  if (this.loanInstallments > this.basicSalary) {
    return next(new Error('Loan installments cannot exceed basic salary'));
  }

  // Calculate EPF (Employee Provident Fund)
  // Company share: 12% of basic salary
  // Employee share: 8% of basic salary
  this.epfCompanyShare = Math.round(this.basicSalary * 0.12);
  this.epfEmployeeShare = Math.round(this.basicSalary * 0.08);

  // Calculate ETF (Employees' Trust Fund)
  // Company share: 3% of basic salary
  this.etfCompanyShare = Math.round(this.basicSalary * 0.03);

  // Calculate tax amount
  this.taxAmount = Math.round((this.basicSalary + this.allowances) * (this.taxPercentage / 100));

  // Calculate gross salary (basic + allowances + company contributions)
  this.grossSalary = this.basicSalary + this.allowances + this.epfCompanyShare + this.etfCompanyShare;

  // Calculate net salary (basic + allowances - employee contributions - tax - loans)
  this.netSalary = this.basicSalary + this.allowances - this.epfEmployeeShare - this.taxAmount - this.loanInstallments;

  // Generate transaction ID if not exists
  if (!this.transactionId) {
    const year = this.year.toString();
    const monthNum = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December']
                    .indexOf(this.month) + 1;
    const monthStr = monthNum.toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    this.transactionId = `SDS${year}${monthStr}${random}`;
  }

  next();
});

// Compound index to ensure unique salary record per staff per month/year
staffDesignerSalarySchema.index({ staffDesignerEmail: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('StaffDesignerSalary', staffDesignerSalarySchema);
