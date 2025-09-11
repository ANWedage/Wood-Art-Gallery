import React from 'react';
import './StockRelease.css';

export default function StockRelease({
  stockReleases,
  releaseLoading,
  releaseError,
  showReleaseModal,
  submittingRelease,
  releaseForm,
  setShowReleaseModal,
  setReleaseForm,
  handleReleaseSubmit
}) {
  return (
    <div className="raw-stock-release">
      <h1 className="inventory-dashboard-title">Stock Release</h1>
      <p className="section-description">Record stock releases to staff designers.</p>
      
      {releaseLoading && <div className="loading-state">Loading stock releases...</div>}
      {releaseError && <div className="error-state">{releaseError}</div>}
      
      {!releaseLoading && !releaseError && (
        <div className="stock-release-content">
          <div className="stock-release-table-wrapper">
            <table className="stock-release-table">
              <thead>
                <tr>
                  <th>Designer Name</th>
                  <th>Designer Email</th>
                  <th>Material</th>
                  <th>Size</th>
                  <th>Thickness</th>
                  <th>Color</th>
                  <th>Quantity</th>
                  <th>Release Date</th>
                </tr>
              </thead>
              <tbody>
                {stockReleases.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: '#666' }}>
                      No stock releases recorded yet.
                    </td>
                  </tr>
                ) : (
                  stockReleases.map(release => (
                    <tr key={release._id}>
                      <td>{release.designerName}</td>
                      <td>{release.designerEmail}</td>
                      <td>{release.material}</td>
                      <td>{release.boardSize}</td>
                      <td>{release.thickness}</td>
                      <td>{release.color}</td>
                      <td>{release.quantity}</td>
                      <td>{new Date(release.releaseDate).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="release-button-container">
            <button 
              className="release-stock-btn"
              onClick={() => setShowReleaseModal(true)}
            >
              Release Stock
            </button>
          </div>
        </div>
      )}
      
      {/* Stock Release Modal */}
      {showReleaseModal && (
        <div className="modal-overlay" onClick={() => setShowReleaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Release Stock to Designer</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowReleaseModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleReleaseSubmit} className="release-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Designer Name *</label>
                  <input
                    type="text"
                    value={releaseForm.designerName}
                    onChange={(e) => setReleaseForm({...releaseForm, designerName: e.target.value})}
                    required
                    placeholder="Staff Designer"
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Designer Email *</label>
                  <input
                    type="email"
                    value={releaseForm.designerEmail}
                    onChange={(e) => setReleaseForm({...releaseForm, designerEmail: e.target.value})}
                    required
                    placeholder="staff@gmail.com"
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Material *</label>
                  <select
                    value={releaseForm.material}
                    onChange={(e) => setReleaseForm({...releaseForm, material: e.target.value})}
                    required
                  >
                    <option value="">Select Material</option>
                    <option value="MDF">MDF</option>
                    <option value="HDF">HDF</option>
                    <option value="Mahogany">Mahogany</option>
                    <option value="Solid Wood">Solid Wood</option>
                    <option value="Plywood">Plywood</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Size *</label>
                  <select
                    value={releaseForm.boardSize}
                    onChange={(e) => setReleaseForm({...releaseForm, boardSize: e.target.value})}
                    required
                  >
                    <option value="">Select Size</option>
                    <option value="6 x 4 inches">6 x 4 inches</option>
                    <option value="8 x 6 inches">8 x 6 inches</option>
                    <option value="12 x 8 inches">12 x 8 inches</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Thickness *</label>
                  <select
                    value={releaseForm.thickness}
                    onChange={(e) => setReleaseForm({...releaseForm, thickness: e.target.value})}
                    required
                  >
                    <option value="">Select Thickness</option>
                    <option value="3mm-4mm">3mm-4mm</option>
                    <option value="5mm-6mm">5mm-6mm</option>
                    <option value="8mm-10mm">8mm-10mm</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color *</label>
                  <select
                    value={releaseForm.color}
                    onChange={(e) => setReleaseForm({...releaseForm, color: e.target.value})}
                    required
                  >
                    <option value="">Select Color</option>
                    <option value="brown">Brown</option>
                    <option value="blue">Blue</option>
                    <option value="tan">Tan</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={releaseForm.quantity}
                    onChange={(e) => setReleaseForm({...releaseForm, quantity: e.target.value})}
                    required
                    min="1"
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <input
                    type="text"
                    value={releaseForm.notes || ''}
                    onChange={(e) => setReleaseForm({...releaseForm, notes: e.target.value})}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowReleaseModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submittingRelease}
                >
                  {submittingRelease ? 'Releasing...' : 'Release Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
