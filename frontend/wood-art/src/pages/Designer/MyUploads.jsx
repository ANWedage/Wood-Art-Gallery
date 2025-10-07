import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import EditDesign from './EditDesign';
import './MyUploads.css';

const MyUploads = () => {
  const { user } = useContext(AuthContext);
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, design: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyUploads();
  }, []);

  const fetchMyUploads = async () => {
    if (!user || !user.email) {
      setError('Please log in to view your uploads');
      return;
    }

    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/design/my-uploads?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success) {
        setDesigns(data.designs);
      } else {
        setError(data.message || 'Failed to fetch uploads');
      }
    } catch (err) {
      console.error('Error fetching uploads:', err);
      setError('Error fetching your uploads. Please try again.');
    } finally {
      setRefreshing(false);
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

  const formatPrice = (price) => {
    return `Rs. ${parseFloat(price).toFixed(2)}`;
  };

  const handleEditDesign = (design) => {
    setSelectedDesign(design);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDesign(null);
  };

  const handleDesignUpdate = (updatedDesign) => {
    // Update the design in the local state
    setDesigns(prevDesigns => 
      prevDesigns.map(design => 
        design._id === updatedDesign._id ? updatedDesign : design
      )
    );
  };

  const handleDeleteConfirm = (design, e) => {
    e.stopPropagation(); // Prevent card click event
    setDeleteConfirm({ show: true, design });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, design: null });
  };

  const handleDeleteDesign = async () => {
    if (!deleteConfirm.design) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(
        `http://localhost:5000/api/design/delete/${deleteConfirm.design._id}?email=${encodeURIComponent(user.email)}`, 
        {
          method: 'DELETE'
        }
      );
      
      const result = await response.json();

      if (result.success) {
        // Remove the design from local state
        setDesigns(prevDesigns => 
          prevDesigns.filter(design => design._id !== deleteConfirm.design._id)
        );
        setDeleteConfirm({ show: false, design: null });
      } else {
        alert('Failed to delete design: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Error deleting design. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="my-uploads-container">
        <div className="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
          <p>{error}</p>
          <button onClick={fetchMyUploads} className="retry-button">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-uploads-container">
      <div className="uploads-header">
        <h1 className="uploads-title">My Uploads</h1>
        <div className="uploads-stats">
          <span className="upload-count">{designs.length} Design{designs.length !== 1 ? 's' : ''}</span>
          <button onClick={fetchMyUploads} className="refresh-button" disabled={refreshing}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className={refreshing ? 'spinning' : ''}>
              <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {designs.length === 0 ? (
        <div className="no-uploads">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
            <path d="M1.5 1A1.5 1.5 0 0 0 0 2.5v10A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 14.5 1h-13zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54A.5.5 0 0 1 1 12.5v-9a.5.5 0 0 1 .5-.5h13z"/>
          </svg>
          <h2>No Uploads Yet</h2>
          <p>You haven't uploaded any designs yet. Start by uploading your first design!</p>
        </div>
      ) : (
        <div className="uploads-grid">
          {designs.map((design) => (
            <div 
              key={design._id} 
              className="design-card"
              onClick={() => handleEditDesign(design)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEditDesign(design);
                }
              }}
            >
              <div className="design-image-container">
                <img 
                  src={`http://localhost:5000${design.imageUrl}`} 
                  alt={design.itemName}
                  className="design-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png'; // Fallback image
                  }}
                />
                <button 
                  className="delete-design-btn"
                  onClick={(e) => handleDeleteConfirm(design, e)}
                  title="Delete Design"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                </button>
              </div>
              
              <div className="design-content">
                <div className="design-title-section">
                  <h3 className="design-title">{design.itemName}</h3>
                  <span className="design-price-inline">{formatPrice(design.price)}</span>
                </div>
                <p className="design-description">{design.description}</p>
                
                <div className="design-specs">
                  <div className="spec-row">
                    <span className="spec-label">Material:</span>
                    <span className="spec-value">{design.material}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Size:</span>
                    <span className="spec-value">{design.boardSize}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Color:</span>
                    <span className="spec-value">{design.boardColor}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Thickness:</span>
                    <span className="spec-value">{design.boardThickness}</span>
                  </div>
                </div>

                <div className="design-meta">
                  <div className="design-quantity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
                    </svg>
                    Qty: {design.quantity}
                  </div>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm.show && deleteConfirm.design._id === design._id && (
                <div className="delete-confirmation">
                  <p>Are you sure you want to delete this design?</p>
                  <div className="confirm-buttons">
                    <button onClick={handleDeleteDesign} className="confirm-button">
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button onClick={handleDeleteCancel} className="cancel-button">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Design Modal */}
      {isEditModalOpen && selectedDesign && (
        <EditDesign 
          design={selectedDesign}
          onClose={handleCloseEditModal}
          onUpdate={handleDesignUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <h3>Confirm Delete</h3>
              <button 
                className="modal-close-btn"
                onClick={handleDeleteCancel}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
            <div className="delete-modal-content">
              <div className="delete-warning-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
              </div>
              <p>Are you sure you want to delete <strong>"{deleteConfirm.design?.itemName}"</strong>?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="delete-modal-actions">
              <button 
                className="delete-cancel-btn"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteDesign}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="delete-spinner"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyUploads;
