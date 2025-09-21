import React, { useState, useEffect } from 'react';
import './CustomizeOrderIncome.css';

export default function CustomizeOrderIncome() {
  const [customOrderIncome, setCustomOrderIncome] = useState([]);
  const [customOrderTotals, setCustomOrderTotals] = useState({});
  const [loadingCustomIncome, setLoadingCustomIncome] = useState(false);

  useEffect(() => {
    fetchCustomOrderIncome();
  }, []);

  const fetchCustomOrderIncome = async () => {
    setLoadingCustomIncome(true);
    try {
      const response = await fetch('http://localhost:5000/api/financial/customize-order-income');
      const data = await response.json();
      console.log('Custom order income data received:', data);
      if (data.success) {
        console.log('Sample row:', data.rows[0]);
        setCustomOrderIncome(data.rows);
        setCustomOrderTotals(data.totals);
      } else {
        console.error('Failed to fetch custom order income:', data.message);
      }
    } catch (error) {
      console.error('Error fetching custom order income:', error);
    } finally {
      setLoadingCustomIncome(false);
    }
  };

  return (
    <div className="customize-order-income">
      <h1 className="financial-dashboard-title">Customize Order Income</h1>
      
      
      {loadingCustomIncome ? (
        <div className="loading">Loading custom order income...</div>
      ) : customOrderIncome.length === 0 ? (
        <div className="no-data">
          <p>No custom order income records found.</p>
        </div>
      ) : (
        <>
          <div className="income-table-container">
            <table className="income-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name and Email</th>
                  <th>Staff Designer Name and Email</th>
                  <th>Payment Method</th>
                  <th>Total Price</th>
                  <th>Delivery Cost</th>
                  <th>Item Price</th>
                </tr>
              </thead>
              <tbody>
                {customOrderIncome.map((row, index) => {
                  // Frontend fallback for predefined staff designer from AuthContext
                  const fallbackStaffName = 'Staff Designer';
                  const fallbackStaffEmail = 'staff@gmail.com';
                  const displayStaffName = row.staffDesignerName && row.staffDesignerName !== 'Not Assigned' ? row.staffDesignerName : fallbackStaffName;
                  const displayStaffEmail = row.staffDesignerEmail && row.staffDesignerEmail.trim() !== '' ? row.staffDesignerEmail : fallbackStaffEmail;

                  return (
                    <tr key={row.orderMongoId || index}>
                      <td>{row.orderId}</td>
                      <td>
                        <div className="customer-info">
                          <div className="name">{row.customerName}</div>
                          <div className="email">{row.customerEmail}</div>
                        </div>
                      </td>
                      <td>
                        <div className="designer-info">
                          <div className="name">{displayStaffName}</div>
                          <div className="email">{displayStaffEmail}</div>
                        </div>
                      </td>
                      <td>{row.paymentMethod}</td>
                      <td>Rs. {row.totalPrice.toLocaleString()}</td>
                      <td>Rs. {row.deliveryFee.toLocaleString()}</td>
                      <td>Rs. {row.itemPrice.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="income-totals">
            <h3>Total Amount</h3>
            <div className="totals-grid">
              <div className="total-item">
                <span className="label">Total Revenue:</span>
                <span className="value">Rs. {(customOrderTotals.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="total-item">
                <span className="label">Total Delivery:</span>
                <span className="value">Rs. {(customOrderTotals.delivery || 0).toLocaleString()}</span>
              </div>
              <div className="total-item">
                <span className="label">Total Item Price:</span>
                <span className="value">Rs. {(customOrderTotals.itemPrice || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
