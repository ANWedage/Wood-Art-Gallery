import './MarketplaceIncome.css';
import React, { useEffect, useState } from 'react';

export default function MarketplaceIncome() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [releasing, setReleasing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/financial/marketplace-income');
      const data = await res.json();
      if (data.success) {
        setRows(data.rows);
        setTotals(data.totals);
      } else {
        setError(data.message || 'Failed to load data');
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const releasePayment = async (orderId, designId, orderItemId) => {
    if (!window.confirm('Release designer payment for this item?')) return;
    try {
      setReleasing(`${orderId}-${orderItemId || designId}`);
      const res = await fetch('/api/financial/release-designer-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, designId, orderItemId })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Failed to release payment');
      }
    } catch (err) {
      alert('Failed to release payment');
    } finally {
      setReleasing(null);
    }
  };

  const format = (n) => `Rs. ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="marketplace-income-section">
      <h1 className="financial-dashboard-title">Marketplace Income</h1>
      
      <div className="actions-bar">
        <button onClick={fetchData} className="refresh-btn">↻ Refresh</button>
      </div>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-box">{error}</div>}
      {!loading && !error && rows.length === 0 && <div className="no-data">No paid orders yet.</div>}
      {!loading && !error && rows.length > 0 && (
        <div className="table-wrapper">
          <table className="income-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item (Qty)</th>
                <th>Customer</th>
                <th>Designer</th>
                <th>Payment Method</th>
                <th>Total Price</th>
                <th>Delivery</th>
                <th>Item Price</th>
                <th>Commission (20%)</th>
                <th>Designer Payment (80%)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={`${r.orderId}-${r.orderItemId}`} className={r.released ? 'released-row' : ''}>
                  <td>{r.orderId}</td>
                  <td>{r.itemName} (x{r.quantity})</td>
                  <td>{r.customerName}<br/><span className="muted">{r.customerEmail}</span></td>
                  <td>{r.designerName}<br/><span className="muted">{r.designerEmail || 'N/A'}</span></td>
                  <td><span className={`pay-badge ${r.paymentMethod === 'cash_on_delivery' ? 'cod' : 'bank'}`}>{r.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}</span></td>
                  <td>{format(r.totalPrice)}</td>
                  <td>{format(r.deliveryFee)}</td>
                  <td>{format(r.itemPrice)}</td>
                  <td>{format(r.commission)}</td>
                  <td>{format(r.designerAmount)}</td>
                  <td>
                    {r.released ? (
                      <span className="released-badge">Released</span>
                    ) : (
                      <button 
                        className="release-btn" 
                        disabled={releasing === `${r.orderId}-${r.orderItemId}`}
                        onClick={() => releasePayment(r.orderId, r.designId, r.orderItemId)}
                      >
                        {releasing === `${r.orderId}-${r.orderItemId}` ? 'Releasing...' : 'Release'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {totals && (
              <tfoot>
                <tr>
                  <td colSpan="5" className="totals-label">Totals</td>
                  <td>{format(totals.totalPrice)}</td>
                  <td>{format(totals.delivery)}</td>
                  <td>{format(totals.itemPrice)}</td>
                  <td>{format(totals.commission)}</td>
                  <td>{format(totals.designerPayment)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
