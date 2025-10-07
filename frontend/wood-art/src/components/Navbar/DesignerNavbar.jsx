import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Navbar.css';

export default function DesignerNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/', { replace: true }), 0);
  };
  return (
    <nav className="navbar designer-navbar">
      <div className="logo-section">
        <div className="logo-container">
          <img src={logo} alt="Wood Art Gallery Logo" className="designer-logo" />
        </div>
      </div>
      <div className="navbar-right">
        <div className="user-greeting designer-greeting-highlight">
          {user && <span>Hello, {user.name || user.email?.split('@')[0] || 'Designer'}</span>}
        </div>
        <button className="designer-logout" onClick={handleLogout}>LOGOUT</button>
      </div>
    </nav>
  );
}
