import React from 'react';
import './ProfileSection.css';

export default function ProfileSection() {
  return (
    <div className="profile-section">
      <h1 className="staffdesigner-dashboard-title">Profile</h1>
      <p>Manage your profile information and account settings.</p>
      <div className="profile-placeholder">
        <div className="profile-info">
          <h3>Profile Information</h3>
          <p>Update your personal details and preferences here.</p>
        </div>
      </div>
    </div>
  );
}
