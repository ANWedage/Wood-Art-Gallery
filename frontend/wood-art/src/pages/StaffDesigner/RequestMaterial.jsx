import React, { useState, useEffect } from 'react';
import './RequestMaterial.css';

export default function RequestMaterial() {
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const initialRequestForm = {
    material: '',
    boardSize: '',
    thickness: '',
    color: '',
    quantity: '',
    description: ''
  };
  
  const [requestForm, setRequestForm] = useState(initialRequestForm);

  useEffect(() => {
    fetchMaterialRequests();
  }, []);

  const fetchMaterialRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/material-requests');
      const data = await response.json();
      if (data.success) {
        setMaterialRequests(data.requests || []);
      } else {
        setError(data.message || 'Failed to fetch material requests');
      }
    } catch (error) {
      console.error('Error fetching material requests:', error);
      setError('Failed to fetch material requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!requestForm.material || !requestForm.boardSize || !requestForm.thickness || 
        !requestForm.color || !requestForm.quantity) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (requestForm.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (requestForm.quantity > 100) {
      alert('Quantity cannot exceed 100');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingRequest 
        ? `http://localhost:5000/api/material-requests/${editingRequest._id}`
        : 'http://localhost:5000/api/material-requests';
      
      const method = editingRequest ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingRequest ? 'Request updated successfully!' : 'Material request submitted successfully!');
        setRequestForm(initialRequestForm);
        setShowRequestModal(false);
        setEditingRequest(null);
        fetchMaterialRequests();
      } else {
        alert('Error: ' + (data.message || 'Failed to process request'));
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setRequestForm({
      material: request.material,
      boardSize: request.boardSize,
      thickness: request.thickness,
      color: request.color,
      quantity: request.quantity,
      description: request.description || ''
    });
    setShowRequestModal(true);
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this material request?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/material-requests/${requestId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Request deleted successfully!');
        fetchMaterialRequests();
      } else {
        alert('Error: ' + (data.message || 'Failed to delete request'));
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };

  const openNewRequestModal = () => {
    setEditingRequest(null);
    setRequestForm(initialRequestForm);
    setShowRequestModal(true);
  };

  const closeModal = () => {
    if (!submitting) {
      setShowRequestModal(false);
      setEditingRequest(null);
      setRequestForm(initialRequestForm);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="request-material">
      <div className="request-material-header">
        <h1 className="section-title23">Request Material</h1>
        <button 
          className="request-btn"
          onClick={openNewRequestModal}
        >
          Request
        </button>
      </div>

      {loading && <div className="loading-state">Loading material requests...</div>}
      {error && <div className="error-state">{error}</div>}
      
      {!loading && !error && (
        <div className="requests-content">
          {materialRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Material Requests</h3>
              <p>You haven't submitted any material requests yet.</p>
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Size</th>
                    <th>Thickness</th>
                    <th>Color</th>
                    <th>Quantity</th>
                    <th>Description</th>
                    <th>Request Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materialRequests.map(request => (
                    <tr key={request._id}>
                      <td>{request.material}</td>
                      <td>{request.boardSize}</td>
                      <td>{request.thickness}</td>
                      <td>{request.color}</td>
                      <td>{request.quantity}</td>
                      <td>{request.description || '—'}</td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEdit(request)}
                            title="Edit Request"
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(request._id)}
                            title="Delete Request"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Material Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRequest ? 'Edit Material Request' : 'Material Request'}</h2>
              <button className="close-modal-btn" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="request-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Material *</label>
                  <select
                    value={requestForm.material}
                    onChange={(e) => setRequestForm({...requestForm, material: e.target.value})}
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
                    value={requestForm.boardSize}
                    onChange={(e) => setRequestForm({...requestForm, boardSize: e.target.value})}
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
                    value={requestForm.thickness}
                    onChange={(e) => setRequestForm({...requestForm, thickness: e.target.value})}
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
                    value={requestForm.color}
                    onChange={(e) => setRequestForm({...requestForm, color: e.target.value})}
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
                  <label>Quantity * (Max: 100)</label>
                  <input
                    type="number"
                    value={requestForm.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 100)) {
                        setRequestForm({...requestForm, quantity: value});
                      }
                    }}
                    required
                    min="1"
                    max="100"
                    placeholder="Enter quantity (1-100)"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Additional Description</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                  placeholder="Describe your material requirements in detail..."
                  rows="4"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : (editingRequest ? 'Update Request' : 'Submit Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
