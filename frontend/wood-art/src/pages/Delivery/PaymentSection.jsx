import React, { useState, useEffect } from 'react';
import './PaymentSection.css';

export default function PaymentSection() {
  const [paymentData, setPaymentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReleasedPayments();
  }, []);

  const fetchReleasedPayments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch completed marketplace orders
      const marketplaceResponse = await fetch('http://localhost:5000/api/orders/delivery/marketplace?section=completed');
      const marketplaceData = await marketplaceResponse.json();

      // Fetch completed custom orders
      const customResponse = await fetch('http://localhost:5000/api/customOrder/delivery/custom?section=completed');
      const customData = await customResponse.json();

      const releasedPayments = [];

      // Process marketplace orders - only get released payments
      if (marketplaceData?.success && marketplaceData.orders) {
        marketplaceData.orders.forEach(order => {
          if (order.paymentReleased && order.deliveryTransactionId) {
            releasedPayments.push({
              orderId: order.orderId || order._id,
              deliveredDate: order.updatedAt || order.createdAt,
              payment: order.deliveryFee || 0,
              transactionId: order.deliveryTransactionId,
              _id: order._id
            });
          }
        });
      }

      // Process custom orders - only get released payments
      if (customData?.success && customData.orders) {
        customData.orders.forEach(order => {
          if (order.paymentReleased && order.deliveryTransactionId) {
            releasedPayments.push({
              orderId: order.orderId || order._id,
              deliveredDate: order.updatedAt || order.createdAt,
              payment: order.deliveryFee || 0,
              transactionId: order.deliveryTransactionId,
              _id: order._id
            });
          }
        });
      }

      // Sort by delivered date (newest first)
      releasedPayments.sort((a, b) => new Date(b.deliveredDate) - new Date(a.deliveredDate));

      setPaymentData(releasedPayments);
    } catch (error) {
      console.error('Error fetching released payments:', error);
      setError('Failed to fetch payment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  };

  const getTotalAmount = () => {
    return paymentData.reduce((sum, payment) => sum + (payment.payment || 0), 0);
  };

  if (loading) {
    return (
      <div className="payment-section">
        <h1 className="delivery-dashboard-title2">Payments</h1>
        <div className="loading-state">Loading payment data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-section">
        <h1 className="delivery-dashboard-title2">Payments</h1>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchReleasedPayments} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-section">
      <div className="payment-header">
        <h1 className="delivery-dashboard-title2">Payments</h1>
        <button onClick={fetchReleasedPayments} className="refresh-btn">
          ↻ Refresh
        </button>
      </div>

      {paymentData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h3>No Released Payments</h3>
          <p>No released delivery payments found.</p>
        </div>
      ) : (
        <div className="payment-table-wrapper">
          <table className="payment-table20">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Delivered Date</th>
                <th>Payment</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {paymentData.map((payment) => (
                <tr key={payment._id}>
                  <td className="order-id">{payment.orderId}</td>
                  <td className="delivered-date">{formatDate(payment.deliveredDate)}</td>
                  <td className="payment-amount">{formatCurrency(payment.payment)}</td>
                  <td className="transaction-id">{payment.transactionId}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="table-footer">
            <div className="table-summary">
              <strong>Total Amount: {formatCurrency(getTotalAmount())}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
