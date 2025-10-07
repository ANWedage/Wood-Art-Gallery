import homebanner from '../assets/homebanner.png'; 
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/Auth/LoginForm';
import './Home.css';
import logo from '../assets/logo.png';


export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // If user is logged in, redirect to their dashboard
    if (user) {
      console.log('User found in Home.jsx:', user);
      const roleMap = {
        admin: '/admin',
        financial: '/financial',
        inventory: '/inventory',
        delivery: '/delivery',
        staffdesigner: '/staffdesigner',
        designer: '/designer',
        customer: '/customer'
      };
      const dashboardPath = roleMap[user.role] || '/customer';
      console.log('Redirecting to:', dashboardPath);
      navigate(dashboardPath, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.state && location.state.openLogin) {
      setShowLogin(true);
    }
  }, [location.state]);

  return (
    <div className="home-root">
      <header className="home-header">
        <div className="home-logo-section">
          <div className="home-logo-container">
            <img src={logo} alt="Logo" className="home-logo" />
          </div>
        </div>
        
        <button
          className="home-login-btn"
          onClick={() => setShowLogin(true)}
        >
          LOGIN
        </button>
      </header>
      <div className="home-banner">
        <div className="home-banner-blur">
          <img src={homebanner} alt="Home Banner" className="home-banner-img" />
        </div>
        <h1 className="home-banner-title">The Best Place To Explore And Discover The Beauty Of Wood Arts...</h1>
      </div>
      {/* About Us Section */}
      <div className="about-us-section">
        <div className="about-us-logo">
          <img src={logo} alt="About Us Logo" />
        </div>
        <div className="about-us-content">
          <h2>About Us</h2>
          <p>
            "Laser-Crafted Wood Art — Made for You"
            Bring elegance and warmth to your space with Wood Art Gallery’s unique creations.
          </p>
          
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="contact-us-section">
        <div className="contact-us-content">
          <h2>Contact Us</h2>
          <ul className="contact-list">
            <li><strong>Call Us:</strong> <a href="tel:+94123456789">+94123456789</a></li>
            <li><strong>Email:</strong> <a href="mailto:info@sumarkwoodarts.com">info@woodartgallery.lk</a></li>
            <li><strong>Address:</strong> 123, Kaduwela, Colombo</li>
          </ul>
        </div>
        <div className="contact-us-logo">
          <img src={logo} alt="Contact Us Logo" />
        </div>
      </div>

      {showLogin && (
        <div className="home-login-modal" onClick={() => setShowLogin(false)}>
          <div onClick={e => e.stopPropagation()}>
            <LoginForm onLogin={() => setShowLogin(false)} />
          </div>
        </div>
      )}
      <footer className="home-footer">
        <span>
          Created By Wood Art Gallery | All Rights Reserved!
        </span>
      </footer>
    </div>
  );
}
