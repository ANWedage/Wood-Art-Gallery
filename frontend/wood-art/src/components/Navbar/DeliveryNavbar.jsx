import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Navbar.css';

export default function DeliveryNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/', { replace: true }), 0);
  };

  return (
    <nav className="navbar delivery-navbar">
      <div className="logo-section">
        <div className="delivery-badge">DELIVERY</div>
        <div className="logo-container">
          <img src={logo} alt="Wood Art Gallery Logo" className="delivery-logo" />
        </div>
      </div>
      <div className="navbar-center">
        <h1 className="system-title">Delivery Management System</h1>
      </div>
      <div className="navbar-right">
        <div className="user-greeting delivery-greeting-highlight">
          <span>Welcome, {user && (user.name || 'Delivery Partner')}</span>
        </div>
        <button className="delivery-logout" onClick={handleLogout}>LOGOUT</button>
      </div>
    </nav>
  );
}
