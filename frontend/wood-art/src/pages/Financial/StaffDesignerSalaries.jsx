import React, { useState, useEffect, useMemo } from 'react';
import './StaffDesignerSalaries.css';

export default function StaffDesignerSalaries() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [staffDesigners, setStaffDesigners] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [formData, setFormData] = useState({
    staffDesignerName: '',
    staffDesignerEmail: '',
    year: '',
    month: '',
    basicSalary: '30000', // Fixed basic salary
    allowances: '',
    taxPercentage: '',
    loanInstallments: ''
  });

  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 8 = September)

  // Generate available year-month combinations (current month + 2 previous months)
  const getAvailableMonths = () => {
    const availableMonths = [];
    
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const year = targetDate.getFullYear();
      const month = allMonths[targetDate.getMonth()];
      
      availableMonths.push({
        year: year,
        month: month,
        displayText: `${month} ${year}`
      });
    }
    
    return availableMonths;
  };

  const availableMonths = getAvailableMonths();
  const availableYears = [...new Set(availableMonths.map(item => item.year))];
  
  // Get months for selected year
  const getMonthsForYear = (selectedYear) => {
    return availableMonths
      .filter(item => item.year === parseInt(selectedYear))
      .map(item => item.month);
  };

  useEffect(() => {
    loadSalaries();
    loadStaffDesigners();
  }, []);

  const loadSalaries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/staff-designer-salaries');
      const data = await res.json();
      
      if (data.success) {
        setSalaries(data.salaries);
      } else {
        setError(data.message || 'Failed to load salaries');
      }
    } catch (err) {
      setError('Error loading salaries');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffDesigners = async () => {
    try {
      const res = await fetch('/api/staff-designer-salaries/staff-designers');
      const data = await res.json();
      
      if (data.success) {
        setStaffDesigners(data.staffDesigners);
      }
    } catch (err) {
      console.error('Error loading staff designers:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle numeric fields (excluding basicSalary which is now fixed)
    if (['allowances', 'taxPercentage', 'loanInstallments'].includes(name)) {
      // Only allow numbers
      if (value && !/^\d*\.?\d*$/.test(value)) return;
      
      // Apply specific validations
      if (name === 'taxPercentage' && parseFloat(value) > 100) return;
      if (name === 'loanInstallments' && parseFloat(value) > 30000) {
        alert('Loan installment cannot exceed basic salary (Rs. 30,000)');
        return;
      }
    }

    // Handle year change - clear month if not available for new year
    if (name === 'year') {
      const monthsForYear = getMonthsForYear(value);
      const currentMonth = formData.month;
      
      setFormData(prev => ({
        ...prev,
        year: value,
        month: monthsForYear.includes(currentMonth) ? currentMonth : ''
      }));
      return;
    }

    // Handle staff name/email auto-selection
    if (name === 'staffDesignerName') {
      const selectedStaff = staffDesigners.find(staff => staff.name === value);
      if (selectedStaff) {
        setFormData(prev => ({
          ...prev,
          staffDesignerName: value,
          staffDesignerEmail: selectedStaff.email
        }));
        return;
      }
    }

    if (name === 'staffDesignerEmail') {
      const selectedStaff = staffDesigners.find(staff => staff.email === value);
      if (selectedStaff) {
        setFormData(prev => ({
          ...prev,
          staffDesignerName: selectedStaff.name,
          staffDesignerEmail: value
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.staffDesignerName || !formData.staffDesignerEmail || 
        !formData.year || !formData.month) {
      alert('Please fill all required fields: Staff Name, Email, Year, and Month');
      return;
    }

    try {
      setSubmitting(true);
      
      const url = editingId 
        ? `/api/staff-designer-salaries/${editingId}`
        : '/api/staff-designer-salaries';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (editingId) {
          // Update existing salary in list
          setSalaries(prev => prev.map(s => s._id === editingId ? data.salary : s));
          alert('Salary record updated successfully!');
        } else {
          // Add new salary to list
          setSalaries(prev => [data.salary, ...prev]);
          alert('Salary record created successfully!');
        }
        
        setShowModal(false);
        setEditingId(null);
        setFormData({
          staffDesignerName: '',
          staffDesignerEmail: '',
          year: '',
          month: '',
          basicSalary: '30000', // Reset to fixed amount
          allowances: '',
          taxPercentage: '',
          loanInstallments: ''
        });
      } else {
        alert(data.message || `Failed to ${editingId ? 'update' : 'create'} salary record`);
      }
    } catch (err) {
      alert(`Error ${editingId ? 'updating' : 'creating'} salary record`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (salary) => {
    setEditingId(salary._id);
    setFormData({
      staffDesignerName: salary.staffDesignerName,
      staffDesignerEmail: salary.staffDesignerEmail,
      year: salary.year.toString(),
      month: salary.month,
      basicSalary: salary.basicSalary.toString(),
      allowances: salary.allowances.toString(),
      taxPercentage: salary.taxPercentage.toString(),
      loanInstallments: salary.loanInstallments.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (salaryId) => {
    if (!confirm('Are you sure you want to delete this salary record?')) {
      return;
    }

    try {
      setDeleting(salaryId);
      
      const res = await fetch(`/api/staff-designer-salaries/${salaryId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSalaries(prev => prev.filter(s => s._id !== salaryId));
        alert('Salary record deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete salary record');
      }
    } catch (err) {
      alert('Error deleting salary record');
    } finally {
      setDeleting(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      staffDesignerName: '',
      staffDesignerEmail: '',
      year: '',
      month: '',
      basicSalary: '30000', // Reset to fixed amount
      allowances: '',
      taxPercentage: '',
      loanInstallments: ''
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  // Filter salaries by Transaction ID
  const filteredSalaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return salaries;
    return salaries.filter(s => (s.transactionId || '').toString().toLowerCase().includes(q));
  }, [search, salaries]);

  return (
    <div className="staff-designer-salaries">
      <div className="page-header">
        <h1 className="page-title">Staff Designer Salaries</h1>
      </div>

      <div className="table-container">
        <div className="table-header">
          <input
            type="text"
            className="search-input"
            placeholder="Search by Transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search salaries by Transaction ID"
          />
          <button className="add-btn" onClick={() => setShowModal(true)}>
            Add
          </button>
        </div>

        {loading && <div className="loading-state">Loading salaries...</div>}
        {error && <div className="error-state">{error}</div>}

        {!loading && !error && salaries.length === 0 && (
          <div className="empty-state">
            <p>No salary records found.</p>
          </div>
        )}

        {!loading && !error && salaries.length > 0 && (
          <div className="salaries-table-wrapper">
            <table className="salaries-table">
              <thead>
                <tr>
                  <th>Staff Designer<br/>Name and Email</th>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Basic<br/>Salary</th>
                  <th>EPF<br/>(Company Share)</th>
                  <th>EPF<br/>(Employee Share)</th>
                  <th>ETF<br/>(Company<br/>Share)</th>
                  <th>Allowances</th>
                  <th>Tax</th>
                  <th>Loans</th>
                  <th>Gross<br/>Salary</th>
                  <th>Net<br/>Salary</th>
                  <th>Transaction<br/>ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', color: '#6c757d' }}>
                      No salary records match that Transaction ID
                    </td>
                  </tr>
                ) : (
                  filteredSalaries.map(salary => (
                    <tr key={salary._id}>
                      <td className="staff-info">
                        <div className="staff-name">{salary.staffDesignerName}</div>
                        <div className="staff-email">{salary.staffDesignerEmail}</div>
                      </td>
                      <td>{salary.month}</td>
                      <td>{salary.year}</td>
                      <td className="amount">{formatCurrency(salary.basicSalary)}</td>
                      <td className="amount">{formatCurrency(salary.epfCompanyShare)}</td>
                      <td className="amount">{formatCurrency(salary.epfEmployeeShare)}</td>
                      <td className="amount">{formatCurrency(salary.etfCompanyShare)}</td>
                      <td className="amount">{formatCurrency(salary.allowances)}</td>
                      <td className="amount">{formatCurrency(salary.taxAmount)}</td>
                      <td className="amount">{formatCurrency(salary.loanInstallments)}</td>
                      <td className="amount gross-salary">{formatCurrency(salary.grossSalary)}</td>
                      <td className="amount net-salary">{formatCurrency(salary.netSalary)}</td>
                      <td className="transaction-id">{salary.transactionId}</td>
                      <td className="actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(salary)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(salary._id)}
                          disabled={deleting === salary._id}
                          title="Delete"
                        >
                          {deleting === salary._id ? '⏳' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Salary Record' : 'Salary Info'}</h2>
              <button className="close-btn" onClick={handleModalClose}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="salary-form">
              <div className="form-group">
                <label>Staff Designer Name *</label>
                <select
                  name="staffDesignerName"
                  value={formData.staffDesignerName}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Staff Designer</option>
                  {staffDesigners.map(staff => (
                    <option key={staff._id} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Staff Designer Email *</label>
                <select
                  name="staffDesignerEmail"
                  value={formData.staffDesignerEmail}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Email</option>
                  {staffDesigners.map(staff => (
                    <option key={staff._id} value={staff.email}>{staff.email}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Year *</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Year</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Month * </label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.year}
                  >
                    <option value="">{formData.year ? 'Select Month' : 'Select Year First'}</option>
                    {formData.year && getMonthsForYear(formData.year).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  {!formData.year && (
                    <small style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      Available: {availableMonths.map(item => item.displayText).join(', ')}
                    </small>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Basic Salary (Fixed)</label>
                <div className="fixed-salary-display">
                  Rs. 30,000
                </div>
                
              </div>

              <div className="form-group">
                <label>Allowances</label>
                <input
                  type="text"
                  name="allowances"
                  value={formData.allowances}
                  onChange={handleInputChange}
                  placeholder="Enter allowances (optional)"
                />
              </div>

              <div className="form-group">
                <label>Tax Percentage (0-100%)</label>
                <input
                  type="text"
                  name="taxPercentage"
                  value={formData.taxPercentage}
                  onChange={handleInputChange}
                  placeholder="Enter tax percentage (optional)"
                />
              </div>

              <div className="form-group">
                <label>Loan Installments</label>
                <input
                  type="text"
                  name="loanInstallments"
                  value={formData.loanInstallments}
                  onChange={handleInputChange}
                  placeholder="Enter loan installments (optional)"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={submitting} className="submit-btn">
                  {submitting ? (editingId ? 'Updating...' : 'Submitting...') : (editingId ? 'Update' : 'Submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
