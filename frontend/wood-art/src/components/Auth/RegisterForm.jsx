import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function RegisterForm({ onRegister }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Phone number validation
    if (phone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      setTimeout(() => setError(''), 3000);
      return;
    }
    // Password match check
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }
    // Password length check
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }
    // Strong password check: at least 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
    if (!strongRegex.test(password)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const result = await register(email, password, role, name, address, phone);
    if (result && result.success) {
      setError('');
      setSuccessMessage(result.message || 'Registration successful! Please check your email for login credentials.');
      
      // Clear form fields
      setName('');
      setAddress('');
      setPhone('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('customer');
      
      // Switch back to login form after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
        if (onRegister) onRegister();
      }, 3000);
    } else if (result && result.message) {
      setError(result.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="auth-form-container register-form-container">
      <form className="auth-form register-form" onSubmit={handleSubmit}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Wood Art Gallery</p>
      
      <div className="register-form-grid">
        <div>
          <div className="auth-field-label">Full Name</div>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => {
              // Only allow letters, spaces, and basic punctuation
              const val = e.target.value.replace(/[^a-zA-Z\s'.-]/g, '');
              setName(val);
            }}
            required
            className="auth-input"
          />
        </div>
        
        <div>
          <div className="auth-field-label">Email Address</div>
          <input 
            type="email" 
            placeholder="Your email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            className="auth-input" 
          />
        </div>
        
        <div>
          <div className="auth-field-label">Phone Number</div>
          <input
            type="text"
            placeholder="Your phone (10 digits)"
            value={phone}
            onChange={e => {
              // Only allow numbers and limit to 10 digits
              const val = e.target.value.replace(/[^0-9]/g, '').substring(0, 10);
              setPhone(val);
            }}
            maxLength={10}
            minLength={10}
            required
            className="auth-input"
          />
          {phone && phone.length < 10 && (
            <div className="input-hint">Phone number must be 10 digits</div>
          )}
        </div>
        
        <div>
          <div className="auth-field-label">Address</div>
          <input 
            type="text" 
            placeholder="Your address" 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            required 
            className="auth-input" 
          />
        </div>
      </div>
      
      <div className="register-form-grid">
        <div>
          <div className="auth-field-label">Password</div>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div>
          <div className="auth-field-label">Confirm Password</div>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="auth-input"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(v => !v)}
              className="show-password-btn"
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="auth-field-label">Account Type</div>
      <select 
        value={role} 
        onChange={e => setRole(e.target.value)}
        className="auth-input"
      >
        <option value="customer">Customer</option>
        <option value="designer">Designer</option>
      </select>
      
      <button type="submit" className="auth-submit-btn">Create Account</button>
      
      <div className="auth-divider">
        <span>or</span>
      </div>
      
      <button 
        type="button" 
        className="auth-submit-btn" 
        style={{background: 'transparent', color: '#a0522d', border: '1px solid #a0522d', padding: '0.5rem'}}
        onClick={() => { if (onRegister) onRegister(); }}
      >
        Back to Login
      </button>
      
      {error && <div className="auth-error">{error}</div>}
      {successMessage && <div className="auth-success">{successMessage}</div>}
    </form>
    </div>
  );
}
