import React from 'react';
import './PurchaseOrders.css';

export default function PurchaseOrders({
  purchaseOrders,
  poLoading,
  poError,
  updatingPOId,
  deletingPOId,
  loadPurchaseOrders,
  updatePOStatus
}) {
  return (
    <div className="raw-purchase-orders">
      <div className="marketplace-header-row">
        <h1 className="inventory-dashboard-title2">Purchase Orders</h1>
        <button className="refresh-btn" onClick={loadPurchaseOrders} disabled={poLoading}>↻</button>
      </div>
      
      {poLoading && <div className="loading-state">Loading purchase orders...</div>}
      {poError && <div className="error-state">{poError}</div>}
      {!poLoading && !poError && purchaseOrders.length===0 && <div className="empty-state"><p>No purchase orders yet.</p></div>}
      {!poLoading && !poError && purchaseOrders.length>0 && (
        <div className="po-table-wrapper">
          <table className="po-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Supplier Email</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Size</th>
                <th>Color</th>
                <th>Thickness</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Received Date</th>
                <th style={{width:'120px'}}>Mark</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map(po => {
                const orderDate = new Date(po.createdAt).toLocaleDateString();
                const receivedDate = po.receivedAt ? new Date(po.receivedAt).toLocaleDateString() : '—';
                const canReceive = po.status !== 'received';
                return (
                  <tr key={po._id} className={deletingPOId===po._id? 'deleting-row':''}>
                    <td>{po.supplier?.name || '—'}</td>
                    <td>{po.supplier?.email || '—'}</td>
                    <td>{po.itemName}</td>
                    <td>{po.quantity}</td>
                    <td>{po.boardSize}</td>
                    <td>{po.color}</td>
                    <td>{po.thickness}</td>
                    <td>{orderDate}</td>
                    <td><span className={`status-badge status-${po.status}`}>{po.status}</span></td>
                    <td>{receivedDate}</td>
                    <td>
                      <div className="table-actions">
                        {canReceive ? (
                          <button className="edit-btn small" title="Mark as received" disabled={updatingPOId===po._id} onClick={()=>updatePOStatus(po._id, 'received')}>
                            {updatingPOId===po._id? '...' : 'Received'}
                          </button>
                        ) : (
                          <span className="status-complete">✔</span>
                        )}
                      </div>
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
