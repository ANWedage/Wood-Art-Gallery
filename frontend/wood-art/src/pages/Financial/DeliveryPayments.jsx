import React, { useState, useEffect } from 'react';
import './DeliveryPayments.css';

export default function DeliveryPayments() {
  const [deliveryData, setDeliveryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingReleaseId, setProcessingReleaseId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCompletedDeliveries();
  }, []);

  const fetchCompletedDeliveries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch completed marketplace orders
      const marketplaceResponse = await fetch('http://localhost:5000/api/orders/delivery/marketplace?section=completed');
      const marketplaceData = await marketplaceResponse.json();

      // Fetch completed custom orders
      const customResponse = await fetch('http://localhost:5000/api/customOrder/delivery/custom?section=completed');
      const customData = await customResponse.json();

      const combinedDeliveries = [];

      // Process marketplace orders
      if (marketplaceData?.success && marketplaceData.orders) {
        marketplaceData.orders.forEach(order => {
          combinedDeliveries.push({
            orderId: order.orderId || order._id,
            orderType: 'Marketplace',
            paymentMethod: order.paymentMethod || 'N/A',
            deliveredDate: order.updatedAt || order.createdAt,
            deliveryCost: order.deliveryFee || 0,
            isReleased: order.paymentReleased || false,
            transactionId: order.deliveryTransactionId || null,
            customerName: order.customerName || 'N/A',
            customerEmail: order.customerEmail || 'N/A',
            totalAmount: (order.deliveryFee || 0),
            _id: order._id
          });
        });
      }

      // Process custom orders
      if (customData?.success && customData.orders) {
        customData.orders.forEach(order => {
          combinedDeliveries.push({
            orderId: order.orderId || order._id,
            orderType: 'Custom Order',
            paymentMethod: order.paymentMethod || 'N/A',
            deliveredDate: order.updatedAt || order.createdAt,
            deliveryCost: order.deliveryFee || 0,
            isReleased: order.paymentReleased || false,
            transactionId: order.deliveryTransactionId || null,
            customerName: order.customerName || 'N/A',
            customerEmail: order.customerEmail || 'N/A',
            totalAmount: (order.deliveryFee || 0),
            _id: order._id
          });
        });
      }

      // Sort by delivered date (newest first)
      combinedDeliveries.sort((a, b) => new Date(b.deliveredDate) - new Date(a.deliveredDate));

      setDeliveryData(combinedDeliveries);
    } catch (error) {
      console.error('Error fetching completed deliveries:', error);
      setError('Failed to fetch delivery data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TXN-DEL-${timestamp}-${random}`;
  };

  const handleReleasePayment = async (delivery) => {
    if (!window.confirm(`Are you sure you want to release payment for Order ${delivery.orderId}?`)) {
      return;
    }

    setProcessingReleaseId(delivery._id);
    
    try {
      const transactionId = generateTransactionId();
      const endpoint = delivery.orderType === 'Marketplace' 
        ? `http://localhost:5000/api/orders/${delivery._id}/release-delivery-payment`
        : `http://localhost:5000/api/customOrder/${delivery._id}/release-delivery-payment`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryTransactionId: transactionId,
          paymentReleased: true,
          releaseDate: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setDeliveryData(prevData => 
          prevData.map(item => 
            item._id === delivery._id 
              ? { ...item, isReleased: true, transactionId: transactionId }
              : item
          )
        );
        
        alert(`Payment released successfully! Transaction ID: ${transactionId}`);
      } else {
        alert(data.message || 'Failed to release payment');
      }
    } catch (error) {
      console.error('Error releasing payment:', error);
      alert('Failed to release payment. Please try again.');
    } finally {
      setProcessingReleaseId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  };

  const getTotalAmount = () => {
    return filteredData.reduce((sum, delivery) => sum + (delivery.deliveryCost || 0), 0);
  };

  // Client-side filter by orderId or transactionId
  const filteredData = deliveryData.filter(d => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (d.orderId || '').toString().toLowerCase().includes(q) ||
      (d.transactionId || '').toString().toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="delivery-payments">
        <h1 className="financial-dashboard-title">Delivery Payments</h1>
        <div className="loading-state">Loading delivery payment data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="delivery-payments">
        <h1 className="financial-dashboard-title">Delivery Payments</h1>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchCompletedDeliveries} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-payments">
      <div className="delivery-payments-header">
        <h1 className="financial-dashboard-title">Delivery Payments</h1>
        <button onClick={fetchCompletedDeliveries} className="refresh-btn" disabled={loading}>
          ⟳ Refresh
        </button>
      </div>

      <div className="table-header" style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '1rem' }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search by Order ID or Transaction ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search delivery payments by Order ID or Transaction ID"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Matching Deliveries</h3>
          <p>No completed deliveries match your search.</p>
        </div>
      ) : (
        <div className="delivery-table-wrapper">
          <table className="delivery-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Marketplace/Custom Order</th>
                <th>Payment Method</th>
                <th>Delivered Date</th>
                <th>Delivery Cost/Charge</th>
                <th>Release</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((delivery) => (
                <tr key={delivery._id} className={delivery.isReleased ? 'released-row' : ''}>
                  <td className="order-id">
                    <span className="order-id-text">{delivery.orderId}</span>
                  </td>
                  <td className="order-type">
                    <span className={`order-type-badge ${delivery.orderType === 'Marketplace' ? 'marketplace' : 'custom'}`}>
                      <span className={`order-type-badge ${delivery.orderType === 'Marketplace' ? 'marketplace' : 'custom'}`}>
                      {delivery.orderType}
                    </span>
                    </span>
                  </td>
                  <td className="payment-method5">{delivery.paymentMethod}</td>
                  <td className="delivered-date">{formatDate(delivery.deliveredDate)}</td>
                  <td className="delivery-cost">
                    <span className="cost-amount">{formatCurrency(delivery.deliveryCost)}</span>
                  </td>
                  <td className="release-action">
                    {delivery.isReleased ? (
                      <span className="released-badge">Released</span>
                    ) : (
                      <button 
                        className="release-btn"
                        onClick={() => handleReleasePayment(delivery)}
                        disabled={processingReleaseId === delivery._id}
                      >
                        {processingReleaseId === delivery._id ? 'Releasing...' : 'Release'}
                      </button>
                    )}
                  </td>
                  <td className="transaction-id">
                    {delivery.transactionId ? (
                      <span className="transaction-id-text">{delivery.transactionId}</span>
                    ) : (
                      <span className="no-transaction">—</span>
                    )}
                  </td>
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
