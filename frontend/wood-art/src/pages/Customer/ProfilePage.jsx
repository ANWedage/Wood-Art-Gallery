import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { useAuth } from '../../context/AuthContext';

function EditProfileModal({ open, onClose, user, onSave }) {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || 'Customer',
    address: user?.address || 'Colombo, Sri Lanka',
    phone: user?.phone || '0123456789',
    password: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!open) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'name' && /[^a-zA-Z\s'.-]/.test(value)) return;
    
    if (name === 'phone') {
      // Only allow numbers and limit to 10 digits
      const phoneValue = value.replace(/[^0-9]/g, '').substring(0, 10);
      setForm({ ...form, [name]: phoneValue });
      return;
    }
    
    setForm({ ...form, [name]: value });
  };

  const validatePassword = (pw) => {
    // At least 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/.test(pw);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    
    // Validate phone number is exactly 10 digits
    if (form.phone.length !== 10) {
      setMsg('Phone number must be exactly 10 digits');
      setSaving(false);
      return;
    }
    
    if (form.password || form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        setMsg('Passwords do not match');
        setSaving(false);
        return;
      }
      if (!validatePassword(form.password)) {
        setMsg('Password must be at least 6 characters, include uppercase, lowercase, number, and special character');
        setSaving(false);
        return;
      }
    }
    const updateBody = { email: user.email, name: form.name, address: form.address, phone: form.phone };
    if (form.password) updateBody.password = form.password;
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody)
      });
      const data = await res.json();
      if (data.success) {
        // Update the user data in the auth context to reflect changes immediately
        updateUser({ name: form.name, address: form.address, phone: form.phone });
        setMsg('Profile updated successfully!');
        setTimeout(() => { setMsg(''); onSave(); }, 2000);
      } else {
        setMsg(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMsg('Could not connect to the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => {
      if (e.target.className === 'modal-overlay') onClose();
    }}>
      <div className="modal-content">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              id="name"
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input 
              id="phone"
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              placeholder="Enter your phone number (10 digits)"
              maxLength={10}
              minLength={10}
            />
            {form.phone && form.phone.length < 10 && (
              <div className="input-hint">Phone number must be 10 digits</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input 
              id="address"
              name="address" 
              value={form.address} 
              onChange={handleChange} 
              placeholder="Enter your address"
            />
          </div>
          
          <div className="form-group password-field">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input 
                id="password"
                name="password" 
                type={showPassword ? "text" : "password"} 
                value={form.password} 
                onChange={handleChange} 
                autoComplete="new-password" 
                placeholder="Leave blank to keep current"
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('password')} 
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="form-group password-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input 
                id="confirmPassword"
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                value={form.confirmPassword} 
                onChange={handleChange} 
                autoComplete="new-password" 
                placeholder="Confirm new password"
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                tabIndex="-1"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {msg && <div className={msg.includes('successfully') ? 'profile-success' : 'profile-error'}>{msg}</div>}
          
          <div className="modal-buttons">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage({ setActivePage }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Function to calculate cart item count
  const calculateCartItemCount = () => {
    try {
      const existingCart = localStorage.getItem(`cart_${user?.email}`);
      if (existingCart) {
        const cartItems = JSON.parse(existingCart);
        return cartItems.length;
      }
      return 0;
    } catch (error) {
      console.error('Error calculating cart count:', error);
      return 0;
    }
  };

  // Update cart count on component mount and when user changes
  useEffect(() => {
    if (user?.email) {
      setCartItemCount(calculateCartItemCount());
    }
  }, [user?.email]);

  // Listen for storage changes to update cart count when items are added/removed
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === `cart_${user?.email}`) {
        setCartItemCount(calculateCartItemCount());
      }
    };

    const handleCartUpdate = (e) => {
      console.log('Cart update event received:', e.detail);
      setCartItemCount(calculateCartItemCount());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Also listen for manual updates (within the same tab) as fallback
    const interval = setInterval(() => {
      const currentCount = calculateCartItemCount();
      if (currentCount !== cartItemCount) {
        setCartItemCount(currentCount);
      }
    }, 2000); // Reduced frequency since we have event-based updates

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(interval);
    };
  }, [user?.email, cartItemCount]);

  if (!user) return null;

  return (
    <div className="profile-marketplace-container">
      
      {/* Header Section */}
      <div className="profile-marketplace-header" style={showModal ? { filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none' } : {}}>
        <div className="profile-cover-section">
          <div className="profile-avatar-large">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <div className="online-status-badge">
              <div className="status-dot"></div>
            </div>
          </div>
          <div className="profile-header-info">
            <h1 className="profile-display-name">{user.name || 'Customer'}</h1>
            <div className="profile-status-tags">
              <span className="member-badge">Valued Customer</span>
              <span className="verified-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Verified
              </span>
            </div>
            
          </div>
          <div className="profile-header-actions">
            <button className="edit-profile-btn-modern" onClick={() => setShowModal(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="profile-content-grid" style={showModal ? { filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none' } : {}}>
        
        {/* Contact Information Card */}
        <div className="profile-info-card">
          <div className="card-header">
            <h3>Contact Information</h3>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <div className="contact-info-list">
            <div className="contact-item">
              <div className="contact-icon email-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <div className="contact-details">
                <span className="contact-label">Email Address</span>
                <span className="contact-value">{user.email}</span>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon phone-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
              </div>
              <div className="contact-details">
                <span className="contact-label">Phone Number</span>
                <span className="contact-value">{user.phone || '0123456789'}</span>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon address-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="contact-details">
                <span className="contact-label">Shipping Address</span>
                <span className="contact-value">{user.address || 'Colombo, Sri Lanka'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Overview Card */}
        <div className="profile-info-card">
          <div className="card-header">
            <h3>Account Overview</h3>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="account-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                </svg>
              </div>
              <div className="stat-details">
                <span className="stat-number">0</span>
                <span className="stat-label">Orders</span>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </div>
              <div className="stat-details">
                <span className="stat-number">{cartItemCount}</span>
                <span className="stat-label">Cart Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="profile-info-card quick-actions-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
          </div>
          <div className="quick-actions-list">
            <button className="action-btn" onClick={() => setActivePage && setActivePage('cart')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              View Cart
            </button>
            
            <button className="action-btn" onClick={() => setActivePage && setActivePage('payment')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
              </svg>
              Order History
            </button>
          </div>
        </div>

      </div>
      
      {showModal && (
        <EditProfileModal open={showModal} onClose={() => setShowModal(false)} user={user} onSave={() => setShowModal(false)} />
      )}
    </div>
  );
}
