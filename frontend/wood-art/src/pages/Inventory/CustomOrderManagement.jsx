import React, { useState, useEffect } from 'react';
import './CustomOrderManagement.css';

export default function CustomOrderManagement() {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [staffDesigners, setStaffDesigners] = useState([]);

  useEffect(() => {
    fetchCompletedOrders();
    fetchStaffDesigners();
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customOrder/completed');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setCompletedOrders(data.orders || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch completed orders');
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      setError(`Failed to fetch completed orders: ${error.message}`);
    }
  };

  const fetchStaffDesigners = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/staff-designer-salary/staff-designers');
      const data = await response.json();

      if (data.success) {
        setStaffDesigners(data.staffDesigners || []);
      }
    } catch (error) {
      console.error('Error fetching staff designers:', error);
    }
  };

  const filteredOrders = completedOrders.filter(order => {
    const matchesDate = dateFilter === '' || 
      new Date(order.updatedAt).toDateString() === new Date(dateFilter).toDateString();

    return matchesDate;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteOrder = async (orderId, customerName) => {
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the order for ${customerName}?\n\nOrder ID: ${orderId}\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/customOrder/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Order deleted successfully!');
        // Refresh the orders list
        fetchCompletedOrders();
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const getStaffDesignerInfo = (staffDesignerId) => {
    // If backend populated the user object directly
    if (staffDesignerId && typeof staffDesignerId === 'object') {
      const name = staffDesignerId.name || 'staff designer';
      const email = staffDesignerId.email || 'staff@gmail.com';
      return { name, email };
    }

    // If no staff designer assigned
    if (!staffDesignerId) {
      return { name: 'staff designer', email: 'staff@gmail.com' };
    }

    // Lookup from fetched staff designers list
    const designer = staffDesigners.find(d => String(d._id) === String(staffDesignerId));
    if (designer) {
      return {
        name: designer.name || 'staff designer',
        email: designer.email || 'staff@gmail.com'
      };
    }

    // Fallback default
    return { name: 'staff designer', email: 'staff@gmail.com' };
  };

  if (error) {
    return (
      <div className="custom-order-management">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Orders</h3>
          <p>{error}</p>
          <button onClick={fetchCompletedOrders} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-order-management">
      <div className="section-header">
        <h1 className="section-title2">Custom Order Management</h1>
        
      </div>

      <div className="filters-section">
        <div className="date-filter-container">
          <label className="date-filter-label" style={{ marginRight: '8px' }}>Filter date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-filter"
          />
          <span className="date-filter-text" style={{ marginLeft: '10px' }}>
            {dateFilter ? formatDate(dateFilter) : 'All'}
          </span>
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')}
              className="clear-date-btn"
              style={{ marginLeft: '10px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders-container">
          <div className="no-orders-icon">📦</div>
          <h3>No Completed Orders Found</h3>
          <p>
            {dateFilter 
              ? 'No orders match the selected date.' 
              : 'No completed custom orders available.'}
          </p>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Customer Email</th>
                <th>Staff Name</th>
                <th>Staff Email</th>
                <th>Board Details</th>
                <th>Completed Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id} className="order-row">
                  <td className="order-id">
                    <span className="order-id-text">{order.orderId}</span>
                  </td>
                  <td className="customer-name">
                    <div className="customer-name-text">{order.customerName}</div>
                  </td>
                  <td className="customer-email">
                    <div className="customer-email-text">{order.customerEmail}</div>
                  </td>
                  <td className="staff-name">
                    <div className="staff-name-text">{getStaffDesignerInfo(order.staffDesignerId).name}</div>
                  </td>
                  <td className="staff-email">
                    <div className="staff-email-text">{getStaffDesignerInfo(order.staffDesignerId).email}</div>
                  </td>
                  <td className="board-details">
                    <div className="board-info">
                      <div><strong>Color:</strong> {order.boardColor}</div>
                      <div><strong>Material:</strong> {order.material}</div>
                      <div><strong>Size:</strong> {order.boardSize}</div>
                      <div><strong>Thickness:</strong> {order.boardThickness}</div>
                    </div>
                  </td>
                  <td className="completed-date">
                    {formatDate(order.updatedAt)}
                  </td>
                  <td className="actions">
                    <div className="action-buttons">
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteOrder(order.orderId, order.customerName)}
                        title="Delete Order"
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
  );
}
