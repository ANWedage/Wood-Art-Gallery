import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Navbar.css';

export default function StaffDesignerNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/', { replace: true }), 0);
  };

  return (
    <nav className="navbar staffdesigner-navbar">
      <div className="logo-section">
        <div className="staffdesigner-badge">STAFF DESIGNER</div>
        <div className="logo-container">
          <img src={logo} alt="Wood Art Gallery Logo" className="staffdesigner-logo" />
        </div>
      </div>
      <div className="navbar-center">
        <h1 className="system-title">Staff Designer Workspace</h1>
      </div>
      <div className="navbar-right">
        <div className="user-greeting staffdesigner-greeting-highlight">
          <span>Welcome, {user && (user.name || user.email?.split('@')[0] || 'Staff Designer')}</span>
        </div>
        <button className="staffdesigner-logout" onClick={handleLogout}>LOGOUT</button>
      </div>
    </nav>
  );
}
