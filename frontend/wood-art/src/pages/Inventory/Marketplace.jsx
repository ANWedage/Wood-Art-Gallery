import React from 'react';
import './Marketplace.css';

export default function Marketplace({ 
  marketItems, 
  marketLoading, 
  marketError, 
  deletingId, 
  loadMarketplaceItems, 
  deleteMarketplaceItem, 
  formatItemCode 
}) {
  return (
    <div className="marketplace">
      <div className="marketplace-header-row">
        <h1 className="inventory-dashboard-title2">Marketplace Item Management</h1>
        <button className="refresh-btn" onClick={loadMarketplaceItems} disabled={marketLoading}>↻ Refresh</button>
      </div>
      
      {marketLoading && <div className="loading-state">Loading items...</div>}
      {marketError && <div className="error-state">{marketError}</div>}
      {!marketLoading && !marketError && marketItems.length === 0 && (
        <div className="empty-state"><p>No marketplace items.</p></div>
      )}
      {!marketLoading && !marketError && marketItems.length > 0 && (
        <div className="marketplace-table-wrapper">
          <table className="marketplace-table">
            <thead>
              <tr>
                <th style={{width:'90px'}}>Image</th>
                <th className="item-code-head">Item Code</th>
                <th>Item Name</th>
                <th>Designer</th>
                <th>Designer Email</th>
                <th>Specifications</th>
                <th>Price</th>
                <th>Stock</th>
                <th style={{width:'110px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marketItems.map(item => {
                const specs = [item.material, item.boardColor, item.boardThickness, item.boardSize].filter(Boolean);
                return (
                  <tr key={item._id} className={deletingId===item._id ? 'deleting-row' : ''}>
                    <td>
                      <div className="thumb-cell">
                        <img className="market-thumb" src={`http://localhost:5000${item.imageUrl}`} alt={item.itemName} onError={(e)=>{e.currentTarget.src='';}} />
                      </div>
                    </td>
                    <td className="item-code-cell">{formatItemCode(item)}</td>
                    <td>
                      <div className="name-cell">
                        <div className="item-name">{item.itemName}</div>
                      </div>
                    </td>
                    <td>{item.designerId?.name || 'Unknown'}</td>
                    <td>{item.designerId?.email || '—'}</td>
                    <td>
                      <div className="spec-badges">
                        {specs.map((s,i)=>(<span key={i}>{s}</span>))}
                      </div>
                    </td>
                    <td><span className="price-tag">Rs. {Number(item.price).toLocaleString()}</span></td>
                    <td>{item.quantity}</td>
                    <td>
                      <button className="delete-btn small" onClick={()=>deleteMarketplaceItem(item._id)} disabled={deletingId===item._id}>
                        {deletingId===item._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
