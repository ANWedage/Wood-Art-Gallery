import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './UploadDesign.css';

const UploadDesign = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    price: '',
    quantity: '',
    boardColor: '',
    boardThickness: '',
    material: '',
    boardSize: '',
    image: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    // Validate all fields are filled
    const newErrors = {};
    
    if (!formData.itemName.trim()) newErrors.itemName = 'Item name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.boardColor) newErrors.boardColor = 'Board color is required';
    if (!formData.boardThickness) newErrors.boardThickness = 'Board thickness is required';
    if (!formData.material) newErrors.material = 'Material is required';
    if (!formData.boardSize) newErrors.boardSize = 'Board size is required';
    if (!formData.image) newErrors.image = 'Please select an image';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      alert('Please fill in all required fields correctly');
      return;
    }

    // Check if user is logged in
    if (!user || !user.email) {
      alert('Please log in to upload designs');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData for multipart/form-data submission
      const submitData = new FormData();
      submitData.append('email', user.email);
      submitData.append('itemName', formData.itemName);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('quantity', formData.quantity);
      submitData.append('boardColor', formData.boardColor);
      submitData.append('boardThickness', formData.boardThickness);
      submitData.append('material', formData.material);
      submitData.append('boardSize', formData.boardSize);
      submitData.append('image', formData.image);

      console.log('Submitting design data...');

      // Send to backend
      const response = await fetch('http://localhost:5000/api/design/upload', {
        method: 'POST',
        body: submitData
        // Do NOT set Content-Type header - browser will set it correctly for FormData
      });

      const result = await response.json();

      if (result.success) {
        alert('Design uploaded successfully!');
        // Reset form
        setFormData({
          itemName: '',
          description: '',
          price: '',
          quantity: '',
          boardColor: '',
          boardThickness: '',
          material: '',
          boardSize: '',
          image: null
        });
        setImagePreview(null);
      } else {
        alert('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading design. Please try again.');
    }
  };

  return (
    <div className="upload-design-container">
      <h1 className="upload-title">Upload Design</h1>
      
      <div className="form-description">
        <p>Share your creative wood art designs with our marketplace community. Upload high-quality images of your work, 
        set competitive pricing, specify wood materials and dimensions, and reach customers looking for unique handcrafted pieces. 
        Complete all fields to create an attractive listing that showcases your craftsmanship.</p>
      </div>
      
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="section-title">Item Details</h2>
          
          <div className="form-row">
            <div className="form-group full-width">
              <label className="field-label">Item Name</label>
              <input 
                type="text"
                name="itemName" 
                value={formData.itemName}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter item name"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group full-width">
              <label className="field-label">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-control textarea"
                rows="3"
                placeholder="Enter item description"
                required
              ></textarea>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Price (Rs.)</label>
              <input 
                type="number"
                name="price" 
                value={formData.price}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter price in Rs."
                min="0.01"
                step="0.01"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="field-label">Quantity</label>
              <input 
                type="number"
                name="quantity" 
                value={formData.quantity}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter quantity available"
                min="1"
                step="1"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2 className="section-title">Wood Specifications</h2>
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Board Color</label>
              <input 
                type="text"
                name="boardColor" 
                value={formData.boardColor}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter board color (e.g., Brown, Natural)"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="field-label">Board Thickness</label>
              <input 
                type="text"
                name="boardThickness" 
                value={formData.boardThickness}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter thickness (e.g., 5mm, 10mm)"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Material</label>
              <input 
                type="text"
                name="material" 
                value={formData.material}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter material (e.g., Oak, MDF)"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="field-label">Board Size</label>
              <input 
                type="text"
                name="boardSize" 
                value={formData.boardSize}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter size (e.g., 8 x 10 inches)"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2 className="section-title">Upload Product Image</h2>
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
                  </button>
                </div>
              ) : (
                <>
                  <div className="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#8e4424" viewBox="0 0 16 16">
                      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                      <path d="M1.5 1A1.5 1.5 0 0 0 0 2.5v10A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 14.5 1h-13zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54A.5.5 0 0 1 1 12.5v-9a.5.5 0 0 1 .5-.5h13z"/>
                    </svg>
                  </div>
                  <p className="upload-text">
                    <span className="upload-instruction">Drag & drop your product image here</span>
                    <span className="upload-or">or</span>
                  </p>
                  <label htmlFor="image-upload" className="upload-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                    </svg>
                    Upload Image
                  </label>
                </>
              )}
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
                required={!formData.image}
              />
            </div>
          </div>
        </div>
        
        <div className="form-row submit-row">
          <button type="submit" className="submit-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Submit Design
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadDesign;
