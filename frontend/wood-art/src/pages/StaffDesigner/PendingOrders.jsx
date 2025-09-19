import React from 'react';
import './PendingOrders.css';

export default function PendingOrders({ 
  loading, 
  pendingOrders, 
  downloadImage, 
  acceptOrder 
}) {
  return (
    <div className="pending-orders">
      <h1 className="staffdesigner-dashboard-title">Pending Custom Orders</h1>
      
      {loading ? (
        <div className="loading-state">
          <p>Loading pending orders...</p>
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="orders-placeholder">
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
            <p>No pending orders at the moment</p>
          </div>
        </div>
      ) : (
        <div className="orders-grid">
          {pendingOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <h3>Order {order.orderId || `#${order._id.slice(-8)}`}</h3>
                <span className="order-status">{order.status}</span>
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
                  <p>Customer has uploaded a reference image for this design.</p>
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
                  className="accept-btn"
                  onClick={() => acceptOrder(order.orderId || order._id)}
                >
                  Accept Order
                </button>
              </div>
              
              <div className="order-date">
                <small>Submitted: {new Date(order.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
