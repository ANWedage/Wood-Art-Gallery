import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import CustomerNavbar from '../../components/Navbar/CustomerNavbar';
import './Dashboard.css';
import ProfilePage from './ProfilePage';
import CustomizeDesign from './CustomizeDesign';
import ProductDetails from './ProductDetails';
import Cart from './Cart';
import MyPurchases from './MyPurchases';

export default function CustomerDashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed when user logs in
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activePage, setActivePage] = useState('home'); // Set default to 'home' to match the image
  const [selectedProduct, setSelectedProduct] = useState(null); // For ProductDetails overlay
  const [refreshing, setRefreshing] = useState(false);
  const eventSourceRef = useRef(null);
  
  // Effect to store sidebar state in localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Fetch all designs from all designers
  useEffect(() => {
    fetchAllDesigns();
  }, []);

  // Set up SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      
      if (eventData.type === 'designUpdated') {
        const updatedDesign = eventData.data;
        
        // Update the specific design in the designs array
        setDesigns(prevDesigns => 
          prevDesigns.map(design => 
            design._id === updatedDesign.designId 
              ? { 
                  ...design, 
                  quantity: updatedDesign.quantity,
                  price: updatedDesign.price !== undefined ? updatedDesign.price : design.price,
                  itemName: updatedDesign.itemName || design.itemName,
                  description: updatedDesign.description || design.description,
                  material: updatedDesign.material || design.material,
                  boardSize: updatedDesign.boardSize || design.boardSize,
                  boardColor: updatedDesign.boardColor || design.boardColor,
                  boardThickness: updatedDesign.boardThickness || design.boardThickness
                }
              : design
          )
        );

        // Update selected product if it's currently being viewed
        if (selectedProduct && selectedProduct._id === updatedDesign.designId) {
          setSelectedProduct(prev => ({
            ...prev,
            quantity: updatedDesign.quantity,
            price: updatedDesign.price !== undefined ? updatedDesign.price : prev.price,
            itemName: updatedDesign.itemName || prev.itemName,
            description: updatedDesign.description || prev.description,
            material: updatedDesign.material || prev.material,
            boardSize: updatedDesign.boardSize || prev.boardSize,
            boardColor: updatedDesign.boardColor || prev.boardColor,
            boardThickness: updatedDesign.boardThickness || prev.boardThickness
          }));
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [selectedProduct]);

  // State for cart quantity when coming from cart
  const [cartQuantity, setCartQuantity] = useState(1);

  // Handle navigation from cart to show specific product
  useEffect(() => {
    if (location.state?.showProduct && location.state?.fromCart) {
      // Find the design by ID and show it
      const productId = location.state.showProduct;
      const quantity = location.state.cartQuantity || 1;
      
      // Store the cart quantity for passing to ProductDetails
      setCartQuantity(quantity);
      
      // First set the active page to home to show the product grid
      setActivePage('home');
      
      // Find the product in the designs array
      const productToShow = designs.find(design => design._id === productId);
      if (productToShow) {
        setSelectedProduct(productToShow);
      } else {
        // If product not found in current designs, fetch it
        fetchSpecificDesign(productId);
      }
      
      // Clear the navigation state to prevent this effect from running again
      window.history.replaceState({}, document.title);
    }
  }, [location.state, designs]);

  const fetchSpecificDesign = async (designId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/design/${designId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedProduct(data.design);
      }
    } catch (error) {
      console.error('Error fetching specific design:', error);
    }
  };

  const fetchAllDesigns = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/design/all-designs');
      const data = await response.json();

      if (data.success) {
        setDesigns(data.designs);
      } else {
        setError(data.message || 'Failed to fetch designs');
      }
    } catch (err) {
      console.error('Error fetching designs:', err);
      setError('Error fetching designs. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter items by search
  const filteredItems = designs.filter(design =>
    design.itemName.toLowerCase().includes(search.toLowerCase()) ||
    design.description.toLowerCase().includes(search.toLowerCase()) ||
    design.material.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price) => {
    return `Rs. ${parseFloat(price).toFixed(2)}`;
  };

  const handleSeeMore = (design) => {
    setSelectedProduct(design);
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
    setCartQuantity(1); // Reset cart quantity when going back
  };

  return (
    <>
      <CustomerNavbar search={search} setSearch={setSearch} />
      <div className="customer-dashboard-root">
        <aside className={`customer-sidebar${sidebarOpen ? '' : ' closed'}`}>
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
            <li className={activePage === 'home' ? 'active' : ''} onClick={() => setActivePage('home')}>
              <div className="menu-icon"><span role="img" aria-label="home">🏠</span></div>
              <span>Home</span>
            </li>
            <li className={activePage === 'upload' ? 'active' : ''} onClick={() => setActivePage('upload')}>
              <div className="menu-icon"><span role="img" aria-label="customize">🛠️</span></div>
              <span>Customize Designs</span>
            </li>
            <li className={activePage === 'cart' ? 'active' : ''} onClick={() => setActivePage('cart')}>
              <div className="menu-icon"><span role="img" aria-label="cart">🛒</span></div>
              <span>Cart</span>
            </li>
            <li className={activePage === 'payment' ? 'active' : ''} onClick={() => setActivePage('payment')}>
              <div className="menu-icon"><span role="img" aria-label="purchases">💳</span></div>
              <span>Purchases</span>
            </li>
            <li className={activePage === 'profile' ? 'active' : ''} onClick={() => setActivePage('profile')}>
              <div className="menu-icon"><span role="img" aria-label="profile">👤</span></div>
              <span>Profile</span>
            </li>
          </ul>
        </aside>
        <main className="customer-dashboard-main">
          {activePage === 'profile' ? (
            <ProfilePage setActivePage={setActivePage} />
          ) : activePage === 'upload' ? (
            <CustomizeDesign />
          ) : activePage === 'cart' ? (
            <Cart />
          ) : activePage === 'payment' ? (
            <MyPurchases />
          ) : selectedProduct ? (
            <ProductDetails 
              design={selectedProduct} 
              onBack={handleBackToProducts}
              initialQuantity={cartQuantity}
            />
          ) : activePage === 'home' ? (
            <>
              <h1 className="featured-products-title">FEATURED PRODUCTS</h1>
              {error ? (
                <div className="error-container">
                  <div className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                    </svg>
                    <p>{error}</p>
                    <button onClick={fetchAllDesigns} className="retry-button">Try Again</button>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="no-designs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    <path d="M1.5 1A1.5 1.5 0 0 0 0 2.5v10A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 14.5 1h-13zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54A.5.5 0 0 1 1 12.5v-9a.5.5 0 0 1 .5-.5h13z"/>
                  </svg>
                  <h2>No Products Available</h2>
                  <p>{search ? `No products match "${search}"` : 'No products have been uploaded to the marketplace yet.'}</p>
                  {search && (
                    <button onClick={() => setSearch('')} className="clear-search-button">Clear Search</button>
                  )}
                </div>
              ) : (
                <div className="marketplace-container">
                  <div className="marketplace-stats">
                    <p className="product-count">{filteredItems.length} Product{filteredItems.length !== 1 ? 's' : ''} Available</p>
                    <button onClick={fetchAllDesigns} className="refresh-marketplace" disabled={refreshing}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className={refreshing ? 'spinning' : ''}>
                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                      </svg>
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  
                  <div className="item-grid">
                    {filteredItems.map((design) => (
                      <div className="marketplace-card" key={design._id}>
                        <div className="product-image-container">
                          <img 
                            src={`http://localhost:5000${design.imageUrl}`} 
                            alt={design.itemName}
                            className="product-image"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="product-overlay">
                            <span className="product-price">{formatPrice(design.price)}</span>
                          </div>
                          <div className="product-badges">
                            <span className="availability-badge">Available</span>
                            {design.quantity <= 5 && (
                              <span className="limited-badge">Limited Stock</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="product-details">
                          <h3 className="product-title">{design.itemName}</h3>
                          <p className="product-description">{design.description}</p>
                          
                          <div className="product-specifications">
                            <div className="spec-row">
                              <span className="spec-label">Material:</span>
                              <span className="spec-value">{design.material}</span>
                            </div>
                            <div className="spec-row">
                              <span className="spec-label">Size:</span>
                              <span className="spec-value">{design.boardSize}</span>
                            </div>
                            <div className="spec-row">
                              <span className="spec-label">Color:</span>
                              <span className="spec-value">{design.boardColor}</span>
                            </div>
                            <div className="spec-row">
                              <span className="spec-label">Thickness:</span>
                              <span className="spec-value">{design.boardThickness}</span>
                            </div>
                          </div>

                          <div className="product-footer">
                            <div className="designer-info">
                              <span className="designer-label">Designer:</span>
                              <span className="designer-name">
                                {design.designerId?.name || design.designerId?.email || 'Unknown Designer'}
                              </span>
                            </div>
                            
                            <div className="product-actions">
                              <div className="quantity-info">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M2.5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2h-11zm5 2h1a1 1 0 0 1 1 1v1h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3V3a1 1 0 0 1 1-1z"/>
                                </svg>
                                <span>{design.quantity} in stock</span>
                              </div>
                              
                              <button className="customize-button" onClick={() => handleSeeMore(design)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                </svg>
                                See More
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>
    </>
  );
}
