import React from 'react';
import './SalaryInformation.css';

export default function SalaryInformation() {
  return (
    <div className="salary-information">
      <h1 className="staffdesigner-dashboard-title">Salary Information</h1>
      <p>View your salary details, payment history, and earnings summary.</p>
      <div className="salary-cards">
        <div className="salary-card">
          <h3>Current Month Earnings</h3>
          <p className="salary-amount">Rs. 0</p>
        </div>
        <div className="salary-card">
          <h3>Total Completed Orders</h3>
          <p className="salary-amount">0</p>
        </div>
        <div className="salary-card">
          <h3>Average per Order</h3>
          <p className="salary-amount">Rs. 0</p>
        </div>
      </div>
    </div>
  );
}
