import React from 'react';
import './InventoryOverview.css';

export default function InventoryOverview({ stockSummary }) {
  return (
    <div className="inventory-overview">
      <h1 className="inventory-dashboard-title">Inventory Overview</h1>
      <div className="overview-stats">
        <div className="stat-card">
          <h3>Total Combinations</h3>
          <p className="stat-number">{stockSummary.totalCombinations || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Low Stock Items</h3>
          <p className="stat-number">{stockSummary.lowStockItems || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Out of Stock</h3>
          <p className="stat-number">{stockSummary.outOfStockItems || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Quantity</h3>
          <p className="stat-number">{stockSummary.totalQuantity || 0}</p>
        </div>
      </div>
    </div>
  );
}
