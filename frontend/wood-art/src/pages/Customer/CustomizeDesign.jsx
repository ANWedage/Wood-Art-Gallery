import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './CustomizeDesign.css';

const CustomizeDesign = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    boardColor: '',
    material: '',
    boardSize: '',
    boardThickness: '',
    image: null,
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [bankSlip, setBankSlip] = useState(null);
  const [bankSlipPreview, setBankSlipPreview] = useState(null);

  // Pricing structure
  const pricingData = {
    mdf: {
      '3mm - 4mm': 950,
      '5mm - 6mm': 1100,
      '8mm - 10mm': 1300
    },
    plywood: {
      '3mm - 4mm': 1000,
      '5mm - 6mm': 1200,
      '8mm - 10mm': 1400
    },
    mahogany: {
      '3mm - 4mm': 1100,
      '5mm - 6mm': 1300,
      '8mm - 10mm': 1500
    },
    solid_wood: {
      '3mm - 4mm': 1000,
      '5mm - 6mm': 1200,
      '8mm - 10mm': 1400
    },
    HDF: {
      '3mm - 4mm': 1150,
      '5mm - 6mm': 1350,
      '8mm - 10mm': 1550
    }
  };

  // Calculate price based on material and thickness
  const calculatePrice = (material, thickness) => {
    if (material && thickness && pricingData[material] && pricingData[material][thickness]) {
      return pricingData[material][thickness];
    }
    return 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);
    
    // Calculate price when material or thickness changes
    if (name === 'material' || name === 'boardThickness') {
      const price = calculatePrice(newFormData.material, newFormData.boardThickness);
      setTotalPrice(price);
    }
  };

  // Preview image functionality
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file upload
  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
  };
  
  // Process the uploaded file
  const processFile = (file) => {
    setFormData({
      ...formData,
      image: file
    });
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle form submission - show payment modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields are filled
    const newErrors = {};
    
    if (!formData.boardColor) newErrors.boardColor = 'Board color is required';
    if (!formData.material) newErrors.material = 'Material is required';
    if (!formData.boardSize) newErrors.boardSize = 'Board size is required';
    if (!formData.boardThickness) newErrors.boardThickness = 'Board thickness is required';
    if (!formData.image) newErrors.image = 'Please select an image';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Please fill in all required fields');
      return;
    }

    // Show payment modal
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
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add customer info
      if (user) {
        submitData.append('customerName', user.name || '');
        submitData.append('customerEmail', user.email || '');
        submitData.append('customerPhone', user.phone || '');
        submitData.append('customerAddress', user.address || '');
      } else {
        submitData.append('customerName', 'Guest Customer');
        submitData.append('customerEmail', 'guest@example.com');
        submitData.append('customerPhone', '');
        submitData.append('customerAddress', '');
      }
      
      // Add form data
      submitData.append('boardColor', formData.boardColor);
      submitData.append('material', formData.material);
      submitData.append('boardSize', formData.boardSize);
      submitData.append('boardThickness', formData.boardThickness);
      submitData.append('description', formData.description || '');
      submitData.append('image', formData.image);
      submitData.append('totalPrice', totalPrice);
      submitData.append('deliveryFee', 250);
      submitData.append('paymentMethod', paymentMethod);
      
      // Add bank slip if bank payment
      if (paymentMethod === 'bank' && bankSlip) {
        submitData.append('bankSlip', bankSlip);
      }

      // Submit to backend
      const response = await fetch('/api/customOrder/create', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        const totalWithDelivery = totalPrice + 250;
        if (paymentMethod === 'bank') {
          alert('Order submitted successfully! Your bank payment slip has been submitted for approval. You will be notified once the payment is verified.');
          // Show reference information for financial dashboard
          const referenceInfo = `Order Reference: ${result.order.orderId || result.order._id}\nCustomer: ${user?.name || 'Customer'}\nSubtotal: Rs. ${totalPrice.toLocaleString()}\nDelivery Fee: Rs. 250\nTotal Amount: Rs. ${totalWithDelivery.toLocaleString()}`;
          alert(`Please note this reference for tracking:\n\n${referenceInfo}`);
        } else {
          alert(`Order submitted successfully! Our staff designers will review your request.\n\nOrder Total: Rs. ${totalWithDelivery.toLocaleString()} (including Rs. 250 delivery fee)`);
        }
        
        // Reset form and modal
        setFormData({
          boardColor: '',
          material: '',
          boardSize: '',
          boardThickness: '',
          image: null,
          description: ''
        });
        setImagePreview(null);
        setTotalPrice(0);
        setShowPaymentModal(false);
        setPaymentMethod('');
        setShowBankDetails(false);
        setBankSlip(null);
        setBankSlipPreview(null);
      } else {
        alert(result.message || 'Failed to submit order');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customize-design-container">
      <h1 className="customize-title">Customize your design</h1>
      
      <div className="form-description">
        <p>Create your personalized wood art by uploading your own image and selecting your preferred wood specifications. 
        Choose from various board colors, materials, sizes, and thicknesses to bring your vision to life. 
        Our expert craftsmen will carefully engrave your design onto the selected wood board.</p>
      </div>
      
      <form className="customize-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="section-title">Select Wood Options</h2>
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Board Color</label>
              <select 
                name="boardColor" 
                value={formData.boardColor}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="" disabled>Select Board Color</option>
                <option value="brown">Brown</option>
                <option value="blue">Blue</option>
                <option value="tan">Tan</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="field-label">Material</label>
              <select 
                name="material" 
                value={formData.material}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="" disabled>Select Material</option>
                <option value="mdf">MDF</option>
                <option value="plywood">Plywood</option>
                <option value="solid_wood">Solid Wood</option>
                <option value="mahogany">Mahogany</option>
                <option value="HDF">HDF</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Board Size</label>
              <select 
                name="boardSize" 
                value={formData.boardSize}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="" disabled>Select Board Size</option>
                <option value="6 x 4 inches">6 x 4 inches</option>
                <option value="8 x 6 inches">8 x 6 inches</option>
                <option value="12 x 8 inches">12 x 8 inches</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="field-label">Board Thickness</label>
              <select 
                name="boardThickness" 
                value={formData.boardThickness}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="" disabled>Select Board Thickness</option>
                <option value="3mm - 4mm">3mm - 4mm</option>
                <option value="5mm - 6mm">5mm - 6mm</option>
                <option value="8mm - 10mm">8mm - 10mm</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2 className="section-title">Upload Your Design</h2>
          <div className="form-row upload-section">
            <div 
              className={`form-group upload-group ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Design Preview" className="image-preview" />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData({...formData, image: null});
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#a0522d" viewBox="0 0 16 16">
                      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                      <path d="M1.5 1A1.5 1.5 0 0 0 0 2.5v10A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 14.5 1h-13zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54A.5.5 0 0 1 1 12.5v-9a.5.5 0 0 1 .5-.5h13z"/>
                    </svg>
                  </div>
                  <p className="upload-text">
                    <span className="upload-instruction">Drag & drop your design image here</span>
                    <span className="upload-or">or</span>
                  </p>
                  <label htmlFor="image-upload" className="upload-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                    </svg>
                    Browse Files
                  </label>
                </>
              )}
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2 className="section-title">Additional Information</h2>
          <div className="form-row">
            <div className="form-group full-width">
              <label className="description-label">Additional Description (Optional)</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-control textarea"
                rows="4"
                placeholder="Add any special instructions or details about your design..."
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Price Display Section - Show after image upload and below additional information */}
        {imagePreview && totalPrice > 0 && (
          <div className="form-section price-section">
            <h2 className="section-title">Pricing</h2>
            <div className="price-display">
              <div className="price-breakdown">
                <span className="price-label">
                  {formData.material && formData.material.replace('_', ' ').toUpperCase()} 
                  ({formData.boardThickness})
                </span>
                <span className="price-amount">Rs. {totalPrice.toLocaleString()}</span>
              </div>
              <div className="price-breakdown">
                <span className="price-label">Delivery Fee</span>
                <span className="price-amount">Rs. 250</span>
              </div>
              <div className="total-price">
                <span className="total-label">Total Price:</span>
                <span className="total-amount">Rs. {(totalPrice + 250).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="form-row submit-row">
          <button type="submit" className="submit-btn" disabled={totalPrice === 0}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
              <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1z"/>
            </svg>
            Pay{totalPrice > 0 ? ` Rs. ${(totalPrice + 250).toLocaleString()}` : ''}
          </button>
        </div>
      </form>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h2>Choose a payment option</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowBankDetails(false);
                  setPaymentMethod('');
                  setBankSlip(null);
                  setBankSlipPreview(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {!showBankDetails ? (
                <>
                  <div className="payment-options">
                    <button 
                      className={`payment-option ${paymentMethod === 'bank' ? 'selected' : ''}`}
                      onClick={() => handlePaymentMethodSelect('bank')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                        <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1z"/>
                      </svg>
                      Bank Payment
                    </button>
                    
                    <button 
                      className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
                      onClick={() => handlePaymentMethodSelect('cash')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                        <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
                      </svg>
                      Cash on delivery
                    </button>
                  </div>
                  
                  <div className="total-cost">
                    <span>Total Cost: Rs. {(totalPrice + 250).toLocaleString()}</span>
                  </div>
                  
                  {paymentMethod && paymentMethod === 'cash' && (
                    <div className="payment-actions">
                      <button className="submit-payment-btn" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Submit Order'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bank-details">
                  <h3>Make your deposit for below bank account number and upload the slip within 3 days.</h3>
                  
                  <div className="bank-info">
                    <div className="bank-detail">
                      <strong>Account Number:</strong> 1234567$
                    </div>
                    <div className="bank-detail">
                      <strong>Branch:</strong> Colombo
                    </div>
                    <div className="bank-detail">
                      <strong>Bank:</strong> Commercial bank
                    </div>
                    <div className="bank-detail">
                      <strong>Name:</strong> Name
                    </div>
                  </div>
                  
                  <div className="slip-upload">
                    <label>Upload the slip:</label>
                    <div className="upload-area">
                      {bankSlipPreview ? (
                        <div className="slip-preview">
                          <img src={bankSlipPreview} alt="Bank Slip" />
                          <button 
                            type="button" 
                            className="remove-slip-btn"
                            onClick={() => {
                              setBankSlip(null);
                              setBankSlipPreview(null);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="bank-slip-upload" className="upload-bank-slip-btn">
                          Upload
                        </label>
                      )}
                      <input
                        type="file"
                        id="bank-slip-upload"
                        accept="image/*"
                        onChange={handleBankSlipUpload}
                        hidden
                      />
                    </div>
                  </div>
                  
                  <div className="total-cost">
                    <span>Total Cost: Rs. {(totalPrice + 250).toLocaleString()}</span>
                  </div>
                  
                  <div className="payment-actions">
                    <button 
                      className="submit-payment-btn" 
                      onClick={handlePaymentSubmit} 
                      disabled={isSubmitting || !bankSlip}
                    >
                      {isSubmitting ? 'Processing...' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizeDesign;
