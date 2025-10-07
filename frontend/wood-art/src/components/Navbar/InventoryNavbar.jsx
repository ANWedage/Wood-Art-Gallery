import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Navbar.css';

export default function InventoryNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/', { replace: true }), 0);
  };

  return (
    <nav className="navbar inventory-navbar">
      <div className="logo-section">
        <div className="inventory-badge">INVENTORY</div>
        <div className="logo-container">
          <img src={logo} alt="Wood Art Gallery Logo" className="inventory-logo" />
        </div>
      </div>
      <div className="navbar-center">
        <h1 className="system-title">Inventory Management System</h1>
      </div>
      <div className="navbar-right">
        <div className="user-greeting inventory-greeting-highlight">
          <span>Welcome, {user && (user.name || user.email?.split('@')[0] || 'Inventory Manager')}</span>
        </div>
        <button className="inventory-logout" onClick={handleLogout}>LOGOUT</button>
      </div>
    </nav>
  );
}
