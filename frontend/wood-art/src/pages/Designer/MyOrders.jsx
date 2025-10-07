import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './MyOrders.css';
import jsPDF from 'jspdf';
import logo from '../../assets/logo.png';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notifyingDelivery, setNotifyingDelivery] = useState(null);
  // Add search state for filtering orders by Order ID
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.email) {
      fetchDesignerOrders(user.email);
    }
  }, [user?.email]);

  const fetchDesignerOrders = async (email) => {
    try {
      if (!email) return;
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/orders/designer/${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching designer orders:', err);
      setError('Error fetching orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `Rs. ${parseFloat(price).toFixed(2)}`;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'preparing': return '#8b5cf6';
      case 'ready_for_delivery': return '#10b981';
      case 'delivered': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case 'not_assigned': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'picked_up': return '#8b5cf6';
      case 'in_transit': return '#10b981';
      case 'delivered': return '#059669';
      default: return '#6b7280';
    }
  };

  const handleNotifyDelivery = async (orderId) => {
    try {
      setNotifyingDelivery(orderId);

      const response = await fetch('http://localhost:5000/api/orders/notify-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          designerEmail: user.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Delivery team has been notified successfully!');
        // Refresh orders to show updated status
        fetchDesignerOrders();
      } else {
        alert(data.message || 'Failed to notify delivery team');
      }
    } catch (error) {
      console.error('Error notifying delivery:', error);
      alert('Error notifying delivery team. Please try again.');
    } finally {
      setNotifyingDelivery(null);
    }
  };

  // Handlers and memo for searching by Order ID
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const clearSearch = () => setSearchTerm('');
  const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filteredOrders = React.useMemo(() => {
    const nq = normalize(searchTerm.trim());
    if (!nq) return orders;
    return orders.filter(o => {
      const id1 = normalize(o.orderId);
      const id2 = normalize(o._id);
      return id1.includes(nq) || id2.includes(nq);
    });
  }, [orders, searchTerm]);

  // Generate PDF Orders Report
  const generatePDFReport = async () => {
    try {
      // Convert logo to base64 for embedding in PDF
      const logoBase64 = await fetch(logo)
        .then(response => response.blob())
        .then(blob => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        }));

      // Create new PDF document
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      let yPos = 8;
      const leftMargin = 10;
      const rightMargin = 10;
      const contentWidth = pageWidth - leftMargin - rightMargin;
      const bottomMargin = 15;

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredHeight) => {
        if (yPos + requiredHeight > pageHeight - bottomMargin) {
          doc.addPage();
          yPos = 15;
          return true;
        }
        return false;
      };

      // Add logo (centered)
      if (logoBase64) {
        const logoWidth = 35;
        const logoHeight = 35;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(logoBase64, 'PNG', logoX, yPos, logoWidth, logoHeight);
        yPos += logoHeight + 6;
      }

      // Company contact information (centered)
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const contactInfo = [
        'slwoodartgallery@gmail.com | +94 77 123 4567',
        'No. 123, Kaduwela Road, Malabe, Sri Lanka | www.woodartgallery.com'
      ];
      
      contactInfo.forEach(line => {
        const textWidth = doc.getTextWidth(line);
        const textX = (pageWidth - textWidth) / 2;
        doc.text(line, textX, yPos);
        yPos += 4;
      });

      // Horizontal line
      yPos += 5;
      doc.setDrawColor(44, 62, 80);
      doc.setLineWidth(0.8);
      doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
      yPos += 10;

      // Report title (centered)
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.setFont(undefined, 'bold');
      const titleText = 'DESIGNER ORDERS REPORT';
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
      yPos += 9;

      // Designer info and report date (centered)
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(108, 117, 125);
      const designerText = `Designer: ${user.name} (${user.email})`;
      const designerWidth = doc.getTextWidth(designerText);
      doc.text(designerText, (pageWidth - designerWidth) / 2, yPos);
      yPos += 5;

      const currentDate = new Date();
      const reportDate = `Generated on ${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      const reportDateWidth = doc.getTextWidth(reportDate);
      doc.text(reportDate, (pageWidth - reportDateWidth) / 2, yPos);
      yPos += 12;

      // Summary Section
      checkPageBreak(50);
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('ORDERS SUMMARY', leftMargin + 3, yPos + 2);
      yPos += 10;

      // Summary data
      const totalOrders = filteredOrders.length;
      const totalEarnings = filteredOrders.reduce((sum, order) => sum + (order.designerTotal || 0), 0);
      const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;
      const pendingOrders = filteredOrders.filter(order => order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing').length;
      const totalItems = filteredOrders.reduce((sum, order) => sum + (order.items ? order.items.reduce((itemSum, item) => itemSum + item.quantity, 0) : 0), 0);

      const summaryData = [
        ['Total Orders', totalOrders.toString()],
        ['Total Earnings', formatPrice(totalEarnings)],
        ['Completed Orders', completedOrders.toString()],
        ['Pending Orders', pendingOrders.toString()],
        ['Total Items Sold', totalItems.toString()]
      ];

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      summaryData.forEach((row, index) => {
        checkPageBreak(8);
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(leftMargin, yPos - 2, contentWidth, 5, 'F');
        }
        
        doc.setFont(undefined, 'normal');
        doc.text(row[0], leftMargin + 3, yPos);
        const valueWidth = doc.getTextWidth(row[1]);
        doc.text(row[1], pageWidth - rightMargin - 3 - valueWidth, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Orders Section
      checkPageBreak(20);
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('ORDER DETAILS', leftMargin + 3, yPos + 2);
      yPos += 12;

      // Orders list
      filteredOrders.forEach((order, index) => {
        checkPageBreak(50);
        
        // Order header
        doc.setFillColor(240, 248, 255);
        doc.rect(leftMargin, yPos - 2, contentWidth, 6, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`Order #${order.orderId}`, leftMargin + 3, yPos + 2);
        yPos += 8;

        // Order details
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        const orderDetails = [
          `Date: ${formatDate(order.orderDate)}`,
          `Customer: ${order.customerName} (${order.customerEmail})`,
          `Status: ${order.status.replace('_', ' ').toUpperCase()}`,
          `Payment: ${order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}`,
          `Your Earnings: ${formatPrice(order.designerTotal)}`
        ];

        orderDetails.forEach(detail => {
          checkPageBreak(6);
          doc.text(detail, leftMargin + 5, yPos);
          yPos += 4;
        });

        // Items
        if (order.items && order.items.length > 0) {
          checkPageBreak(8);
          doc.setFont(undefined, 'bold');
          doc.text('Items:', leftMargin + 5, yPos);
          yPos += 4;
          doc.setFont(undefined, 'normal');
          
          order.items.forEach(item => {
            checkPageBreak(6);
            doc.text(`• ${item.itemName} - Qty: ${item.quantity} - ${formatPrice(item.price)} each`, leftMargin + 8, yPos);
            yPos += 4;
          });
        }

        yPos += 3;
      });

      // Footer
      checkPageBreak(15);
      doc.setDrawColor(222, 226, 230);
      doc.setLineWidth(0.4);
      doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
      yPos += 4;
      doc.setTextColor(108, 117, 125);
      doc.setFontSize(7);
      doc.text('This is a computer-generated document and does not require a signature.', leftMargin + 3, yPos);
      yPos += 4;
      const generatedText = `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      doc.text(generatedText, leftMargin + 3, yPos);

      // Save the PDF
      const currentDateStr = new Date().toISOString().split('T')[0];
      doc.save(`My_Orders_${currentDateStr}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Generate CSV Orders Report
  const generateCSVReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const totalEarnings = filteredOrders.reduce((sum, order) => sum + (order.designerTotal || 0), 0);
    
    const csvData = [
      ['Designer Orders Report'],
      ['Generated Date', currentDate],
      ['Designer Name', user.name],
      ['Designer Email', user.email],
      [''],
      ['ORDERS SUMMARY'],
      ['Total Orders', filteredOrders.length],
      ['Total Earnings', `Rs. ${totalEarnings.toLocaleString()}`],
      ['Completed Orders', filteredOrders.filter(order => order.status === 'delivered').length],
      ['Pending Orders', filteredOrders.filter(order => order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing').length],
      ['Total Items Sold', filteredOrders.reduce((sum, order) => sum + (order.items ? order.items.reduce((itemSum, item) => itemSum + item.quantity, 0) : 0), 0)],
      [''],
      ['ORDER DETAILS'],
      ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Status', 'Payment Method', 'Your Earnings', 'Items']
    ];

    // Add order details
    filteredOrders.forEach(order => {
      let itemsDescription = '';
      if (order.items && order.items.length > 0) {
        itemsDescription = order.items.map(item => `${item.itemName} (Qty: ${item.quantity}, Price: ${formatPrice(item.price)})`).join('; ');
      }

      csvData.push([
        order.orderId,
        formatDate(order.orderDate),
        order.customerName,
        order.customerEmail,
        order.status.replace('_', ' ').toUpperCase(),
        order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer',
        `Rs. ${(order.designerTotal || 0).toLocaleString()}`,
        itemsDescription
      ]);
    });

    csvData.push(['']);
    csvData.push(['Company Contact Information']);
    csvData.push(['Email', 'slwoodartgallery@gmail.com']);
    csvData.push(['Phone', '+94 77 123 4567']);
    csvData.push(['Address', 'No. 123, Kaduwela Road, Malabe, Sri Lanka']);

    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const currentDateStr = new Date().toISOString().split('T')[0];
    link.download = `My_Orders_${currentDateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="my-orders-loading">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Orders</h3>
        <p>{error}</p>
        <button onClick={fetchDesignerOrders} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <div className="my-orders-header">
        <h1>My Orders</h1>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by Order ID"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button onClick={clearSearch} className="clear-search-button">Clear</button>
            )}
          </div>
          <button onClick={() => fetchDesignerOrders(user?.email)} className="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>When customers purchase your designs, orders will appear here.</p>
        </div>
      ) : (
        // Show filtered results based on search
        filteredOrders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">🔎</div>
            <h3>No matching orders</h3>
            <p>No orders match Order ID "{searchTerm}".</p>
            <button onClick={clearSearch} className="retry-button">Clear Search</button>
          </div>
        ) : (
          <>
            <div className="orders-grid">
              {filteredOrders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div className="order-id">
                      <strong>Order #{order.orderId}</strong>
                    </div>
                    <div className="order-date">
                      {formatDate(order.orderDate)}
                    </div>
                  </div>

                  <div className="customer-info">
                    <h4>Customer Details</h4>
                    <p><strong>Name:</strong> {order.customerName}</p>
                    <p><strong>Email:</strong> {order.customerEmail}</p>
                    {order.customerPhone && <p><strong>Phone:</strong> {order.customerPhone}</p>}
                    {order.customerAddress && <p><strong>Address:</strong> {order.customerAddress}</p>}
                  </div>

                  <div className="order-items">
                    <h4>Your Items</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <img 
                          src={`http://localhost:5000${item.imageUrl}`} 
                          alt={item.itemName}
                          className="item-image"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect width="60" height="60" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className="item-details">
                          <h5>{item.itemName}</h5>
                          <p>Quantity: {item.quantity}</p>
                          <p>Price: {formatPrice(item.price)} each</p>
                          <p className="item-subtotal">Subtotal: {formatPrice(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary">
                    <div className="order-breakdown">
                      <div className="breakdown-line">
                        <span>Your Items Total:</span>
                        <span>{formatPrice(order.designerTotal)}</span>
                      </div>
                      {order.deliveryFee && (
                        <div className="breakdown-line">
                          <span>Delivery Fee:</span>
                          <span>{formatPrice(order.deliveryFee)}</span>
                        </div>
                      )}
                      <div className="breakdown-line total-line">
                        <span><strong>Customer Total:</strong></span>
                        <span><strong>{formatPrice(order.designerTotal + (order.deliveryFee || 0))}</strong></span>
                      </div>
                    </div>
                    <div className="order-total">
                      <strong>Your Earnings: {formatPrice(order.designerTotal)}</strong>
                    </div>
                    <div className="payment-method">
                      Payment: {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}
                    </div>
                  </div>

                  <div className="order-status">
                    <div className="status-item">
                      <span className="status-label">Order Status:</span>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {order.paymentStatus && (
                      <div className="status-item">
                        <span className="status-label">Payment:</span>
                        <span 
                          className="status-badge" 
                          style={{ 
                            backgroundColor: order.paymentStatus === 'paid' ? '#4caf50' : 
                                           order.paymentStatus === 'failed' ? '#f44336' : '#ff9800' 
                          }}
                        >
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="status-item">
                      <span className="status-label">Delivery Status:</span>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getDeliveryStatusColor(order.deliveryStatus) }}
                      >
                        {order.deliveryStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="order-actions">
                    {order.status === 'confirmed' && order.deliveryStatus === 'not_assigned' && (
                      <button 
                        onClick={() => handleNotifyDelivery(order.orderId)}
                        disabled={notifyingDelivery === order.orderId}
                        className="notify-delivery-button"
                      >
                        {notifyingDelivery === order.orderId ? (
                          <>
                            <span className="button-spinner"></span>
                            Notifying...
                          </>
                        ) : (
                          <>
                            🚚 Notify Delivery
                          </>
                        )}
                      </button>
                    )}
                    {order.status === 'ready_for_delivery' && (
                      <div className="delivery-notified">
                        ✅ Delivery team notified
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <div className="order-notes">
                      <h4>Notes</h4>
                      <p>{order.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Report Generation Section */}
            <div className="orders-report-section">
              <h3 className="report-title">Download Reports</h3>
              <div className="orders-report-actions">
                <button 
                  className="orders-report-btn pdf-btn"
                  onClick={generatePDFReport}
                  title="Download PDF Orders Report"
                >
                  <span className="report-icon">📄</span>
                  PDF Report
                </button>
                <button 
                  className="orders-report-btn csv-btn"
                  onClick={generateCSVReport}
                  title="Download CSV Orders Report"
                >
                  <span className="report-icon">📊</span>
                  CSV Report
                </button>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
