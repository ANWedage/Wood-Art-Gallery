import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Navbar.css';

export default function AdminNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/', { replace: true }), 0);
  };

  return (
    <nav className="navbar admin-navbar">
      <div className="logo-section">
        <div className="admin-badge">ADMIN</div>
        <div className="logo-container">
          <img src={logo} alt="Wood Art Gallery Logo" className="admin-logo" />
        </div>
      </div>
      <div className="navbar-center">
        <h1 className="system-title">Admin Control Panel</h1>
      </div>
      <div className="navbar-right">
        <div className="user-greeting admin-greeting-highlight">
          <span>Welcome, {user && (user.name || user.email?.split('@')[0] || 'Admin')}</span>
        </div>
        <button className="admin-logout" onClick={handleLogout}>LOGOUT</button>
      </div>
    </nav>
  );
}
