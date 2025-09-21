import React from 'react';
import './AcceptedOrders.css';

export default function AcceptedOrders({ 
  acceptedOrders, 
  loading, 
  downloadImage, 
  updateOrderStatus 
}) {
  return (
    <div className="accepted-orders">
      <h1 className="staffdesigner-dashboard-title">Accepted Orders</h1>
      
      {loading ? (
        <div className="loading-state">
          <p>Loading accepted orders...</p>
        </div>
      ) : acceptedOrders.length === 0 ? (
        <div className="orders-placeholder">
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
            <p>No accepted orders at the moment</p>
          </div>
        </div>
      ) : (
        <div className="orders-grid">
          {acceptedOrders.map((order) => (
            <div key={order._id} className="order-card accepted-order-card">
              <div className="order-header">
                <h3>Order {order.orderId || `#${order._id.slice(-8)}`}</h3>
                <span className="order-status accepted">{order.status}</span>
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
                <p><strong>Order Status:</strong> <span className="status-badge completed">{order.status}</span></p>
                <p><strong>Delivery Status:</strong> <span className="status-badge delivery-status">{order.deliveryStatus ? order.deliveryStatus.replace('_', ' ').toUpperCase() : 'NOT ASSIGNED'}</span></p>
              </div>
              
              <div className="order-image">
                <h4>Reference Image</h4>
                <div className="image-download-section">
                  <p>Customer reference image for this design.</p>
                  <button 
                    className="download-btn"
                    onClick={() => downloadImage(order.orderId || order._id)}
                  >
                    📁 Download Reference Image
                  </button>
                </div>
              </div>
              
              <div className="order-actions">
                <button 
                  className="complete-btn"
                  onClick={() => updateOrderStatus(order.orderId || order._id, 'completed')}
                >
                  Mark as Completed
                </button>
              </div>
              
              <div className="order-date">
                <small>Accepted: {new Date(order.updatedAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
