import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../../assets/logo.png';

export default function CustomerNavbar({ search, setSearch }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/', { replace: true }), 0);
  };
  return (
    <nav className="navbar customer-navbar">
      <div className="logo-section">
        <div className="logo-container">
          <img src={logo} alt="Wood Art Gallery Logo" className="customer-logo" />
        </div>
      </div>
      <div className="navbar-search-center">
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search for wooden items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="navbar-search-input"
          />
          {search && (
            <span className="clear-search" onClick={() => setSearch('')}>×</span>
          )}
        </div>
      </div>
      <div className="navbar-right">
        <div className="user-greeting customer-greeting-highlight">
          {user && <span>Hello, {user.name || user.email?.split('@')[0] || 'Customer'}</span>}
        </div>
        <button className="customer-logout" onClick={handleLogout}>LOGOUT</button>
      </div>
    </nav>
  );
}
