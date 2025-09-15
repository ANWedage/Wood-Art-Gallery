import React from 'react';
import './AvailableStock.css';

export default function AvailableStock({ 
  stockItems, 
  stockLoading, 
  stockError, 
  stockFilter,
  initializeStock,
  resetStock,
  loadStockItems,
  onStockFilterChange,
  setStockFilter,
  updateStockPrices
}) {
  return (
    <div className="raw-available">
      <div className="marketplace-header-row">
        <h1 className="inventory-dashboard-title">Available Stock</h1>
        <div className="header-actions">
          <button className="primary-btn" onClick={initializeStock}>Initialize Stock</button>
          <button className="secondary-btn" onClick={resetStock}>Reset Stock</button>
          <button className="secondary-btn" onClick={updateStockPrices} disabled={stockLoading}>Update Prices</button>
          <button className="refresh-btn" onClick={loadStockItems} disabled={stockLoading}>↻ Refresh</button>
        </div>
      </div>
      
      {/* Stock Filters */}
      <div className="stock-filters">
        <div className="filter-row">
          <select name="material" value={stockFilter.material} onChange={onStockFilterChange}>
            <option value="">All Materials</option>
            <option value="MDF">MDF</option>
            <option value="HDF">HDF</option>
            <option value="Mahogany">Mahogany</option>
            <option value="Solid Wood">Solid Wood</option>
            <option value="Plywood">Plywood</option>
          </select>
          
          <select name="boardSize" value={stockFilter.boardSize} onChange={onStockFilterChange}>
            <option value="">All Sizes</option>
            <option value="6 x 4 inches">6 x 4 inches</option>
            <option value="8 x 6 inches">8 x 6 inches</option>
            <option value="12 x 8 inches">12 x 8 inches</option>
          </select>
          
          <select name="thickness" value={stockFilter.thickness} onChange={onStockFilterChange}>
            <option value="">All Thickness</option>
            <option value="3mm-4mm">3mm-4mm</option>
            <option value="5mm-6mm">5mm-6mm</option>
            <option value="8mm-10mm">8mm-10mm</option>
          </select>
          
          <select name="color" value={stockFilter.color} onChange={onStockFilterChange}>
            <option value="">All Colors</option>
            <option value="brown">Brown</option>
            <option value="blue">Blue</option>
            <option value="tan">Tan</option>
          </select>
          
          <button className="secondary-btn" onClick={() => setStockFilter({material: '', boardSize: '', thickness: '', color: ''})}>
            Clear Filters
          </button>
        </div>
      </div>

      {stockLoading && <div className="loading-state">Loading stock...</div>}
      {stockError && <div className="error-state">{stockError}</div>}
      
      {!stockLoading && !stockError && stockItems.length === 0 && (
        <div className="empty-state">
          <p>No stock items found. Click "Initialize Stock" to create all 135 combinations.</p>
        </div>
      )}
      
      {!stockLoading && !stockError && stockItems.length > 0 && (
        <div className="stock-table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Size</th>
                <th>Thickness</th>
                <th>Color</th>
                <th>Price</th>
                <th>Available Quantity</th>
                <th>Re-order Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.map(item => {
                const isLowStock = item.availableQuantity <= item.reorderLevel;
                const isOutOfStock = item.availableQuantity === 0;
                return (
                  <tr key={item._id} className={isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}>
                    <td>{item.material}</td>
                    <td>{item.boardSize}</td>
                    <td>{item.thickness}</td>
                    <td>{item.color}</td>
                    <td className="price-cell">Rs. {item.price || 0}</td>
                    <td>{item.availableQuantity}</td>
                    <td>{item.reorderLevel}</td>
                    <td>
                      {isOutOfStock ? (
                        <span className="status-badge status-out">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="status-badge status-low">Low Stock</span>
                      ) : (
                        <span className="status-badge status-good">In Stock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="table-summary">
            <p>Showing {stockItems.length} combinations | Total Quantity: {stockItems.reduce((sum, item) => sum + item.availableQuantity, 0)} | Total Value: Rs. {stockItems.reduce((sum, item) => sum + ((item.price || 0) * item.availableQuantity), 0).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
