import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './EditDesign.css';

const EditDesign = ({ design, onClose, onUpdate }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    itemName: design?.itemName || '',
    description: design?.description || '',
    price: design?.price || '',
    quantity: design?.quantity || '',
    boardColor: design?.boardColor || '',
    boardThickness: design?.boardThickness || '',
    material: design?.material || '',
    boardSize: design?.boardSize || '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (design) {
      setFormData({
        itemName: design.itemName,
        description: design.description,
        price: design.price,
        quantity: design.quantity,
        boardColor: design.boardColor,
        boardThickness: design.boardThickness,
        material: design.material,
        boardSize: design.boardSize,
        image: null
      });
      // Set current image as preview
      setImagePreview(`http://localhost:5000${design.imageUrl}`);
    }
  }, [design]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Fields that should not contain numbers
    const textOnlyFields = ['itemName', 'boardColor', 'material'];
    
    let processedValue = value;
    
    // Remove numbers from text-only fields
    if (textOnlyFields.includes(name)) {
      processedValue = value.replace(/[0-9]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!formData.itemName || !formData.description || !formData.price || 
        !formData.quantity || !formData.boardColor || !formData.boardThickness || 
        !formData.material || !formData.boardSize) {
      setError('All fields are required');
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData = new FormData();
      updateData.append('email', user.email);
      updateData.append('itemName', formData.itemName);
      updateData.append('description', formData.description);
      updateData.append('price', formData.price);
      updateData.append('quantity', formData.quantity);
      updateData.append('boardColor', formData.boardColor);
      updateData.append('boardThickness', formData.boardThickness);
      updateData.append('material', formData.material);
      updateData.append('boardSize', formData.boardSize);
      
      // Only append image if a new one was selected
      if (formData.image) {
        updateData.append('image', formData.image);
      }

      const response = await fetch(`http://localhost:5000/api/design/update/${design._id}`, {
        method: 'PUT',
        body: updateData
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Design updated successfully!');
        onUpdate(result.design); // Notify parent component
        setTimeout(() => {
          onClose(); // Close modal after 1.5 seconds
        }, 1500);
      } else {
        setError(result.message || 'Failed to update design');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Error updating design. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!design) return null;

  return (
    <div className="edit-design-modal">
      <div className="edit-design-container">
        <div className="edit-design-header">
          <h2>Edit Design</h2>
          <button className="close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>

        <form className="edit-design-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Item Details</h3>
            
            <div className="form-group">
              <label>Item Name</label>
              <input 
                type="text"
                name="itemName" 
                value={formData.itemName}
                onChange={handleInputChange}
                placeholder="Enter item name (letters only)"
                pattern="[A-Za-z\s]+"
                title="Item name should contain only letters and spaces"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Price (Rs.)</label>
                <input 
                  type="number"
                  name="price" 
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number"
                  name="quantity" 
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Wood Specifications</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Board Color</label>
                <input 
                  type="text"
                  name="boardColor" 
                  value={formData.boardColor}
                  onChange={handleInputChange}
                  placeholder="Enter board color (e.g., Brown, Natural)"
                  pattern="[A-Za-z\s]+"
                  title="Board color should contain only letters and spaces"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Board Thickness</label>
                <input 
                  type="text"
                  name="boardThickness" 
                  value={formData.boardThickness}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Material</label>
                <input 
                  type="text"
                  name="material" 
                  value={formData.material}
                  onChange={handleInputChange}
                  placeholder="Enter material (e.g., Oak, Pine, MDF)"
                  pattern="[A-Za-z\s]+"
                  title="Material should contain only letters and spaces"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Board Size</label>
                <input 
                  type="text"
                  name="boardSize" 
                  value={formData.boardSize}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Product Image</h3>
            <div className="image-upload-section">
              {imagePreview && (
                <div className="current-image">
                  <img src={imagePreview} alt="Design Preview" />
                </div>
              )}
              <div className="form-group">
                <label>Change Image (optional)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <small>Leave empty to keep current image</small>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
              </svg>
              {success}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="update-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Updating...
                </>
              ) : (
                'Update Design'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDesign;
