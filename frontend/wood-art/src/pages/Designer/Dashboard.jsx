import React, { useState, useEffect } from 'react';
import DesignerNavbar from '../../components/Navbar/DesignerNavbar';
import ProfilePage from './ProfilePage';
import UploadDesign from './UploadDesign';
import MyUploads from './MyUploads';
import MyOrders from './MyOrders';
import PaymentHistory from './PaymentHistory';
import './Dashboard.css';

export default function DesignerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed when user logs in
  const [activePage, setActivePage] = useState('menu'); // Set default to 'menu'
  
  // Effect to store sidebar state in localStorage
  useEffect(() => {
    localStorage.setItem('designerSidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Load sidebar state from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem('designerSidebarOpen');
    if (savedState !== null) {
      setSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  const renderContent = () => {
    switch(activePage) {
      case 'menu':
        return (
          <div className="designer-menu-hero">
            <div className="hero-background">
              <div className="laser-pattern"></div>
              <div className="wood-texture"></div>
            </div>
            <div className="hero-content">
              <div className="hero-header">
                <div className="laser-beam-effect"></div>
                <h1 className="hero-title">
                  <span className="title-line-3">Laser Print</span>
                  <span className="title-line-4">Wood Art Gallery</span>
                </h1>
                <div className="laser-beam-effect reverse"></div>
              </div>
              
              <div className="hero-description">
                <div className="description-card2">
                  <div className="card-icon2">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h3>Precision Laser Engraving</h3>
                  <p>Transform your creative designs into stunning laser-engraved wooden masterpieces. Our advanced laser technology ensures every detail is captured with perfect precision.</p>
                </div>
                
                <div className="description-card2">
                  <div className="card-icon2">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3>Premium Wood Materials</h3>
                  <p>You can sell your products that created using premium wood materials such as oak,maple,HDF,MDF and Mahogany through our marketplace</p>
                </div>
                
                <div className="description-card2">
                  <div className="card-icon2">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <h3>Designer Marketplace</h3>
                  <p>Showcase your talent in our exclusive designer marketplace. Connect with customers worldwide and turn your artistic vision into profitable business.</p>
                </div>
              </div>
              
              <div className="hero-actions">
                <button 
                  className="action-btn primary2"
                  onClick={() => setActivePage('upload')}
                >
                  <span className="btn-icon">⚡</span>
                  Start uploading
                </button>
                <button 
                  className="action-btn secondary2"
                  onClick={() => setActivePage('my-uploads')}
                >
                  <span className="btn-icon">🎨</span>
                  Your uploads
                </button>
              </div>
              
              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number2">∞</div>
                  <div className="stat-label">Creative Possibilities</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number2">100%</div>
                  <div className="stat-label">Quality Assurance</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number2">24/7</div>
                  <div className="stat-label">Designer Support</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'upload':
        return <UploadDesign />;
      case 'my-uploads':
        return <MyUploads />;
      case 'my-orders':
        return <MyOrders />;
      case 'payment':
        return <PaymentHistory />;
      case 'profile':
        return <ProfilePage setActivePage={setActivePage} />;
      default:
        return (
          <div className="designer-menu-hero">
            <div className="hero-background">
              <div className="laser-pattern"></div>
              <div className="wood-texture"></div>
            </div>
            <div className="hero-content">
              <div className="hero-header">
                <div className="laser-beam-effect"></div>
                <h1 className="hero-title">
                  <span className="title-line-1">Laser Print</span>
                  <span className="title-line-2">Wood Art Gallery</span>
                </h1>
                <div className="laser-beam-effect reverse"></div>
              </div>
              
              <div className="hero-description">
                <div className="description-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h3>Precision Laser Engraving</h3>
                  <p>Transform your creative designs into stunning laser-engraved wooden masterpieces. Our advanced laser technology ensures every detail is captured with perfect precision.</p>
                </div>
                
                <div className="description-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3>Premium Wood Materials</h3>
                  <p>Choose from our curated selection of high-quality wood materials including oak, maple, mahogany, and exotic hardwoods for your artistic creations.</p>
                </div>
                
                <div className="description-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <h3>Designer Marketplace</h3>
                  <p>Showcase your talent in our exclusive designer marketplace. Connect with customers worldwide and turn your artistic vision into profitable business.</p>
                </div>
              </div>
              
              <div className="hero-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => setActivePage('upload')}
                >
                  <span className="btn-icon">⚡</span>
                  Start Creating
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActivePage('my-uploads')}
                >
                  <span className="btn-icon">🎨</span>
                  View Gallery
                </button>
              </div>
              
              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">∞</div>
                  <div className="stat-label">Creative Possibilities</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">Quality Assurance</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Designer Support</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <DesignerNavbar />
      <div className="designer-dashboard-root">
        <aside className={`designer-sidebar${sidebarOpen ? '' : ' closed'}`}>
          <div className="sidebar-header">
            <span 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(prev => !prev)}
              title={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? '✕' : '☰'}
            </span>
          </div>
          <ul>
            <li className={activePage === 'menu' ? 'active' : ''} onClick={() => setActivePage('menu')}>
              <div className="menu-icon"><span role="img" aria-label="menu">🏠</span></div>
              <span>Menu</span>
            </li>
            <li className={activePage === 'upload' ? 'active' : ''} onClick={() => setActivePage('upload')}>
              <div className="menu-icon"><span role="img" aria-label="upload">⬆️</span></div>
              <span>Upload Designs</span>
            </li>
            <li className={activePage === 'my-uploads' ? 'active' : ''} onClick={() => setActivePage('my-uploads')}>
              <div className="menu-icon"><span role="img" aria-label="my-uploads">🖼️</span></div>
              <span>My Uploads</span>
            </li>
            <li className={activePage === 'my-orders' ? 'active' : ''} onClick={() => setActivePage('my-orders')}>
              <div className="menu-icon"><span role="img" aria-label="orders">📦</span></div>
              <span>Recieved Orders</span>
            </li>
            <li className={activePage === 'payment' ? 'active' : ''} onClick={() => setActivePage('payment')}>
              <div className="menu-icon"><span role="img" aria-label="payment">💳</span></div>
              <span>Payment History</span>
            </li>
            <li className={activePage === 'profile' ? 'active' : ''} onClick={() => setActivePage('profile')}>
              <div className="menu-icon"><span role="img" aria-label="profile">👤</span></div>
              <span>Profile</span>
            </li>
          </ul>
        </aside>
        <main className="designer-dashboard-main">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
