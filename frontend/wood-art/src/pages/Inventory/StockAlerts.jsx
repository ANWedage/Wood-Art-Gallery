import React from 'react';
import './StockAlerts.css';

export default function StockAlerts({
  stockItems,
  stockLoading,
  stockError,
  lowStockCount
}) {
  return (
    <div className="stock-alerts">
      <h1 className="inventory-dashboard-title2">Low Stock Alerts</h1>
      
      
      {stockLoading && <div className="loading-state">Loading low stock items...</div>}
      {stockError && <div className="error-state">{stockError}</div>}
      
      {!stockLoading && !stockError && (
        <div className="low-stock-content">
          <div className="alert-summary">
            <div className="alert-card">
              <h3>⚠️ Low Stock Items</h3>
              <p className="alert-count">{lowStockCount}</p>
            </div>
          </div>
          
          <div className="low-stock-table-wrapper">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Size</th>
                  <th>Thickness</th>
                  <th>Color</th>
                  <th>Available Quantity</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stockItems
                  .filter(item => item.availableQuantity <= item.reorderLevel)
                  .map(item => {
                    const isOutOfStock = item.availableQuantity === 0;
                    return (
                      <tr key={item._id} className={isOutOfStock ? 'out-of-stock' : 'low-stock'}>
                        <td>{item.material}</td>
                        <td>{item.boardSize}</td>
                        <td>{item.thickness}</td>
                        <td>{item.color}</td>
                        <td className="quantity-cell">{item.availableQuantity}</td>
                        <td>{item.reorderLevel}</td>
                        <td>
                          {isOutOfStock ? (
                            <span className="status-badge status-critical">Out of Stock</span>
                          ) : (
                            <span className="status-badge status-warning">Low Stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            
            {stockItems.filter(item => item.availableQuantity <= item.reorderLevel).length === 0 && (
              <div className="empty-state">
                <p>✅ All items are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
