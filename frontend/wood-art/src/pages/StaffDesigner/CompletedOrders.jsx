import React, { useState, useMemo } from 'react';
import './CompletedOrders.css';

export default function CompletedOrders({ 
  completedOrders, 
  loading, 
  downloadImage, 
  notifyDelivery 
}) {
  const [search, setSearch] = useState('');
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return completedOrders;
    return completedOrders.filter((order) => {
      const orderId = (order.orderId || '').toString().toLowerCase();
      const mongoId = (order._id || '').toString().toLowerCase();
      const shortId = (order._id || '').toString().slice(-8).toLowerCase();
      return orderId.includes(q) || mongoId.includes(q) || shortId.includes(q);
    });
  }, [search, completedOrders]);

  return (
    <div className="completed-orders">
      <h1 className="staffdesigner-dashboard-title">Completed Orders</h1>
      
      {loading ? (
        <div className="loading-state">
          <p>Loading completed orders...</p>
        </div>
      ) : completedOrders.length === 0 ? (
        <div className="orders-placeholder">
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
            </svg>
            <p>No completed orders yet</p>
          </div>
        </div>
      ) : (
        <>
          <div className="orders-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search by Order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search completed orders by Order ID"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="orders-placeholder">
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                </svg>
                <p>No orders match that Order ID</p>
              </div>
            </div>
          ) : (
            <div className="orders-grid">
              {filteredOrders.map((order) => (
                <div key={order._id} className="order-card completed-order-card">
                  <div className="order-header">
                    <h3>Order {order.orderId || `#${order._id.slice(-8)}`}</h3>
                    <span className="order-status completed">{order.status}</span>
                  </div>
                  
                  <div className="customer-info">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> {order.customerName}</p>
                    <p><strong>Email:</strong> {order.customerEmail}</p>
                    {order.customerPhone && <p><strong>Phone:</strong> {order.customerPhone}</p>}
                  </div>
                  
                  <div className="order-specifications">
                    <h4>Specifications</h4>
                    <p><strong>Board Color:</strong> {order.boardColor}</p>
                    <p><strong>Material:</strong> {order.material}</p>
                    <p><strong>Size:</strong> {order.boardSize}</p>
                    <p><strong>Thickness:</strong> {order.boardThickness}</p>
                    {order.description && <p><strong>Description:</strong> {order.description}</p>}
                  </div>
                  
                  <div className="order-status-info">
                    <h4>Status Information</h4>
                    <p><strong>Delivery Status:</strong> <span className="status-badge delivery-status">{order.deliveryStatus ? order.deliveryStatus.replace('_', ' ').toUpperCase() : 'NOT ASSIGNED'}</span></p>
                  </div>
                  
                  <div className="order-image">
                    <h4>Reference Image</h4>
                    <div className="image-download-section">
                      <p>Original customer reference image.</p>
                      <button 
                        className="download-btn"
                        onClick={() => downloadImage(order.orderId || order._id)}
                      >
                        📁 Download Reference Image
                      </button>
                    </div>
                  </div>
                  
                  <div className="order-actions">
                    {(order.deliveryStatus === 'not_assigned' || !order.deliveryStatus) ? (
                      <button 
                        className="notify-btn"
                        onClick={() => notifyDelivery(order.orderId || order._id)}
                      >
                        🚚 Notify Delivery Team
                      </button>
                    ) : (
                      <div className="delivery-notified">
                        ✅ Delivery team notified - Ready for delivery
                      </div>
                    )}
                  </div>
                  
                  <div className="order-date">
                    <small>Completed: {new Date(order.updatedAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
