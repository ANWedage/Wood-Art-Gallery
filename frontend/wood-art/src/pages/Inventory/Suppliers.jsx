import React from 'react';
import './Suppliers.css';

export default function Suppliers({
  suppliers,
  supplierLoading,
  supplierError,
  showSupplierModal,
  savingSupplier,
  editingSupplier,
  deletingSupplierId,
  supplierForm,
  showPOModal,
  currentSupplierPO,
  poForm,
  submittingPO,
  initialPOForm,
  loadSuppliers,
  openAddSupplier,
  openEditSupplier,
  deleteSupplier,
  closeSupplierModal,
  onSupplierChange,
  submitSupplier,
  openPOModal,
  closePOModal,
  onPOChange,
  submitPO
}) {
  return (
    <div className="raw-suppliers">
      <h1 className="inventory-dashboard-title2">Suppliers</h1>
      
      <div className="supplier-actions-bar">
        <button className="add-supplier-btn" onClick={openAddSupplier}>＋ Add Supplier</button>
        <button className="refresh-btn" onClick={loadSuppliers} disabled={supplierLoading}>↻</button>
      </div>
      {supplierLoading && <div className="loading-state">Loading suppliers...</div>}
      {supplierError && <div className="error-state">{supplierError}</div>}
      {!supplierLoading && !supplierError && suppliers.length===0 && <div className="empty-state"><p>No suppliers added.</p></div>}
      {!supplierLoading && !supplierError && suppliers.length>0 && (
        <div className="suppliers-table-wrapper">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Purchase</th>
                <th style={{width:'160px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s._id} className={deletingSupplierId===s._id ? 'deleting-row' : ''}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone}</td>
                  <td>{s.address}</td>
                  <td>
                    <button className="purchase-btn small" onClick={()=>openPOModal(s)}>Create PO</button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="edit-btn small" onClick={()=>openEditSupplier(s)}>Edit</button>
                      <button className="delete-btn small" disabled={deletingSupplierId===s._id} onClick={()=>deleteSupplier(s._id)}>{deletingSupplierId===s._id?'Deleting…':'Delete'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSupplierModal && (
        <div className="modal-overlay" onMouseDown={(e)=>{ if(e.target.classList.contains('modal-overlay')) closeSupplierModal(); }}>
          <div className="modal" onMouseDown={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSupplier? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="close-btn" onClick={closeSupplierModal} disabled={savingSupplier}>×</button>
            </div>
            <form onSubmit={submitSupplier} className="supplier-form">
              <div className="form-row">
                <label>Name</label>
                <input name="name" value={supplierForm.name} onChange={onSupplierChange} placeholder="Enter supplier name (letters only)" required />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input type="email" name="email" value={supplierForm.email} onChange={onSupplierChange} placeholder="Enter email address" required />
              </div>
              <div className="form-row">
                <label>Phone</label>
                <input name="phone" value={supplierForm.phone} onChange={onSupplierChange} placeholder="Enter 10-digit phone number" required />
              </div>
              <div className="form-row">
                <label>Address</label>
                <textarea name="address" value={supplierForm.address} onChange={onSupplierChange} required rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeSupplierModal} disabled={savingSupplier}>Cancel</button>
                <button type="submit" className="primary-btn3" disabled={savingSupplier}>{savingSupplier? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Create Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showPOModal && (
        <div className="modal-overlay" onMouseDown={(e)=>{ if(e.target.classList.contains('modal-overlay')) closePOModal(); }}>
          <div className="modal po-modal" onMouseDown={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Purchase Order {currentSupplierPO? ` - ${currentSupplierPO.name}`: ''}</h2>
              <button className="close-btn" onClick={closePOModal} disabled={submittingPO}>×</button>
            </div>
            <form className="po-form" onSubmit={submitPO}>
              <div className="po-grid">
                <div className="form-row">
                  <label>Item Name</label>
                  <select name="itemName" value={poForm.itemName} onChange={onPOChange} required>
                    <option value="" disabled>Select Item</option>
                    <option value="MDF">MDF</option>
                    <option value="HDF">HDF</option>
                    <option value="Mahogany">Mahogany</option>
                    <option value="Solid Wood">Solid Wood</option>
                    <option value="Plywood">Plywood</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Quantity</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    min="1" 
                    max="1000"
                    value={poForm.quantity} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value < 1) {
                        alert('Quantity must be at least 1');
                        return;
                      }
                      if (value > 1000) {
                        alert('Quantity cannot exceed 1000');
                        return;
                      }
                      onPOChange(e);
                    }}
                    placeholder="Enter quantity (1-1000)"
                    required 
                  />
                </div>
                <div className="form-row">
                  <label>Board Size</label>
                  <select name="boardSize" value={poForm.boardSize} onChange={onPOChange} required>
                    <option value="" disabled>Select Size</option>
                    <option value="6 x 4 inches">6 x 4 inches</option>
                    <option value="8 x 6 inches">8 x 6 inches</option>
                    <option value="12 x 8 inches">12 x 8 inches</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Thickness</label>
                  <select name="thickness" value={poForm.thickness} onChange={onPOChange} required>
                    <option value="" disabled>Select Thickness</option>
                    <option value="3mm-4mm">3mm-4mm</option>
                    <option value="5mm-6mm">5mm-6mm</option>
                    <option value="8mm-10mm">8mm-10mm</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Color</label>
                  <select name="color" value={poForm.color} onChange={onPOChange} required>
                    <option value="" disabled>Select Color</option>
                    <option value="brown">Brown</option>
                    <option value="blue">Blue</option>
                    <option value="tan">Tan</option>
                  </select>
                </div>
                <div className="price-info">
                  <div className="price-display">
                    <span className="price-label">Unit Price:</span>
                    <span className="price-value">Rs. {poForm.unitPrice || '-'}</span>
                  </div>
                  <div className="price-display">
                    <span className="price-label">Total Price:</span>
                    <span className="price-value total-price">Rs. {poForm.totalPrice || '-'}</span>
                  </div>
                </div>
                <div className="form-row full">
                  <label>Description (Optional)</label>
                  <textarea name="description" value={poForm.description} onChange={onPOChange} rows={3} placeholder="Extra notes..."></textarea>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closePOModal} disabled={submittingPO}>Cancel</button>
                <button type="submit" className="primary-btn2" disabled={submittingPO}>{submittingPO? 'Submitting...' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
