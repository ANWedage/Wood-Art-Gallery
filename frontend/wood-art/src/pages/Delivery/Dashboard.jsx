import React, { useState, useEffect } from 'react';
import DeliveryNavbar from '../../components/Navbar/DeliveryNavbar';
import PaymentSection from './PaymentSection';
import './Dashboard.css';

export default function DeliveryDashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [activeSub, setActiveSub] = useState(null);

  // Orders shown in marketplace sub-sections
  const [marketplaceOrders, setMarketplaceOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Real-time overview data
  const [overviewData, setOverviewData] = useState({
    readyToDelivery: 0,
    onTheDelivery: 0,
    completedDelivery: 0,
    totalRevenue: 0
  });
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Fetch real-time overview data
  const fetchOverviewData = async () => {
    try {
      setOverviewLoading(true);
      const response = await fetch('http://localhost:5000/api/delivery/overview');
      const data = await response.json();
      
      if (data.success) {
        setOverviewData(data.data);
      } else {
        console.error('Failed to fetch overview data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  // Auto-refresh overview data every 30 seconds when on overview page
  useEffect(() => {
    if (activePage === 'overview') {
      fetchOverviewData();
      const interval = setInterval(fetchOverviewData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [activePage]);

  useEffect(() => {
    // Check if it's a marketplace view
    const isMarketplaceView = [
      'ready-marketplace',
      'on-marketplace',
      'completed-marketplace'
    ].includes(activeSub);

    // Check if it's a custom orders view
    const isCustomView = [
      'ready-custom',
      'on-custom',
      'completed-custom'
    ].includes(activeSub);

    if (isMarketplaceView) {
      const sectionMap = {
        'ready-marketplace': 'ready',
        'on-marketplace': 'on',
        'completed-marketplace': 'completed'
      };

      const fetchOrders = async () => {
        try {
          setOrdersLoading(true);
          setOrdersError(null);

          const section = sectionMap[activeSub] || 'ready';
          const res = await fetch(`http://localhost:5000/api/orders/delivery/marketplace?section=${section}`);
          const data = await res.json();

          if (data.success) {
            setMarketplaceOrders(data.orders || []);
          } else {
            setOrdersError(data.message || 'Failed to fetch orders');
          }
        } catch (err) {
          console.error('Error fetching delivery marketplace orders:', err);
          setOrdersError('Error fetching orders. Please try again.');
        } finally {
          setOrdersLoading(false);
        }
      };

      fetchOrders();
    } else if (isCustomView) {
      const sectionMap = {
        'ready-custom': 'ready',
        'on-custom': 'on',
        'completed-custom': 'completed'
      };

      const fetchCustomOrders = async () => {
        try {
          setOrdersLoading(true);
          setOrdersError(null);

          const section = sectionMap[activeSub] || 'ready';
          console.log('Fetching custom orders for section:', section);
          const res = await fetch(`http://localhost:5000/api/customOrder/delivery/custom?section=${section}`);
          const data = await res.json();
          console.log('Custom orders response:', data);

          if (data.success) {
            console.log('Custom orders received:', data.orders?.length || 0);
            setCustomOrders(data.orders || []);
          } else {
            setOrdersError(data.message || 'Failed to fetch custom orders');
          }
        } catch (err) {
          console.error('Error fetching delivery custom orders:', err);
          setOrdersError('Error fetching custom orders. Please try again.');
        } finally {
          setOrdersLoading(false);
        }
      };

      fetchCustomOrders();
    }
  }, [activeSub]);

  const handlePickItem = async (orderId, isCustomOrder = false) => {
    if (!window.confirm('Mark this item as picked and move it to On the Delivery?')) return;

    try {
      const endpoint = isCustomOrder 
        ? `http://localhost:5000/api/customOrder/${orderId}/delivery-status`
        : 'http://localhost:5000/api/orders/update-status';
      
      const body = isCustomOrder
        ? { deliveryStatus: 'picked_up' }
        : { orderId, deliveryStatus: 'picked_up' };

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        alert('Item marked as picked. It will appear in On the Delivery.');
        // refresh list
        const prev = activeSub;
        setActiveSub(null);
        // small delay to ensure backend updated before refetch
        setTimeout(() => setActiveSub(prev), 250);
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating delivery status:', err);
      alert('Error updating status. Please try again.');
    }
  };

  const handleCollectCash = async (orderId) => {
    if (!window.confirm('Confirm cash collected for this order?')) return;
    try {
      const res = await fetch('http://localhost:5000/api/orders/collect-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cash collection recorded. Marketplace income will be updated.');
        // refresh table
        const prev = activeSub;
        setActiveSub(null);
        setTimeout(() => setActiveSub(prev), 200);
      } else {
        alert(data.message || 'Failed to record cash collection');
      }
    } catch (err) {
      console.error('Error collecting cash:', err);
      alert('Error recording cash collection');
    }
  };

  const handleCollectCashCustom = async (orderId) => {
    if (!window.confirm('Confirm cash collected for this custom order?')) return;
    try {
      const res = await fetch('http://localhost:5000/api/customOrder/collect-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cash collection recorded for custom order.');
        // refresh table
        const prev = activeSub;
        setActiveSub(null);
        setTimeout(() => setActiveSub(prev), 200);
      } else {
        alert(data.message || 'Failed to record cash collection');
      }
    } catch (err) {
      console.error('Error collecting cash for custom order:', err);
      alert('Error recording cash collection');
    }
  };

  // Mark delivered (called by delivery user in On the Delivery view)
  const handleMarkDelivered = async (orderId, isCustomOrder = false) => {
    if (!window.confirm('Mark this item as delivered and move it to Completed Delivery?')) return;
    try {
      const endpoint = isCustomOrder 
        ? `http://localhost:5000/api/customOrder/${orderId}/delivery-status`
        : 'http://localhost:5000/api/orders/update-status';
      
      const body = isCustomOrder
        ? { deliveryStatus: 'delivered' }
        : { orderId, deliveryStatus: 'delivered' };

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Item marked as delivered. It will appear in Completed Delivery.');
        // refresh the view
        const prev = activeSub;
        setActiveSub(null);
        setTimeout(() => setActiveSub(prev), 250);
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error marking delivered:', err);
      alert('Error updating status. Please try again.');
    }
  };

  // Date formatting utility for display
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  const renderCustomOrdersTable = (section) => {
    if (ordersLoading) return <div className="loading">Loading custom orders...</div>;
    if (ordersError) return <div className="error">{ordersError}</div>;
    if (!customOrders || customOrders.length === 0) return <div className="no-data">No custom orders found.</div>;

    return (
      <div className="custom-orders-table-wrap">
        <table className="custom-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Customer Phone</th>
              <th>Customer Address</th>
              <th>Payment Method</th>
              {section === 'on' && <th>Collect Money</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customOrders.map((order) => (
              <tr key={order._id}>
                <td>{order.orderId || `#${order._id.slice(-8)}`}</td>
                <td>{order.customerName}</td>
                <td>{order.customerPhone || '—'}</td>
                <td style={{ maxWidth: 200 }}>
                  {order.customerAddress || 'No address available'}
                </td>
                <td>{order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Bank Transfer'}</td>
                {section === 'on' && (
                  <td>
                    {order.paymentMethod === 'cash' ? (
                      order.cashCollected ? (
                        <span className="collected-badge">Collected</span>
                      ) : (
                        <button 
                          className="collect-cash-btn" 
                          onClick={() => handleCollectCashCustom(order.orderId || order._id)}
                        >
                          Cash collected
                        </button>
                      )
                    ) : (
                      <span className="paid-badge">Paid</span>
                    )}
                  </td>
                )}
                <td>
                  {section === 'ready' ? (
                    <button 
                      className="item-picked-button" 
                      onClick={() => handlePickItem(order.orderId || order._id, true)}
                    >
                      Item picked
                    </button>
                  ) : (
                    section === 'on' ? (
                      <button 
                        className={`delivered-btn ${
                          order.paymentMethod === 'cash' && !order.cashCollected 
                            ? 'disabled' 
                            : ''
                        }`}
                        onClick={() => handleMarkDelivered(order.orderId || order._id, true)}
                        disabled={order.paymentMethod === 'cash' && !order.cashCollected}
                        title={
                          order.paymentMethod === 'cash' && !order.cashCollected
                            ? 'Please collect cash before marking as delivered'
                            : 'Mark as delivered'
                        }
                      >
                        Delivered
                      </button>
                    ) : (
                      <span className="status-label">Delivered</span>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMarketplaceTable = (section) => {
    if (ordersLoading) return <div className="loading">Loading orders...</div>;
    if (ordersError) return <div className="error">{ordersError}</div>;
    if (!marketplaceOrders || marketplaceOrders.length === 0) return <div className="no-data">No orders found.</div>;

    // Render one row per order item so each designer/item is visible separately
    const rows = [];
    marketplaceOrders.forEach(order => {
      (order.items || []).forEach(item => {
        rows.push({ order, item });
      });
    });

    return (
      <div className="marketplace-table-wrap">
        <table className="marketplace-table2">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Item Name</th>
              <th>Customer Name</th>
              <th>Customer Phone</th>
              <th>Customer Address</th>
              <th>Designer Name</th>
              <th>Designer Phone</th>
              <th>Designer Address</th>
              <th>Payment Method</th>
              {section === 'on' && <th>Collect Money</th>}
              {section === 'completed' && <th>Delivered Date</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.order.orderId}-${idx}`}>
                <td>{r.order.orderId}</td>
                <td>{r.item.itemName}</td>
                <td>{r.order.customerName || r.order.customer?.name}</td>
                <td>{r.order.customerPhone || r.order.customer?.phone || '—'}</td>
                <td style={{ maxWidth: 200 }}>{r.order.customerAddress || r.order.customer?.address || '—'}</td>
                <td>{(r.item.designerId && r.item.designerId.name) || r.item.designerName}</td>
                <td>{(r.item.designerId && r.item.designerId.phone) || '—'}</td>
                <td>{(r.item.designerId && r.item.designerId.address) || '—'}</td>
                <td>{r.order.paymentMethod === 'cash_on_delivery' || r.order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Bank Transfer'}</td>
                {section === 'on' && (
                  <td>
                    {r.order.paymentMethod === 'cash_on_delivery' || r.order.paymentMethod === 'cash' ? (
                      r.order.cashCollected ? (
                        <span className="collected-badge">Collected</span>
                      ) : (
                        <button className="collect-cash-btn" onClick={() => handleCollectCash(r.order.orderId)}>Cash collected</button>
                      )
                    ) : (
                      <span className="paid-badge">Paid</span>
                    )}
                  </td>
                )}
                {section === 'completed' && (
                  <td>{formatDateTime(r.order.deliveryDate || r.order.updatedAt || r.order.updated_at)}</td>
                )}
                <td>
                  {section === 'ready' ? (
                    <button className="item-picked-button" onClick={() => handlePickItem(r.order.orderId)}>Item picked</button>
                  ) : (
                    // For on show Delivered button; for completed show label
                    section === 'on' ? (
                      <button 
                        className={`delivered-btn ${
                          (r.order.paymentMethod === 'cash_on_delivery' || r.order.paymentMethod === 'cash') && !r.order.cashCollected 
                            ? 'disabled' 
                            : ''
                        }`}
                        onClick={() => handleMarkDelivered(r.order.orderId)}
                        disabled={
                          (r.order.paymentMethod === 'cash_on_delivery' || r.order.paymentMethod === 'cash') && !r.order.cashCollected
                        }
                        title={
                          (r.order.paymentMethod === 'cash_on_delivery' || r.order.paymentMethod === 'cash') && !r.order.cashCollected
                            ? 'Please collect cash before marking as delivered'
                            : 'Mark as delivered'
                        }
                      >
                        Delivered
                      </button>
                    ) : (
                      <span className="status-label">Delivered</span>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    // Overview
    if (activePage === 'overview') {
      return (
        <div className="delivery-overview">
          <div className="overview-header">
            <div className="header-content">
              <h1 className="delivery-dashboard-title">Delivery Overview</h1>
              <button 
                className="refresh-btn" 
                onClick={fetchOverviewData}
                disabled={overviewLoading}
              >
                <span className={`refresh-icon ${overviewLoading ? 'spinning' : ''}`}>🔄</span>
                Refresh
              </button>
            </div>
          </div>

          <div className="delivery-stats-grid">
            <div className="delivery-stat-card ready-to-delivery">
              <div className="card-background"></div>
              <div className="stat-icon-container">
                <div className="stat-icon">📦</div>
                <div className="icon-pulse"></div>
              </div>
              <div className="stat-content">
                <h3>Ready to Delivery</h3>
                <div className="stat-amount">
                  {overviewLoading ? (
                    <div className="loading-skeleton"></div>
                  ) : (
                    <span className="counter" data-target={overviewData.readyToDelivery}>
                      {overviewData.readyToDelivery}
                    </span>
                  )}
                </div>
                <p className="stat-label">Orders awaiting pickup</p>
              </div>
              <div className="stat-trend">
                <span className="trend-arrow up">↗</span>
                
              </div>
            </div>

            <div className="delivery-stat-card on-delivery">
              <div className="card-background"></div>
              <div className="stat-icon-container">
                <div className="stat-icon">🚛</div>
                <div className="icon-pulse"></div>
              </div>
              <div className="stat-content">
                <h3>On the Delivery</h3>
                <div className="stat-amount">
                  {overviewLoading ? (
                    <div className="loading-skeleton"></div>
                  ) : (
                    <span className="counter" data-target={overviewData.onTheDelivery}>
                      {overviewData.onTheDelivery}
                    </span>
                  )}
                </div>
                <p className="stat-label">Orders in transit</p>
              </div>
              <div className="stat-trend">
                <span className="trend-arrow neutral">→</span>
                
              </div>
            </div>

            <div className="delivery-stat-card completed">
              <div className="card-background"></div>
              <div className="stat-icon-container">
                <div className="stat-icon">✅</div>
                <div className="icon-pulse"></div>
              </div>
              <div className="stat-content">
                <h3>Completed Delivery</h3>
                <div className="stat-amount success">
                  {overviewLoading ? (
                    <div className="loading-skeleton"></div>
                  ) : (
                    <span className="counter" data-target={overviewData.completedDelivery}>
                      {overviewData.completedDelivery}
                    </span>
                  )}
                </div>
                <p className="stat-label">Successfully delivered today</p>
              </div>
              <div className="stat-trend">
                <span className="trend-arrow up">↗</span>
                
              </div>
            </div>



            <div className="delivery-stat-card revenue">
              <div className="card-background"></div>
              <div className="stat-icon-container">
                <div className="stat-icon">📈</div>
                <div className="icon-pulse"></div>
              </div>
              <div className="stat-content">
                <h3>Total Revenue</h3>
                <div className="stat-amount success">
                  {overviewLoading ? (
                    <div className="loading-skeleton"></div>
                  ) : (
                    <span className="counter" data-target={overviewData.totalRevenue}>
                      Rs. {overviewData.totalRevenue.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="stat-label">From released payments</p>
              </div>
              <div className="stat-trend">
                <span className="trend-arrow up">↗</span>
                
              </div>
            </div>


          </div>

          <div className="quick-actions">
            <h2 className="section-title">Quick Actions</h2>
            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={() => { setActivePage('ready-to-delivery'); setActiveSub('ready-marketplace'); }}
              >
                <span className="btn-icon">📦</span>
                View Ready Orders
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => { setActivePage('on-the-delivery'); setActiveSub('on-marketplace'); }}
              >
                <span className="btn-icon">🚛</span>
                Track Deliveries
              </button>
              <button 
                className="action-btn tertiary"
                onClick={() => setActivePage('payments')}
              >
                <span className="btn-icon">💰</span>
                 Payments
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Ready to Delivery
    if (activePage === 'ready-to-delivery') {
      if (activeSub === 'ready-marketplace') {
        return (
          <div className="ready-to-delivery">
            <h1 className="delivery-dashboard-title2">Ready to Delivery — Marketplace Orders</h1>
            
            {renderMarketplaceTable('ready')}
          </div>
        );
      }

      if (activeSub === 'ready-custom') {
        return (
          <div className="ready-to-delivery">
            <h1 className="delivery-dashboard-title2">Ready to Delivery — Custom Orders</h1>
            <p>Custom orders that have been completed by designers and are ready for delivery pickup.</p>
            {renderCustomOrdersTable('ready')}
          </div>
        );
      }

      return (
        <div className="ready-to-delivery">
          <h1 className="delivery-dashboard-title2">Ready to Delivery</h1>
          <p>Orders that are ready for delivery pickup and assignment.</p>
        </div>
      );
    }

    // On the Delivery
    if (activePage === 'on-the-delivery') {
      if (activeSub === 'on-marketplace') {
        return (
          <div className="on-the-delivery">
            <h1 className="delivery-dashboard-title2">On the Delivery — Marketplace Orders</h1>
            <p>Track marketplace orders currently being delivered and in transit.</p>
            {renderMarketplaceTable('on')}
          </div>
        );
      }

      if (activeSub === 'on-custom') {
        return (
          <div className="on-the-delivery">
            <h1 className="delivery-dashboard-title2">On the Delivery — Custom Orders</h1>
            <p>Track custom orders currently being delivered and in transit.</p>
            {renderCustomOrdersTable('on')}
          </div>
        );
      }

      return (
        <div className="on-the-delivery">
          <h1 className="delivery-dashboard-title2">On the Delivery</h1>
          <p>Track orders currently being delivered and in transit.</p>
        </div>
      );
    }

    // Completed Delivery
    if (activePage === 'completed-delivery') {
      if (activeSub === 'completed-marketplace') {
        return (
          <div className="completed-delivery">
            <h1 className="delivery-dashboard-title2">Completed Delivery — Marketplace Orders</h1>
            <p>View and manage successfully completed marketplace deliveries.</p>
            {renderMarketplaceTable('completed')}
          </div>
        );
      }

      if (activeSub === 'completed-custom') {
        return (
          <div className="completed-delivery">
            <h1 className="delivery-dashboard-title2">Completed Delivery — Custom Orders</h1>
            <p>View and manage successfully completed custom order deliveries.</p>
            {renderCustomOrdersTable('completed')}
          </div>
        );
      }

      return (
        <div className="completed-delivery">
          <h1 className="delivery-dashboard-title2">Completed Delivery</h1>
          <p>View and manage successfully completed deliveries.</p>
        </div>
      );
    }

    // Payments
    if (activePage === 'payments') {
      return <PaymentSection />;
    }

    // Fallback
    return (
      <div className="delivery-overview">
        <h1 className="delivery-dashboard-title2">Overview</h1>
      </div>
    );
  };

  return (
    <>
      <DeliveryNavbar />
      <div className="delivery-dashboard-root">
        <aside className="delivery-sidebar">
          <div className="sidebar-header">
            <h2>Delivery Management</h2>
          </div>
          <ul>
            <li className={activePage === 'overview' ? 'active' : ''} onClick={() => { setActivePage('overview'); setActiveSub(null); }}>
              <div className="menu-icon">📊</div>
              <span>Overview</span>
            </li>

            
            <li className={activePage === 'ready-to-delivery' ? 'active parent' : 'parent'} onClick={() => { setActivePage('ready-to-delivery'); setActiveSub(null); }}>
              <div className="menu-icon">📦</div>
              <span>Ready to Delivery</span>
              {(activePage === 'ready-to-delivery') && (
                <ul className="submenu">
                  <li className={activeSub === 'ready-marketplace' ? 'sub-active' : ''} onClick={(e) => { e.stopPropagation(); setActivePage('ready-to-delivery'); setActiveSub('ready-marketplace'); }}>
                    <div className="menu-icon">🛒</div>
                    <span>Marketplace Orders</span>
                  </li>
                  <li className={activeSub === 'ready-custom' ? 'sub-active' : ''} onClick={(e) => { e.stopPropagation(); setActivePage('ready-to-delivery'); setActiveSub('ready-custom'); }}>
                    <div className="menu-icon">🖼️</div>
                    <span>Custom Orders</span>
                  </li>
                </ul>
              )}
            </li>

            
            <li className={activePage === 'on-the-delivery' ? 'active parent' : 'parent'} onClick={() => { setActivePage('on-the-delivery'); setActiveSub(null); }}>
              <div className="menu-icon">🚛</div>
              <span>On the Delivery</span>
              {(activePage === 'on-the-delivery') && (
                <ul className="submenu">
                  <li className={activeSub === 'on-marketplace' ? 'sub-active' : ''} onClick={(e) => { e.stopPropagation(); setActivePage('on-the-delivery'); setActiveSub('on-marketplace'); }}>
                    <div className="menu-icon">🛒</div>
                    <span>Marketplace Orders</span>
                  </li>
                  <li className={activeSub === 'on-custom' ? 'sub-active' : ''} onClick={(e) => { e.stopPropagation(); setActivePage('on-the-delivery'); setActiveSub('on-custom'); }}>
                    <div className="menu-icon">🖼️</div>
                    <span>Custom Orders</span>
                  </li>
                </ul>
              )}
            </li>

            
            <li className={activePage === 'completed-delivery' ? 'active parent' : 'parent'} onClick={() => { setActivePage('completed-delivery'); setActiveSub(null); }}>
              <div className="menu-icon">✅</div>
              <span>Completed Delivery</span>
              {(activePage === 'completed-delivery') && (
                <ul className="submenu">
                  <li className={activeSub === 'completed-marketplace' ? 'sub-active' : ''} onClick={(e) => { e.stopPropagation(); setActivePage('completed-delivery'); setActiveSub('completed-marketplace'); }}>
                    <div className="menu-icon">🛒</div>
                    <span>Marketplace Orders</span>
                  </li>
                  <li className={activeSub === 'completed-custom' ? 'sub-active' : ''} onClick={(e) => { e.stopPropagation(); setActivePage('completed-delivery'); setActiveSub('completed-custom'); }}>
                    <div className="menu-icon">🖼️</div>
                    <span>Custom Orders</span>
                  </li>
                </ul>
              )}
            </li>

            <li className={activePage === 'payments' ? 'active' : ''} onClick={() => { setActivePage('payments'); setActiveSub(null); }}>
              <div className="menu-icon">💰</div>
              <span>Payments</span>
            </li>
          </ul>
        </aside>

        <main className="delivery-dashboard-main">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
