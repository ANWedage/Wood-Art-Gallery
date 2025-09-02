import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, directLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', email, password);
    
    // First try direct login with predefined credentials
    const directResult = directLogin(email, password);
    console.log('Direct login result:', directResult);
    
    if (directResult.success) {
      setError('');
      const roleMap = {
        admin: '/admin',
        financial: '/financial',
        inventory: '/inventory',
        delivery: '/delivery',
        staffdesigner: '/staffdesigner',
        designer: '/designer',
        customer: '/customer'
      };
      const dashboardPath = roleMap[directResult.role] || '/customer';
      console.log('Navigating to:', dashboardPath);
      navigate(dashboardPath, { replace: true });
      if (onLogin) onLogin();
      return;
    }
    
    // If direct login fails, try regular API login
    const result = await login(email, password);
    if (result && result.success) {
      setError('');
      const userRole = result.role || (email.includes('delivery') ? 'delivery' : email.includes('staff') ? 'staffmember' : email.includes('designer') ? 'designer' : 'customer');
      const roleMap = {
        admin: '/admin',
        financial: '/financial',
        inventory: '/inventory',
        delivery: '/delivery',
        staffdesigner: '/staffdesigner',
        designer: '/designer',
        customer: '/customer'
      };
      const dashboardPath = roleMap[userRole] || '/customer';
      navigate(dashboardPath, { replace: true });
      if (onLogin) onLogin();
    } else {
      // Show error from either direct login or API login
      const errorMessage = directResult.message || (result && result.message) || 'Login failed';
      setError(errorMessage);
      setTimeout(() => {
        setError('');
        setEmail('');
        setPassword('');
      }, 3000);
    }
  };

  if (showRegister) {
    return <RegisterForm onRegister={() => setShowRegister(false)} />;
  }

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-title">WOOD ART GALLERY</h1>
        <p className="auth-subtitle">Laser-Cut Wood Masterpieces</p>
      
      <div className="auth-field-label">Email Address</div>
      <input 
        type="email" 
        placeholder="Enter your email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        required 
        className="auth-input"
      />
      
      <div className="auth-field-label">Password</div>
      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="auth-input"
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="show-password-btn"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </button>
      </div>
      
      
      
      <button type="submit" className="auth-submit-btn">Sign In</button>
      {error && <div className="auth-error">{error}</div>}
      
      <div className="auth-divider">
        <span>or</span>
      </div>
      
      <div className="auth-register">
        <span>Don't have an account? </span>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setShowRegister(true); }}
          className="auth-register-link"
        >
          Register
        </a>
      </div>
    </form>
    </div>
  );
}
