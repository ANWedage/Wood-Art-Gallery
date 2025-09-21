import React from 'react';
import './StaffMenu.css';

export default function StaffMenu({ setActivePage }) {
  return (
    <div className="staff-menu-hero">
      <div className="hero-background">
        <div className="custom-pattern"></div>
        <div className="wood-texture"></div>
      </div>
      <div className="hero-content">
        <div className="hero-header">
          <div className="craft-beam-effect"></div>
          <h1 className="hero-title">
            <span className="title-line-1">Custom Order</span>
            <span className="title-line-2">Craft Studio</span>
          </h1>
          <div className="craft-beam-effect reverse"></div>
        </div>
        
        <div className="hero-description">
          <div className="description-card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3>Bespoke Design Creation</h3>
            <p>Transform customer visions into reality with precision craftsmanship. Each custom order is a unique masterpiece waiting to be brought to life through expert design skills.</p>
          </div>
          
          <div className="description-card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3>Order Management</h3>
            <p>Efficiently manage your workflow from pending requests to completed masterpieces. Track progress, manage timelines, and ensure customer satisfaction every step of the way.</p>
          </div>
          
          <div className="description-card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3>Quality Craftsmanship</h3>
            <p>Maintain the highest standards of quality with premium materials and expert techniques. Every custom order reflects professional excellence and artistic innovation.</p>
          </div>
        </div>
        
        <div className="hero-actions">
          <button 
            className="action-btn primary"
            onClick={() => setActivePage && setActivePage('pending-orders')}
          >
            <span className="btn-icon">⏳</span>
            View Pending Orders
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => setActivePage && setActivePage('accepted-orders')}
          >
            <span className="btn-icon">🎨</span>
            Active Projects
          </button>
        </div>
        
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">∞</div>
            <div className="stat-label">Design Possibilities</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Custom Solutions</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Order Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
