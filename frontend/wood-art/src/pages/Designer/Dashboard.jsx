import React, { useState, useEffect } from 'react';
import DesignerNavbar from '../../components/Navbar/DesignerNavbar';
import ProfilePage from './ProfilePage';
import UploadDesign from './UploadDesign';
import MyUploads from './MyUploads';
import MyOrders from './MyOrders';
import PaymentHistory from './PaymentHistory';
import './Dashboard.css';

export default function DesignerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed when user logs in
  const [activePage, setActivePage] = useState('menu'); // Set default to 'menu'
  
  // Effect to store sidebar state in localStorage
  useEffect(() => {
    localStorage.setItem('designerSidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Load sidebar state from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem('designerSidebarOpen');
    if (savedState !== null) {
      setSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  const renderContent = () => {
    switch(activePage) {
      case 'menu':
        return <h1 className="designer-dashboard-title">Designer Menu</h1>;
      case 'upload':
        return <UploadDesign />;
      case 'my-uploads':
        return <MyUploads />;
      case 'my-orders':
        return <MyOrders />;
      case 'payment':
        return <PaymentHistory />;
      case 'profile':
        return <ProfilePage setActivePage={setActivePage} />;
      default:
        return <h1 className="designer-dashboard-title">Designer Menu</h1>;
    }
  };

  return (
    <>
      <DesignerNavbar />
      <div className="designer-dashboard-root">
        <aside className={`designer-sidebar${sidebarOpen ? '' : ' closed'}`}>
          <div className="sidebar-header">
            <span 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(prev => !prev)}
              title={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? '✕' : '☰'}
            </span>
          </div>
          <ul>
            <li className={activePage === 'menu' ? 'active' : ''} onClick={() => setActivePage('menu')}>
              <div className="menu-icon"><span role="img" aria-label="menu">🏠</span></div>
              <span>Menu</span>
            </li>
            <li className={activePage === 'upload' ? 'active' : ''} onClick={() => setActivePage('upload')}>
              <div className="menu-icon"><span role="img" aria-label="upload">⬆️</span></div>
              <span>Upload Designs</span>
            </li>
            <li className={activePage === 'my-uploads' ? 'active' : ''} onClick={() => setActivePage('my-uploads')}>
              <div className="menu-icon"><span role="img" aria-label="my-uploads">🖼️</span></div>
              <span>My Uploads</span>
            </li>
            <li className={activePage === 'my-orders' ? 'active' : ''} onClick={() => setActivePage('my-orders')}>
              <div className="menu-icon"><span role="img" aria-label="orders">📦</span></div>
              <span>My Orders</span>
            </li>
            <li className={activePage === 'payment' ? 'active' : ''} onClick={() => setActivePage('payment')}>
              <div className="menu-icon"><span role="img" aria-label="payment">💳</span></div>
              <span>Payment History</span>
            </li>
            <li className={activePage === 'profile' ? 'active' : ''} onClick={() => setActivePage('profile')}>
              <div className="menu-icon"><span role="img" aria-label="profile">👤</span></div>
              <span>Profile</span>
            </li>
          </ul>
        </aside>
        <main className="designer-dashboard-main">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
