import React, { useState, useEffect, useMemo } from 'react';
import './SupplierPayments.css';

export default function SupplierPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/supplier-payments');
      const data = await res.json();
      
      if (data.success) {
        setPayments(data.payments);
      } else {
        setError(data.message || 'Failed to load payments');
      }
    } catch (err) {
      setError('Error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter by Transaction ID (client-side)
  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(p => (p.transactionId || '').toString().toLowerCase().includes(q));
  }, [search, payments]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((total, payment) => total + (payment.paidAmount || 0), 0);
  }, [filteredPayments]);

  return (
    <div className="supplier-payments">
      <div className="page-header">
        <h1 className="page-title">Supplier Payments</h1>
      </div>

      <div className="payments-table-header">
        <input
          type="text"
          className="search-input"
          placeholder="Search by Transaction ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search supplier payments by Transaction ID"
        />
      </div>

      {loading && <div className="loading-state">Loading payments...</div>}
      {error && <div className="error-state">{error}</div>}

      {!loading && !error && payments.length === 0 && (
        <div className="empty-state">
          <p>No supplier payments found.</p>
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <div className="payments-table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Supplier Email</th>
                <th>Item</th>
                <th>Color</th>
                <th>Size</th>
                <th>Thickness</th>
                <th>Quantity</th>
                <th>Paid Amount</th>
                <th>Transaction Date</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', color: '#6c757d' }}>
                    No supplier payments match that Transaction ID
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment._id}>
                    <td className="supplier-name">{payment.supplierName}</td>
                    <td className="supplier-email">{payment.supplierEmail}</td>
                    <td>{payment.item}</td>
                    <td>{payment.color}</td>
                    <td>{payment.size}</td>
                    <td>{payment.thickness}</td>
                    <td className="quantity">{payment.quantity}</td>
                    <td className="amount">Rs. {Number(payment.paidAmount || 0).toLocaleString()}</td>
                    <td className="date">{formatDate(payment.transactionDate)}</td>
                    <td className="transaction-id">{payment.transactionId}</td>
                    <td>
                      <span className={`status-badge status-${payment.status}`}>
                        {payment.status && payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="table-summary">
            <div className="summary-row">
              <span>Showing {filteredPayments.length} payments</span>
              <span className="total-amount">
                Total Amount: <strong>Rs. {totalAmount.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
