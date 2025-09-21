import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ProductDetails.css';

const ProductDetails = ({ design, onBack, initialQuantity = 1 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [bankSlip, setBankSlip] = useState(null);
  const [bankSlipPreview, setBankSlipPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      console.warn('Invalid price value:', price);
      return 'Rs. 0.00';
    }
    return `Rs. ${numPrice.toFixed(2)}`;
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= design.quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please log in to add items to cart');
      return;
    }

    setIsAddingToCart(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          designId: design._id
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Trigger a custom event to notify other components of cart changes
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { action: 'add', itemId: design._id, cartLength: data.cartLength }
        }));
        
        setTimeout(() => {
          setIsAddingToCart(false);
          alert('Item added to cart successfully!');
        }, 800);
      } else {
        setIsAddingToCart(false);
        alert(data.message || 'Error adding item to cart');
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAddingToCart(false);
      alert('Error adding item to cart. Please try again.');
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      alert('Please log in to purchase items');
      return;
    }
    
    if (quantity > design.quantity) {
      alert(`Cannot buy ${quantity} items. Only ${design.quantity} available in stock.`);
      return;
    }
    
    setShowPaymentModal(true);
  };

  // Payment handling functions
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    if (method === 'bank') {
      setShowBankDetails(true);
    } else {
      setShowBankDetails(false);
    }
  };

  const handleBankSlipUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBankSlip(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBankSlipPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (paymentMethod === 'bank' && !bankSlip) {
      alert('Please upload your bank slip');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload bank slip if provided
      let bankSlipUrl = null;
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

      // Create order
      const orderData = {
        userEmail: user.email,
        items: [{
          designId: design._id,
          quantity: quantity
        }],
        // Map UI selection to backend payment method values
        paymentMethod: paymentMethod === 'cod' ? 'cash_on_delivery' : 'bank_transfer',
        bankSlipUrl: bankSlipUrl,
        orderType: 'individual'
      };

      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitting(false);
        setShowPaymentModal(false);
        setPaymentMethod('');
        setShowBankDetails(false);
        setBankSlip(null);
        setBankSlipPreview(null);
        
        const total = data.order.totalAmount + 250; // Add shipping cost
        alert(`Order placed successfully!\nOrder ID: ${data.order.orderId}\nTotal: Rs. ${total.toFixed(2)}\n${paymentMethod === 'bank' ? 'Bank payment will be verified.' : 'Cash on delivery confirmed.'}\n\nStock has been reserved and designers have been notified.`);
        
        // Go back to products after successful order
        onBack();
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setIsSubmitting(false);
      alert(`Error processing order: ${error.message}`);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentMethod('');
    setShowBankDetails(false);
    setBankSlip(null);
    setBankSlipPreview(null);
  };

  const totalPrice = parseFloat(design.price || 0) * quantity;

  // Listen for stock updates that might affect this design
  useEffect(() => {
    const handleStockUpdate = (event) => {
      const eventData = event.detail;
      // If this design's stock was updated, we need to refresh
      if (eventData.type === 'designUpdated' && eventData.data.designId === design.id) {
        // For now, we'll let the parent component handle the refresh
        // A more sophisticated approach would be to update the design prop directly
      }
    };

    window.addEventListener('stockUpdated', handleStockUpdate);
    return () => window.removeEventListener('stockUpdated', handleStockUpdate);
  }, [design.id]);

  // Update quantity when initialQuantity prop changes
  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  return (
    <div className="product-details-overlay">
      <div className="product-details-container">
        {/* Header with back button */}
        <div className="product-header">
          <button className="back-button" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Back to Products
          </button>
          <h1 className="product-details-title">Product Details</h1>
        </div>

        <div className="product-details-content">
          {/* Product Image Section */}
          <div className="product-image-section">
            <div className="main-image-container">
              <img 
                src={`http://localhost:5000${design.imageUrl}`} 
                alt={design.itemName}
                className="main-product-image"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="image-badges">
                <span className="availability-badge">Available</span>
                {design.quantity <= 5 && (
                  <span className="limited-stock-badge">Limited Stock</span>
                )}
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="product-info-section">
            <div className="product-title-price">
              <h2 className="product-name">{design.itemName}</h2>
              <div className="price-section">
                <span className="current-price">{formatPrice(design.price)}</span>
                <span className="price-label">per item</span>
              </div>
            </div>

            <div className="product-description-full">
              <h3>Description</h3>
              <p>{design.description}</p>
            </div>

            {/* Product Specifications */}
            <div className="product-specifications-full">
              <h3>Specifications</h3>
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Material</span>
                  <span className="spec-value">{design.material}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Size</span>
                  <span className="spec-value">{design.boardSize}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Color</span>
                  <span className="spec-value">{design.boardColor}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Thickness</span>
                  <span className="spec-value">{design.boardThickness}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Stock Available</span>
                  <span className="spec-value">{design.quantity} units</span>
                </div>
              </div>
            </div>

            {/* Designer Info */}
            <div className="designer-info-full">
              <h3>Designer Information</h3>
              <div className="designer-details">
                <div className="designer-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                </div>
                <div className="designer-name-info">
                  <span className="designer-name">
                    {design.designerId?.name || design.designerId?.email || 'Unknown Designer'}
                  </span>
                  <span className="designer-label">Wood Art Designer</span>
                </div>
              </div>
            </div>

            {/* Quantity and Purchase Section */}
            <div className="purchase-section">
              <div className="quantity-selector">
                <h3>Quantity</h3>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-display">{quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= design.quantity}
                  >
                    +
                  </button>
                </div>
                <span className="stock-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                  {design.quantity} available
                </span>
              </div>

              <div className="total-price">
                <div className="price-breakdown">
                  <div className="price-line">
                    <span className="price-label">Subtotal ({quantity} × {formatPrice(design.price)}):</span>
                    <span className="price-amount">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="price-line">
                    <span className="price-label">Delivery Fee:</span>
                    <span className="price-amount">{formatPrice(250)}</span>
                  </div>
                  <div className="price-line total-line">
                    <span className="total-label">Total Price:</span>
                    <span className="total-amount">{formatPrice(totalPrice + 250)}</span>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="button-spinner"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>
                
                <button className="buy-now-btn" onClick={handleBuyNow}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z"/>
                  </svg>
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h2>Complete Your Purchase</h2>
              <button className="close-modal" onClick={closePaymentModal}>
                &times;
              </button>
            </div>

            <div className="modal-content">
              <h3>Payment Method</h3>
              <div className="payment-methods">
                <button 
                  className={`payment-method ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodSelect('cod')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z"/>
                  </svg>
                  Cash on Delivery
                </button>
                <button 
                  className={`payment-method ${paymentMethod === 'bank' ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodSelect('bank')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 0zm4.146 1.854a.5.5 0 0 1 .708 0l1.5 1.5a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708-.708L13.293 4H10.5a.5.5 0 0 1 0-1h2.793l-1.354-1.146a.5.5 0 0 1 0-.708zM8 14a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 1 0v1A.5.5 0 0 1 8 14zm-4.146-.854a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 0-.708l1.5-1.5a.5.5 0 0 1 .708.708L2.707 10H5.5a.5.5 0 0 1 0 1H2.707l1.354 1.146a.5.5 0 0 1 0 .708zM14 8a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1A.5.5 0 0 1 14 8zm-8 0a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 1 0v1A.5.5 0 0 1 6 8z"/>
                  </svg>
                  Bank Transfer
                </button>
              </div>

              {showBankDetails && (
                <div className="bank-details">
                  <h4>Make your deposit for below bank account number and upload the slip within 3 days.</h4>
                  <div className="bank-info">
                    <div className="bank-item">
                      <span className="bank-label">Account Number:</span>
                      <span className="bank-value">1234567890</span>
                    </div>
                    <div className="bank-item">
                      <span className="bank-label">Branch:</span>
                      <span className="bank-value">Colombo</span>
                    </div>
                    <div className="bank-item">
                      <span className="bank-label">Bank:</span>
                      <span className="bank-value">Commercial Bank</span>
                    </div>
                    <div className="bank-item">
                      <span className="bank-label">Name:</span>
                      <span className="bank-value">Wood Art Gallery</span>
                    </div>
                  </div>

                  <div className="upload-bank-slip">
                    <label htmlFor="bankSlip" className="upload-label">
                      Upload the slip:
                    </label>
                    <input 
                      type="file" 
                      id="bankSlip" 
                      accept="image/*"
                      onChange={handleBankSlipUpload}
                      className="upload-input"
                    />
                    {bankSlipPreview && (
                      <div className="slip-preview">
                        <img src={bankSlipPreview} alt="Bank Slip" className="slip-image" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="order-total">
                <span>Total Cost: Rs. {(parseFloat(design.price) * quantity + 250).toFixed(2)}</span>
              </div>

              <div className="modal-actions">
                <button className="confirm-payment-btn" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="button-spinner"></div>
                      Processing...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
