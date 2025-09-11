import React, { useState, useEffect } from 'react';
import StaffDesignerNavbar from '../../components/Navbar/StaffDesignerNavbar';
import StaffMenu from './StaffMenu';
import PendingOrders from './PendingOrders';
import AcceptedOrders from './AcceptedOrders';
import CompletedOrders from './CompletedOrders';
import SalaryInformation from './SalaryInformation';
import ProfileSection from './ProfileSection';
import './Dashboard.css';

export default function StaffDesignerDashboard() {
  const [activePage, setActivePage] = useState('menu');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (activePage === 'pending-orders') {
      fetchPendingOrders();
    } else if (activePage === 'accepted-orders') {
      fetchAcceptedOrders();
    } else if (activePage === 'completed-orders') {
      fetchCompletedOrders();
    }
  }, [activePage]);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/customOrder/pending');
      const data = await response.json();
      if (data.success) {
        setPendingOrders(data.orders);
      } else {
        console.error('Failed to fetch pending orders:', data.message);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/customOrder/accepted');
      const data = await response.json();
      if (data.success) {
        setAcceptedOrders(data.orders);
      } else {
        console.error('Failed to fetch accepted orders:', data.message);
      }
    } catch (error) {
      console.error('Error fetching accepted orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/customOrder/completed');
      const data = await response.json();
      if (data.success) {
        setCompletedOrders(data.orders);
      } else {
        console.error('Failed to fetch completed orders:', data.message);
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/customOrder/${orderId}/accept`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        alert('Order accepted successfully!');
        fetchPendingOrders(); // Refresh the pending orders list
        // If we're currently viewing accepted orders, refresh that list too
        if (activePage === 'accepted-orders') {
          fetchAcceptedOrders();
        }
      } else {
        alert('Failed to accept order: ' + data.message);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    }
  };

  const downloadImage = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/customOrder/${orderId}/download-image`);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert('Failed to download image: ' + errorData.message);
        return;
      }

      // Get the filename from the response headers or create a default one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${orderId}_reference_image`;
      
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/customOrder/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Order status updated to ${newStatus} successfully!`);
        // Refresh the appropriate views based on current page and status change
        if (activePage === 'accepted-orders') {
          fetchAcceptedOrders();
          // If completed, also refresh completed orders for immediate viewing
          if (newStatus === 'completed') {
            fetchCompletedOrders();
          }
        } else if (activePage === 'pending-orders') {
          fetchPendingOrders();
        } else if (activePage === 'completed-orders') {
          fetchCompletedOrders();
        }
      } else {
        alert('Failed to update order status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const notifyDelivery = async (orderId) => {
    try {
      console.log('Notifying delivery for order:', orderId);
      const confirmed = window.confirm('Are you sure you want to notify the delivery team about this completed order?');
      
      if (confirmed) {
        console.log('Sending notify delivery request...');
        const response = await fetch(`http://localhost:5000/api/customOrder/${orderId}/notify-delivery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          alert('Delivery team has been notified! The order will now appear in the delivery dashboard.');
          // Refresh the completed orders list
          fetchCompletedOrders();
        } else {
          alert('Failed to notify delivery team: ' + data.message);
        }
      }
    } catch (error) {
      console.error('Error notifying delivery:', error);
      alert('Failed to notify delivery team. Please try again.');
    }
  };

  const renderContent = () => {
    switch(activePage) {
      case 'menu':
        return <StaffMenu />;
      case 'pending-orders':
        return (
          <PendingOrders 
            pendingOrders={pendingOrders}
            loading={loading}
            downloadImage={downloadImage}
            acceptOrder={acceptOrder}
          />
        );
      case 'accepted-orders':
        return (
          <AcceptedOrders 
            acceptedOrders={acceptedOrders}
            loading={loading}
            downloadImage={downloadImage}
            updateOrderStatus={updateOrderStatus}
          />
        );
      case 'completed-orders':
        return (
          <CompletedOrders 
            completedOrders={completedOrders}
            loading={loading}
            downloadImage={downloadImage}
            notifyDelivery={notifyDelivery}
          />
        );
      case 'salary-information':
        return <SalaryInformation />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <StaffMenu />;
    }
  };

  return (
    <>
      <StaffDesignerNavbar />
      <div className="staffdesigner-dashboard-root">
        <aside className="staffdesigner-sidebar">
          <div className="sidebar-header">
            <h2>Staff Designer</h2>
          </div>
          <ul>
            <li className={activePage === 'menu' ? 'active' : ''} onClick={() => setActivePage('menu')}>
              <div className="menu-icon">🏠</div>
              <span>Menu</span>
            </li>
            <li className={activePage === 'pending-orders' ? 'active' : ''} onClick={() => setActivePage('pending-orders')}>
              <div className="menu-icon">⏳</div>
              <span>Pending Orders</span>
            </li>
            <li className={activePage === 'accepted-orders' ? 'active' : ''} onClick={() => setActivePage('accepted-orders')}>
              <div className="menu-icon">✅</div>
              <span>Accepted Orders</span>
            </li>
            <li className={activePage === 'completed-orders' ? 'active' : ''} onClick={() => setActivePage('completed-orders')}>
              <div className="menu-icon">🎯</div>
              <span>Completed Orders</span>
            </li>
            <li className={activePage === 'salary-information' ? 'active' : ''} onClick={() => setActivePage('salary-information')}>
              <div className="menu-icon">�</div>
              <span>Salary Information</span>
            </li>
            <li className={activePage === 'profile' ? 'active' : ''} onClick={() => setActivePage('profile')}>
              <div className="menu-icon">�</div>
              <span>Profile</span>
            </li>
          </ul>
        </aside>
        <main className="staffdesigner-dashboard-main">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
