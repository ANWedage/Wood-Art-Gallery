import React, { useState, useEffect } from 'react';
import FinancialNavbar from '../../components/Navbar/FinancialNavbar';
import './Dashboard.css';
import MarketplaceIncome from './MarketplaceIncome';
import CustomizeOrderIncome from './CustomizeOrderIncome';

export default function FinancialDashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [pendingBankSlips, setPendingBankSlips] = useState([]);
  const [loadingBankSlips, setLoadingBankSlips] = useState(false);

  // Fetch pending bank slips when bank slip approval page is active
  useEffect(() => {
    if (activePage === 'bank-slip-approval') {
      fetchPendingBankSlips();
    }
  }, [activePage]);

  const fetchPendingBankSlips = async () => {
    setLoadingBankSlips(true);
    try {
      const response = await fetch('http://localhost:5000/api/bankSlip/pending');
      const data = await response.json();
      if (data.success) {
        setPendingBankSlips(data.bankSlips);
      } else {
        console.error('Failed to fetch pending bank slips:', data.message);
      }
    } catch (error) {
      console.error('Error fetching pending bank slips:', error);
    } finally {
      setLoadingBankSlips(false);
    }
  };

  const handleBankSlipAction = async (orderId, action, notes = '') => {
    try {
      const response = await fetch(`http://localhost:5000/api/bankSlip/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: action,
          notes: notes
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Bank slip ${action === 'paid' ? 'approved' : 'denied'} successfully!`);
        // Refresh the list
        fetchPendingBankSlips();
      } else {
        alert('Failed to update bank slip: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating bank slip:', error);
      alert('Failed to update bank slip. Please try again.');
    }
  };

  const downloadBankSlip = async (orderId) => {
    try {
      window.open(`http://localhost:5000/api/bankSlip/${orderId}/download-slip`, '_blank');
    } catch (error) {
      console.error('Error downloading bank slip:', error);
      alert('Failed to download bank slip.');
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

  const renderContent = () => {
    switch(activePage) {
      case 'overview':
        return (
          <div className="financial-overview">
            <h1 className="financial-dashboard-title">Overview</h1>
            <div className="financial-stats">
              <div className="financial-stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>Total Revenue</h3>
                  <p className="stat-amount">Rs. 125,000</p>
                </div>
              </div>
              <div className="financial-stat-card expenses">
                <div className="stat-icon">💸</div>
                <div className="stat-info">
                  <h3>Total Expenses</h3>
                  <p className="stat-amount">Rs. 45,000</p>
                </div>
              </div>
              <div className="financial-stat-card profit">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>Net Profit</h3>
                  <p className="stat-amount">Rs. 80,000</p>
                </div>
              </div>
              <div className="financial-stat-card invoices">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>Pending Invoices</h3>
                  <p className="stat-amount">8</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'marketplace-income':
        return (
          <MarketplaceIncome />
        );
      case 'customize-order-income':
        return <CustomizeOrderIncome />;
      case 'staff-designer-salaries':
        return (
          <div className="staff-designer-salaries">
            <h1 className="financial-dashboard-title">Staff Designer Salaries</h1>
            <p>Manage and track staff designer salary payments.</p>
          </div>
        );
      case 'supplier-payments':
        return (
          <div className="supplier-payments">
            <h1 className="financial-dashboard-title">Supplier Payments</h1>
            <p>Handle supplier payment transactions and records.</p>
          </div>
        );
      case 'delivery-payments':
        return (
          <div className="delivery-payments">
            <h1 className="financial-dashboard-title">Delivery Payments</h1>
            <p>Manage delivery service payments and fees.</p>
          </div>
        );
      case 'bank-slip-approval':
        return (
          <div className="bank-slip-approval">
            <h1 className="financial-dashboard-title">Bank Slip Approval</h1>
            <p>Review and approve bank slips and payment confirmations.</p>
            
            {loadingBankSlips ? (
              <div className="loading">Loading bank slips...</div>
            ) : pendingBankSlips.length === 0 ? (
              <div className="no-data">
                <p>No pending bank slips for approval.</p>
              </div>
            ) : (
              <div className="bank-slips-container">
                {pendingBankSlips.map((order) => (
                  <div key={order._id} className="bank-slip-card">
                    <div className="slip-header">
                      <h3>Order ID: {order.orderId || order._id}</h3>
                      <span className="slip-date">{formatDate(order.createdAt)}</span>
                    </div>
                    
                    <div className="slip-details">
                      <div className="customer-info">
                        <div className="info-row">
                          <strong>Customer Name:</strong> {order.customerName}
                        </div>
                        <div className="info-row">
                          <strong>Customer Email:</strong> {order.customerEmail}
                        </div>
                        <div className="info-row">
                          <strong>Payment Date:</strong> {formatDate(order.createdAt)}
                        </div>
                        <div className="info-row">
                          <strong>Order Type:</strong> {order.orderType === 'custom' ? 'Customize Order' : 'Marketplace Order'}
                        </div>
                        {order.orderType === 'custom' ? (
                          <>
                            <div className="info-row">
                              <strong>Subtotal:</strong> Rs. {(order.estimatedPrice || 0).toLocaleString()}
                            </div>
                            <div className="info-row">
                              <strong>Delivery Fee:</strong> Rs. {(order.deliveryFee || 250).toLocaleString()}
                            </div>
                            <div className="info-row">
                              <strong>Total Amount:</strong> Rs. {((order.estimatedPrice || 0) + (order.deliveryFee || 250)).toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="info-row">
                              <strong>Subtotal:</strong> Rs. {(order.totalAmount || 0).toLocaleString()}
                            </div>
                            <div className="info-row">
                              <strong>Delivery Fee:</strong> Rs. {(order.deliveryFee || 250).toLocaleString()}
                            </div>
                            <div className="info-row">
                              <strong>Total Amount:</strong> Rs. {((order.totalAmount || 0) + (order.deliveryFee || 250)).toLocaleString()}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {order.bankSlipUrl && (
                        <div className="slip-actions">
                          <button 
                            className="view-slip-btn"
                            onClick={() => downloadBankSlip(order._id)}
                          >
                            View Bank Slip
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="slip-approval-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleBankSlipAction(order._id, 'paid')}
                      >
                        Approve
                      </button>
                      <button 
                        className="deny-btn"
                        onClick={() => {
                          
                          handleBankSlipAction(order._id, 'failed');
                        }}
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'report-generate':
        return (
          <div className="report-generate">
            <h1 className="financial-dashboard-title">Report Generate</h1>
            <p>Generate comprehensive financial reports and analytics.</p>
          </div>
        );
      default:
        return (
          <div className="financial-overview">
            <h1 className="financial-dashboard-title">Overview</h1>
          </div>
        );
    }
  };

  return (
    <>
      <FinancialNavbar />
      <div className="financial-dashboard-root">
        <aside className="financial-sidebar">
          <div className="sidebar-header">
            <h2>Financial Management</h2>
          </div>
          <ul>
            <li className={activePage === 'overview' ? 'active' : ''} onClick={() => setActivePage('overview')}>
              <div className="menu-icon">�</div>
              <span>Overview</span>
            </li>
            <li className={activePage === 'marketplace-income' ? 'active' : ''} onClick={() => setActivePage('marketplace-income')}>
              <div className="menu-icon">🛒</div>
              <span>Marketplace Income</span>
            </li>
            <li className={activePage === 'customize-order-income' ? 'active' : ''} onClick={() => setActivePage('customize-order-income')}>
              <div className="menu-icon">🎨</div>
              <span>Customize Order Income</span>
            </li>
            <li className={activePage === 'staff-designer-salaries' ? 'active' : ''} onClick={() => setActivePage('staff-designer-salaries')}>
              <div className="menu-icon">👨‍💼</div>
              <span>Staff Designer Salaries</span>
            </li>
            <li className={activePage === 'supplier-payments' ? 'active' : ''} onClick={() => setActivePage('supplier-payments')}>
              <div className="menu-icon">🏭</div>
              <span>Supplier Payments</span>
            </li>
            <li className={activePage === 'delivery-payments' ? 'active' : ''} onClick={() => setActivePage('delivery-payments')}>
              <div className="menu-icon">🚚</div>
              <span>Delivery Payments</span>
            </li>
            <li className={activePage === 'bank-slip-approval' ? 'active' : ''} onClick={() => setActivePage('bank-slip-approval')}>
              <div className="menu-icon">🏦</div>
              <span>Bank Slip Approval</span>
            </li>
            <li className={activePage === 'report-generate' ? 'active' : ''} onClick={() => setActivePage('report-generate')}>
              <div className="menu-icon">📄</div>
              <span>Report Generate</span>
            </li>
          </ul>
        </aside>
        <main className="financial-dashboard-main">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
