import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './MyOrders.css';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notifyingDelivery, setNotifyingDelivery] = useState(null);

  useEffect(() => {
    fetchDesignerOrders();
  }, [user]);

  const fetchDesignerOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/orders/designer/${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching designer orders:', err);
      setError('Error fetching orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `Rs. ${parseFloat(price).toFixed(2)}`;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'preparing': return '#8b5cf6';
      case 'ready_for_delivery': return '#10b981';
      case 'delivered': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case 'not_assigned': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'picked_up': return '#8b5cf6';
      case 'in_transit': return '#10b981';
      case 'delivered': return '#059669';
      default: return '#6b7280';
    }
  };

  const handleNotifyDelivery = async (orderId) => {
    try {
      setNotifyingDelivery(orderId);

      const response = await fetch('http://localhost:5000/api/orders/notify-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          designerEmail: user.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Delivery team has been notified successfully!');
        // Refresh orders to show updated status
        fetchDesignerOrders();
      } else {
        alert(data.message || 'Failed to notify delivery team');
      }
    } catch (error) {
      console.error('Error notifying delivery:', error);
      alert('Error notifying delivery team. Please try again.');
    } finally {
      setNotifyingDelivery(null);
    }
  };

  if (loading) {
    return (
      <div className="my-orders-loading">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Orders</h3>
        <p>{error}</p>
        <button onClick={fetchDesignerOrders} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <div className="my-orders-header">
        <h1>My Orders</h1>
        <p>Manage orders for your designs</p>
        <button onClick={fetchDesignerOrders} className="refresh-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>When customers purchase your designs, orders will appear here.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <strong>Order #{order.orderId}</strong>
                </div>
                <div className="order-date">
                  {formatDate(order.orderDate)}
                </div>
              </div>

              <div className="customer-info">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> {order.customerName}</p>
                <p><strong>Email:</strong> {order.customerEmail}</p>
                {order.customerPhone && <p><strong>Phone:</strong> {order.customerPhone}</p>}
                {order.customerAddress && <p><strong>Address:</strong> {order.customerAddress}</p>}
              </div>

              <div className="order-items">
                <h4>Your Items</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <img 
                      src={`http://localhost:5000${item.imageUrl}`} 
                      alt={item.itemName}
                      className="item-image"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect width="60" height="60" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="item-details">
                      <h5>{item.itemName}</h5>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: {formatPrice(item.price)} each</p>
                      <p className="item-subtotal">Subtotal: {formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-summary">
                <div className="order-breakdown">
                  <div className="breakdown-line">
                    <span>Your Items Total:</span>
                    <span>{formatPrice(order.designerTotal)}</span>
                  </div>
                  {order.deliveryFee && (
                    <div className="breakdown-line">
                      <span>Delivery Fee:</span>
                      <span>{formatPrice(order.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="breakdown-line total-line">
                    <span><strong>Customer Total:</strong></span>
                    <span><strong>{formatPrice(order.designerTotal + (order.deliveryFee || 0))}</strong></span>
                  </div>
                </div>
                <div className="order-total">
                  <strong>Your Earnings: {formatPrice(order.designerTotal)}</strong>
                </div>
                <div className="payment-method">
                  Payment: {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}
                </div>
              </div>

              <div className="order-status">
                <div className="status-item">
                  <span className="status-label">Order Status:</span>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {order.paymentStatus && (
                  <div className="status-item">
                    <span className="status-label">Payment:</span>
                    <span 
                      className="status-badge" 
                      style={{ 
                        backgroundColor: order.paymentStatus === 'paid' ? '#4caf50' : 
                                       order.paymentStatus === 'failed' ? '#f44336' : '#ff9800' 
                      }}
                    >
                      {order.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="status-item">
                  <span className="status-label">Delivery Status:</span>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getDeliveryStatusColor(order.deliveryStatus) }}
                  >
                    {order.deliveryStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="order-actions">
                {order.status === 'confirmed' && order.deliveryStatus === 'not_assigned' && (
                  <button 
                    onClick={() => handleNotifyDelivery(order.orderId)}
                    disabled={notifyingDelivery === order.orderId}
                    className="notify-delivery-button"
                  >
                    {notifyingDelivery === order.orderId ? (
                      <>
                        <span className="button-spinner"></span>
                        Notifying...
                      </>
                    ) : (
                      <>
                        🚚 Notify Delivery
                      </>
                    )}
                  </button>
                )}
                {order.status === 'ready_for_delivery' && (
                  <div className="delivery-notified">
                    ✅ Delivery team notified
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="order-notes">
                  <h4>Notes</h4>
                  <p>{order.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
