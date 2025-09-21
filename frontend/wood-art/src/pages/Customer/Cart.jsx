import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../components/Navbar/CustomerNavbar';
import './Cart.css';

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [bankSlip, setBankSlip] = useState(null);
  const [bankSlipPreview, setBankSlipPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    loadCartItems();
  }, []);

  // Set up SSE connection for real-time updates of cart items
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      
      if (eventData.type === 'designUpdated') {
        const updatedDesign = eventData.data;
        
        // Update cart items if any match the updated design
        setCartItems(prevItems => {
          const updatedItems = prevItems.map(item => {
            if (item.id === updatedDesign.designId) {
              return {
                ...item,
                availableQuantity: updatedDesign.quantity,
                price: updatedDesign.price || item.price,
                itemName: updatedDesign.itemName || item.itemName,
                description: updatedDesign.description || item.description,
                material: updatedDesign.material || item.material,
                boardSize: updatedDesign.boardSize || item.boardSize,
                boardColor: updatedDesign.boardColor || item.boardColor,
                boardThickness: updatedDesign.boardThickness || item.boardThickness
              };
            }
            return item;
          });
          
          return updatedItems;
        });
      }
    };

    eventSource.onerror = (error) => {
      console.error('Cart SSE error:', error);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [user?.email]);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.email) {
        setCartItems([]);
        setLoading(false);
        return;
      }
      
      // Load cart items from backend API
      const response = await fetch(`http://localhost:5000/api/cart/${encodeURIComponent(user.email)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (!data.cart || !Array.isArray(data.cart)) {
          throw new Error('Invalid cart data received from server');
        }
        
        // Fix imageUrl format for display
        const fixedItems = data.cart.map((item) => {
          if (!item.designId) {
            console.warn('Cart item missing designId:', item);
            return null;
          }
          
          let fixedUrl = item.imageUrl;
          
          // Handle different URL formats
          if (fixedUrl && !fixedUrl.startsWith('http://')) {
            fixedUrl = `http://localhost:5000${fixedUrl.startsWith('/') ? '' : '/'}${fixedUrl}`;
          }
          
          // Extract the actual design ID (handle both populated and string cases)
          const actualDesignId = item.designId._id || item.designId;
          
          return {
            ...item,
            id: actualDesignId, // Use actual designId string for API calls
            designId: actualDesignId, // Also update designId field
            imageUrl: fixedUrl
          };
        }).filter(item => item !== null); // Remove null items
        
        setCartItems(fixedItems);
        console.log('Cart loaded from backend:', fixedItems);
        
        // Select first item by default if no item is selected
        if (fixedItems.length > 0 && !selectedItemId) {
          setSelectedItemId(fixedItems[0].id);
        }
      } else {
        throw new Error(data.message || 'Failed to load cart');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setError(`Failed to load cart items: ${error.message}`);
      setCartItems([]);
      setSelectedItemId(null);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    console.log('Removing item:', itemId, 'Currently selected:', selectedItemId);
    
    try {
      const response = await fetch('http://localhost:5000/api/cart/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          designId: itemId
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state with backend response
        const fixedItems = data.cart.map((item) => {
          let fixedUrl = item.imageUrl;
          
          // Handle different URL formats
          if (fixedUrl && !fixedUrl.startsWith('http://')) {
            fixedUrl = `http://localhost:5000${fixedUrl.startsWith('/') ? '' : '/'}${fixedUrl}`;
          }
          
          // Extract the actual design ID (handle both populated and string cases)
          const actualDesignId = item.designId._id || item.designId;
          
          return {
            ...item,
            id: actualDesignId, // Use actual designId string for API calls
            designId: actualDesignId, // Also update designId field
            imageUrl: fixedUrl
          };
        });
        
        setCartItems(fixedItems);
        console.log('Updated cart length:', fixedItems.length);
        
        // Trigger a custom event to notify other components of cart changes
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { action: 'remove', itemId, cartLength: fixedItems.length }
        }));
        
        // Auto-select remaining item logic
        if (fixedItems.length > 0) {
          // If the removed item was selected, automatically select the first remaining item
          if (selectedItemId === itemId) {
            console.log('Removed item was selected, selecting first remaining item:', fixedItems[0].id);
            setSelectedItemId(fixedItems[0].id);
          } else {
            // If the removed item wasn't selected, check if current selection still exists
            const currentSelectionExists = fixedItems.some(item => item.id === selectedItemId);
            if (!currentSelectionExists) {
              // If current selection no longer exists, select the first item
              console.log('Current selection no longer exists, selecting first item:', fixedItems[0].id);
              setSelectedItemId(fixedItems[0].id);
            } else {
              console.log('Current selection still exists, keeping it');
            }
          }
        } else {
          // If cart is empty, clear selection
          console.log('Cart is empty, clearing selection');
          setSelectedItemId(null);
        }
      } else {
        alert(data.message || 'Error removing item from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Error removing item from cart. Please try again.');
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/cart/clear/${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setCartItems([]);
        setSelectedItemId(null);
        
        // Trigger a custom event to notify other components of cart changes
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { action: 'clear', cartLength: 0 }
        }));
      } else {
        alert(data.message || 'Error clearing cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Error clearing cart. Please try again.');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = 250; // Fixed shipping cost
    return subtotal + shipping;
  };

  const formatPrice = (price) => {
    return `Rs. ${parseFloat(price).toFixed(2)}`;
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    // Check if any items exceed available stock
    const invalidItems = cartItems.filter(item => 
      item.availableQuantity !== undefined && item.quantity > item.availableQuantity
    );
    
    if (invalidItems.length > 0) {
      const itemNames = invalidItems.map(item => `${item.itemName} (${item.quantity} requested, ${item.availableQuantity} available)`).join(', ');
      alert(`Cannot proceed to checkout. The following items exceed available stock: ${itemNames}`);
      return;
    }
    
    // Prepare order data for full cart
    const orderData = {
      type: 'fullCart',
      items: cartItems,
      total: calculateTotal()
    };
    
    setCurrentOrderData(orderData);
    setShowPaymentModal(true);
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const getSelectedItem = () => {
    return cartItems.find(item => item.id === selectedItemId);
  };

  const calculateItemTotal = (item) => {
    if (!item) return 0;
    const itemSubtotal = item.price * item.quantity;
    const shipping = 250; // Fixed shipping cost
    return itemSubtotal + shipping;
  };

  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
  };

  const handleOrderItem = () => {
    const selectedItem = getSelectedItem();
    if (!selectedItem) {
      alert('Please select an item to order');
      return;
    }
    
    // Navigate to customer dashboard and trigger product details view
    // We'll use URL state to pass the product ID and cart quantity
    navigate('/customer', { 
      state: { 
        showProduct: selectedItem.id,
        fromCart: true,
        cartQuantity: selectedItem.quantity
      } 
    });
  };

  const handleIndividualCheckout = () => {
    const selectedItem = getSelectedItem();
    if (!selectedItem) {
      alert('Please select an item to checkout');
      return;
    }
    
    // Check if selected item exceeds available stock
    if (selectedItem.availableQuantity !== undefined && selectedItem.quantity > selectedItem.availableQuantity) {
      alert(`Cannot proceed to checkout. ${selectedItem.itemName} quantity (${selectedItem.quantity}) exceeds available stock (${selectedItem.availableQuantity})`);
      return;
    }
    
    // Prepare order data for individual item
    const orderData = {
      type: 'individual',
      items: [selectedItem],
      total: calculateItemTotal(selectedItem)
    };
    
    setCurrentOrderData(orderData);
    setShowPaymentModal(true);
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    if (method === 'bank') {
      setShowBankDetails(true);
    } else {
      setShowBankDetails(false);
    }
  };

  // Handle bank slip upload
  const handleBankSlipUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBankSlip(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setBankSlipPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle final payment submission
  const handlePaymentSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      let bankSlipUrl = null;
      
      // Upload bank slip if provided
      if (paymentMethod === 'bank' && bankSlip) {
        const formData = new FormData();
        formData.append('bankSlip', bankSlip);

        const uploadResponse = await fetch('http://localhost:5000/api/bankSlip/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          bankSlipUrl = uploadData.filePath;
        } else {
          throw new Error('Failed to upload bank slip');
        }
      }

      // Prepare order data
      const orderItems = currentOrderData.type === 'individual' 
        ? [getSelectedItem()].map(item => ({
            designId: item.id,
            quantity: item.quantity
          }))
        : cartItems.map(item => ({
            designId: item.id,
            quantity: item.quantity
          }));

      const orderData = {
        userEmail: user.email,
        items: itemsToOrder,
        // Map UI payment selection to backend values
        paymentMethod: paymentMethod === 'cash' ? 'cash_on_delivery' : 'bank_transfer',
        bankSlipUrl: bankSlipUrl, // Include bank slip URL if uploaded
        orderType: currentOrderData.type
      };

      // Create order
      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Order placed successfully!\nOrder ID: ${data.order.orderId}\nTotal: Rs. ${(data.order.totalAmount + 250).toFixed(2)}\n${paymentMethod === 'bank' ? 'Bank payment will be verified.' : 'Cash on delivery confirmed.'}\n\nStock has been reserved and designers have been notified.`);
        
        // Clear cart based on order type (this will be handled by the backend)
        if (currentOrderData.type === 'individual') {
          // Remove individual item from cart
          const selectedItem = getSelectedItem();
          await removeFromCart(selectedItem.id);
        } else {
          // Reload cart to reflect backend changes
          await loadCartItems();
        }
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
      
      // Reset payment modal
      setShowPaymentModal(false);
      setPaymentMethod('');
      setShowBankDetails(false);
      setBankSlip(null);
      setBankSlipPreview(null);
      setCurrentOrderData(null);
      
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { action: 'checkout', cartLength: cartItems.length }
      }));
      
    } catch (error) {
      console.error('Order submission failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    // Find the item to check available quantity
    const item = cartItems.find(item => item.id === itemId);
    if (!item) {
      alert('Item not found in cart');
      return;
    }

    // Check if new quantity exceeds available stock
    if (item.availableQuantity !== undefined && newQuantity > item.availableQuantity) {
      alert(`Cannot set quantity to ${newQuantity}. Only ${item.availableQuantity} available.`);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          itemId: itemId,
          quantity: newQuantity
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? { ...item, quantity: newQuantity }
              : item
          )
        );

        // Trigger a custom event to notify other components of cart changes
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { action: 'update', itemId, quantity: newQuantity, cartLength: cartItems.length }
        }));
      } else {
        alert(data.message || 'Error updating item quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Error updating item quantity. Please try again.');
    }
  };

  if (loading) {
    return (
      <>
        <CustomerNavbar search={search} setSearch={setSearch} />
        <div className="cart-container">
          <h1 className="cart-title">Shopping Cart</h1>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CustomerNavbar search={search} setSearch={setSearch} />
        <div className="cart-container">
          <h1 className="cart-title">Shopping Cart</h1>
          <div className="error-container">
            <div className="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              <p>{error}</p>
              <button onClick={loadCartItems} className="retry-button">Try Again</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomerNavbar search={search} setSearch={setSearch} />
    <div className="cart-container">
      <div className="cart-header">
        <h1 className="cart-title">Shopping Cart</h1>
        <p className="cart-subtitle">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Add some beautiful wood art designs to get started!</p>
          <button className="continue-shopping-btn" onClick={handleContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div 
                key={item.id} 
                className={`cart-item ${selectedItemId === item.id ? 'selected' : ''}`}
                onClick={() => handleItemSelect(item.id)}
              >
                <div className="item-image">
                  <img 
                    src={item.imageUrl} 
                    alt={item.itemName}
                    onError={(e) => {
                      console.error('Image failed to load:', item.imageUrl);
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', item.imageUrl);
                    }}
                  />
                </div>
                <div className="item-details">
                  <h3 className="item-name">{item.itemName}</h3>
                  <p className="item-designer">by {item.designerName}</p>
                  <div className="item-specs">
                    <span className="spec-item">{item.material}</span>
                    <span className="spec-item">{item.boardSize}</span>
                    <span className="spec-item">{item.boardColor}</span>
                    <span className="spec-item">{item.boardThickness}</span>
                  </div>
                  <p className="item-description">{item.description}</p>
                </div>
                <div className="item-actions">
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity - 1);
                      }}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity + 1);
                      }}
                      disabled={item.availableQuantity !== undefined && item.quantity >= item.availableQuantity}
                    >
                      +
                    </button>
                  </div>
                  
                  {item.availableQuantity !== undefined && (
                    <div className="stock-info">
                      <small>{item.availableQuantity} available</small>
                      {item.quantity > item.availableQuantity && (
                        <small className="stock-warning">⚠️ Exceeds stock!</small>
                      )}
                    </div>
                  )}
                  <div className="item-price">{formatPrice(item.price * item.quantity)}</div>
                  <button 
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent item selection when clicking remove
                      removeFromCart(item.id);
                    }}
                    title="Remove from cart"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              {selectedItemId ? (
                // Individual item summary
                (() => {
                  const selectedItem = getSelectedItem();
                  if (!selectedItem) return null;
                  
                  return (
                    <>
                      <h3>Item Order Summary</h3>
                      <div className="selected-item-preview">
                        <div>
                          <h4>{selectedItem.itemName}</h4>
                          <p>by {selectedItem.designerName}</p>
                        </div>
                      </div>
                      <div className="summary-line">
                        <span>Price ({selectedItem.quantity} × {formatPrice(selectedItem.price)})</span>
                        <span>{formatPrice(selectedItem.price * selectedItem.quantity)}</span>
                      </div>
                      <div className="summary-line">
                        <span>Delivery Fee</span>
                        <span>{formatPrice(250)}</span>
                      </div>
                      <div className="summary-line total">
                        <span>Item Total</span>
                        <span>{formatPrice(calculateItemTotal(selectedItem))}</span>
                      </div>
                      <button className="order-item-btn" onClick={handleOrderItem}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z"/>
                        </svg>
                        Order This Item
                      </button>
                    </>
                  );
                })()
              ) : (
                // Full cart summary
                <>
                  <h3>Order Summary</h3>
                  <div className="summary-line">
                    <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                    <span>{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className="summary-line">
                    <span>Shipping</span>
                    <span>{formatPrice(250)}</span>
                  </div>
                  <div className="summary-line total">
                    <span>Total</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                  <button className="continue-shopping-btn secondary" onClick={handleContinueShopping}>
                    Continue Shopping
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      
      
      </div>
    </>
  );
}
