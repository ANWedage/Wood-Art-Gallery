import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Navbar.css';

export default function FinancialNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/', { replace: true }), 0);
  };

  return (
    <nav className="navbar financial-navbar">
      <div className="logo-section">
        <div className="financial-badge">FINANCIAL</div>
        <div className="logo-container">
          <img src={logo} alt="Wood Art Gallery Logo" className="financial-logo" />
        </div>
      </div>
      <div className="navbar-center">
        <h1 className="system-title">Financial Management System</h1>
      </div>
      <div className="navbar-right">
        <div className="user-greeting financial-greeting-highlight">
          <span>Welcome, {user && (user.name || user.email?.split('@')[0] || 'Financial Manager')}</span>
        </div>
        <button className="financial-logout" onClick={handleLogout}>LOGOUT</button>
      </div>
    </nav>
  );
}
