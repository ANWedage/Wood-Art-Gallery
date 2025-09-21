import React, { useState, useEffect } from 'react';
import './CustomerDetails.css';

export default function CustomerDetails() {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Fetch customers data
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/customers');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      } else {
        console.error('Failed to fetch customers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/customers/${customerId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          alert('Customer deleted successfully');
          fetchCustomers(); // Refresh the list
        } else {
          alert('Failed to delete customer: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer');
      }
    }
  };

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="customer-details">
      <h1 className="admin-dashboard-title">Customer Details</h1>
      <p className="section-description">Manage and review customer profiles and activity.</p>
      
      {loadingCustomers ? (
        <div className="loading">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="no-data">
          <p>No customers found.</p>
        </div>
      ) : (
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Customer Email</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th>Total Custom Orders</th>
                <th>Total Marketplace Orders</th>
                <th>Delete Customer</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer._id || index}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || 'N/A'}</td>
                  <td>{customer.address || 'N/A'}</td>
                  <td>{customer.totalCustomOrders || 0}</td>
                  <td>{customer.totalMarketplaceOrders || 0}</td>
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteCustomer(customer._id)}
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
