import React, { useState, useEffect } from 'react';
import './DesignerDetails.css';

export default function DesignerDetails() {
  const [designers, setDesigners] = useState([]);
  const [loadingDesigners, setLoadingDesigners] = useState(false);

  // Fetch designers data
  const fetchDesigners = async () => {
    setLoadingDesigners(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/designers');
      const data = await response.json();
      if (data.success) {
        setDesigners(data.designers);
      } else {
        console.error('Failed to fetch designers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching designers:', error);
    } finally {
      setLoadingDesigners(false);
    }
  };

  // Delete designer
  const deleteDesigner = async (designerId) => {
    if (window.confirm('Are you sure you want to delete this designer? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/designers/${designerId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          alert('Designer deleted successfully');
          fetchDesigners(); // Refresh the list
        } else {
          alert('Failed to delete designer: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting designer:', error);
        alert('Error deleting designer');
      }
    }
  };

  // Load designers on component mount
  useEffect(() => {
    fetchDesigners();
  }, []);

  return (
    <div className="designer-details-page">
      <h1 className="admin-dashboard-title">Designer Details</h1>
      <p className="section-description">View and manage marketplace designer information.</p>
      
      {loadingDesigners ? (
        <div className="loading">Loading designers...</div>
      ) : designers.length === 0 ? (
        <div className="no-data">
          <p>No designers found.</p>
        </div>
      ) : (
        <div className="designers-table-container">
          <table className="designers-table">
            <thead>
              <tr>
                <th>Designer Name</th>
                <th>Designer Email</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th>Total Uploads</th>
                <th className="ghost-col">Total Marketplace Orders</th>
                <th>Delete Designer</th>
              </tr>
            </thead>
            <tbody>
              {designers.map((designer, index) => (
                <tr key={designer._id || index}>
                  <td>{designer.name}</td>
                  <td>{designer.email}</td>
                  <td>{designer.phone || 'N/A'}</td>
                  <td>{designer.address || 'N/A'}</td>
                  <td>{designer.totalUploads || 0}</td>
                  <td className="ghost-col"></td>
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteDesigner(designer._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
