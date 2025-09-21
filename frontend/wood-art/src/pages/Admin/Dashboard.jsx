import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../components/Navbar/AdminNavbar';
import CustomerDetails from './CustomerDetails';
import DesignerDetails from './DesignerDetails';
import './Dashboard.css';

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState('overview');

  const renderContent = () => {
    switch(activePage) {
      case 'overview':
        return (
          <div className="admin-overview">
            <h1 className="admin-dashboard-title">Overview</h1>
            <p>Quick overview of the system and key metrics.</p>
          </div>
        );
      case 'customer-details':
        return <CustomerDetails />;
      case 'designer-details':
        return <DesignerDetails />;
      default:
        return (
          <div className="admin-overview">
            <h1 className="admin-dashboard-title">Overview</h1>
          </div>
        );
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="admin-dashboard-root">
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h2>Admin Control Panel</h2>
          </div>
          <ul>
            <li className={activePage === 'overview' ? 'active' : ''} onClick={() => setActivePage('overview')}>
              <div className="menu-icon">📊</div>
              <span>Overview</span>
            </li>
            <li className={activePage === 'customer-details' ? 'active' : ''} onClick={() => setActivePage('customer-details')}>
              <div className="menu-icon">👥</div>
              <span>Customer Details</span>
            </li>
            <li className={activePage === 'designer-details' ? 'active' : ''} onClick={() => setActivePage('designer-details')}>
              <div className="menu-icon">👨‍🎨</div>
              <span>Designer Details</span>
            </li>
          </ul>
        </aside>
        <main className="admin-dashboard-main">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
