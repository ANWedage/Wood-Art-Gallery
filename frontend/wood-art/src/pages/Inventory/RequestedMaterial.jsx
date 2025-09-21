import React, { useState, useEffect } from 'react';
import './RequestedMaterial.css';

export default function RequestedMaterial() {
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteRequest = (request) => {
    setRequestToDelete(request);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;
    
    setDeletingId(requestToDelete._id);
    try {
      const response = await fetch(`http://localhost:5000/api/material-requests/${requestToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted request from the list
        setMaterialRequests(prev => prev.filter(req => req._id !== requestToDelete._id));
        console.log('Material request deleted successfully:', requestToDelete._id);
      } else {
        setError(data.message || 'Failed to delete material request');
      }
    } catch (error) {
      console.error('Error deleting material request:', error);
      setError('Failed to delete material request');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
      setRequestToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setRequestToDelete(null);
  };

  return (
    <div className="inv-requested-material">
      <div className="inv-requested-material-header">
        <h1 className="inv-inventory-dashboard-title2">Requested Material</h1>
        <button 
          className="inv-refresh-btn"
          onClick={fetchMaterialRequests}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>
      
   

      {loading && <div className="inv-loading-state">Loading material requests...</div>}
      {error && <div className="inv-error-state">{error}</div>}
      
      {!loading && !error && (
        <div className="inv-requests-content">
          {materialRequests.length === 0 ? (
            <div className="inv-empty-state">
              <div className="inv-empty-icon">📋</div>
              <h3>No Material Requests</h3>
              <p>No material requests have been submitted yet.</p>
            </div>
          ) : (
            <div className="inv-requests-table-wrapper">
              <table className="inv-requests-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Staff Designer</th>
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
                    <tr key={request._id} className="inv-request-row">
                      <td className="inv-request-id">
                        <span className="inv-request-id-text">
                          {request._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="inv-staff-info">
                        <div className="inv-staff-name">{request.staffDesignerName}</div>
                        <div className="inv-staff-email">{request.staffDesignerEmail}</div>
                      </td>
                      <td className="inv-material-cell">{request.material}</td>
                      <td className="inv-size-cell">{request.boardSize}</td>
                      <td className="inv-thickness-cell">{request.thickness}</td>
                      <td className="inv-color-cell">
                        {request.color}
                      </td>
                      <td className="inv-quantity-cell">
                        {request.quantity}
                      </td>
                      <td className="inv-description-cell">
                        {request.description ? (
                          <div className="inv-description-text" title={request.description}>
                            {request.description.length > 50 
                              ? `${request.description.substring(0, 50)}...`
                              : request.description
                            }
                          </div>
                        ) : (
                          <span className="inv-no-description">—</span>
                        )}
                      </td>
                      <td className="inv-date-cell">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="inv-actions-cell">
                        <button
                          className="inv-delete-btn"
                          onClick={() => handleDeleteRequest(request)}
                          disabled={deletingId === request._id}
                          title="Delete Request"
                        >
                          {deletingId === request._id ? (
                            <span className="inv-btn-loading">⏳</span>
                          ) : (
                            <span className="inv-btn-icon">🗑️</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="inv-modal-overlay">
          <div className="inv-modal-content">
            <div className="inv-modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="inv-modal-body">
              <p>Are you sure you want to delete this material request?</p>
              {requestToDelete && (
                <div className="inv-request-details">
                  <strong>Request ID:</strong> {requestToDelete._id.slice(-8).toUpperCase()}<br/>
                  <strong>Staff Designer:</strong> {requestToDelete.staffDesignerName}<br/>
                  <strong>Material:</strong> {requestToDelete.material}<br/>
                  <strong>Quantity:</strong> {requestToDelete.quantity}
                </div>
              )}
              <p className="inv-warning-text">This action cannot be undone.</p>
            </div>
            <div className="inv-modal-actions">
              <button 
                className="inv-cancel-btn"
                onClick={cancelDelete}
                disabled={deletingId}
              >
                Cancel
              </button>
              <button 
                className="inv-confirm-delete-btn"
                onClick={confirmDelete}
                disabled={deletingId}
              >
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
