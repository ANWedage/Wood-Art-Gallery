import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './PaymentHistory.css';

export default function PaymentHistory(){
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(()=>{ if(user?.email){ fetchPayments(); } }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`/api/financial/designer-payment-history/${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if(data.success){ setPayments(data.payments); } else { setError(data.message || 'Failed to load'); }
    } catch(err){ setError('Failed to load'); } finally { setLoading(false); }
  };

  const format = n => `Rs. ${Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`;
  const formatDate = d => new Date(d).toLocaleDateString('en-US',{ year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

  if(loading) return <div className="payment-history-box loading-box">Loading...</div>;
  if(error) return <div className="payment-history-box error-box">{error}</div>;

  return (
    <div className="payment-history-box">
      <h1 className="designer-dashboard-title">Payment History</h1>
      <button className="refresh-btn" onClick={fetchPayments}>↻ Refresh</button>
      {payments.length === 0 ? (
        <div className="no-payments">No payments released yet.</div>
      ) : (
        <div className="payment-table-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item (Qty)</th>
                <th>Your Payment</th>
                <th>Company Commission</th>
                <th>Payment ID</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>{p.orderId}</td>
                  <td>{p.itemName} (x{p.quantity})</td>
                  <td>{format(p.designerAmount)}</td>
                  <td>{format(p.commission)}</td>
                  <td>{p._id.slice(-8)}</td>
                  <td>{formatDate(p.releasedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
