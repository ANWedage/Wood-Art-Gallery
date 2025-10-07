import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ReceivedMaterials.css';

export default function ReceivedMaterials() {
  const { user } = useAuth();
  const [receivedMaterials, setReceivedMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.email) {
      fetchReceivedMaterials();
    }
  }, [user]);

  const fetchReceivedMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stock releases filtered by current staff designer's email
      const response = await fetch(`http://localhost:5000/api/stock/releases?designerEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      if (data.success) {
        setReceivedMaterials(data.releases || []);
      } else {
        setError(data.message || 'Failed to fetch received materials');
      }
    } catch (error) {
      console.error('Error fetching received materials:', error);
      setError('Failed to fetch received materials');
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



  return (
    <div className="sd-received-materials">
      <div className="sd-received-materials-header">
        <h1 className="sd-dashboard-title">Received Materials</h1>
        <button 
          className="sd-refresh-btn"
          onClick={fetchReceivedMaterials}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>
      


      {loading && <div className="sd-loading-state">Loading received materials...</div>}
      {error && <div className="sd-error-state">{error}</div>}
      
      {!loading && !error && (
        <div className="sd-materials-content">
          {receivedMaterials.length === 0 ? (
            <div className="sd-empty-state">
              <div className="sd-empty-icon">📭</div>
              <h3>No Materials Received</h3>
              <p>No materials have been released to you yet. Materials released by the inventory team will appear here.</p>
            </div>
          ) : (
            <div className="sd-materials-table-wrapper">
              <table className="sd-materials-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Size</th>
                    <th>Thickness</th>
                    <th>Color</th>
                    <th>Quantity</th>
                    <th>Notes</th>
                    <th>Released Date</th>
                    <th>Released By</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedMaterials.map(material => (
                    <tr key={material._id} className="sd-material-row">
                      <td className="sd-material-cell">
                        <div className="sd-material-name">{material.material}</div>
                      </td>
                      <td className="sd-size-cell">{material.boardSize}</td>
                      <td className="sd-thickness-cell">{material.thickness}</td>
                      <td className="sd-color-cell"> {material.color} </td>
                      <td className="sd-quantity-cell">
                        {material.quantity}
                      </td>
                      <td className="sd-notes-cell">
                        {material.notes ? (
                          <div className="sd-notes-text" title={material.notes}>
                            {material.notes.length > 30 
                              ? `${material.notes.substring(0, 30)}...`
                              : material.notes
                            }
                          </div>
                        ) : (
                          <span className="sd-no-notes">—</span>
                        )}
                      </td>
                      <td className="sd-date-cell">
                        <div className="sd-date-info">
                          <div className="sd-date-main">{formatDate(material.releaseDate)}</div>
                        </div>
                      </td>
                      <td className="sd-released-by-cell">
                        <div className="sd-released-by-info">
                          <div className="sd-released-by-name">Inventory Manager</div>
                          
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
    </div>
  );
}
