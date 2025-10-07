import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './MyPurchases.css';
import jsPDF from 'jspdf';
import logo from '../../assets/logo.png';

export default function MyPurchases() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'marketplace', 'custom'

  useEffect(() => {
    if (user?.email) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch marketplace orders
      const marketplaceResponse = await fetch(`http://localhost:5000/api/orders/user/${user.email}`);
      const marketplaceData = await marketplaceResponse.json();

      // Fetch custom orders
      const customResponse = await fetch(`http://localhost:5000/api/customOrder/user/${user.email}`);
      const customData = await customResponse.json();

      const allPurchases = [];

      // Process marketplace orders
      if (marketplaceData?.success && marketplaceData.orders) {
        marketplaceData.orders.forEach(order => {
          allPurchases.push({
            _id: order._id,
            orderId: order.orderId,
            type: 'marketplace',
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            totalAmount: order.totalAmount,
            deliveryFee: order.deliveryFee,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            status: order.status,
            deliveryStatus: order.deliveryStatus,
            orderDate: order.orderDate || order.createdAt,
            deliveryDate: order.deliveryDate,
            items: order.items || [],
            bankSlipUrl: order.bankSlipUrl
          });
        });
      }

      // Process custom orders
      if (customData?.success && customData.orders) {
        customData.orders.forEach(order => {
          allPurchases.push({
            _id: order._id,
            orderId: order.orderId,
            type: 'custom',
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            totalAmount: order.estimatedPrice || order.finalPrice,
            deliveryFee: order.deliveryFee,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            status: order.status,
            deliveryStatus: order.deliveryStatus,
            orderDate: order.createdAt,
            description: order.description,
            material: order.material,
            boardSize: order.boardSize,
            boardColor: order.boardColor,
            boardThickness: order.boardThickness,
            bankSlipUrl: order.bankSlipUrl
          });
        });
      }

      // Sort by order date (newest first)
      allPurchases.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

      setPurchases(allPurchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setError('Failed to fetch purchase history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  };

  const getStatusBadge = (status, paymentStatus) => {
    if (paymentStatus === 'pending') {
      return <span className="status-badge pending">Payment Pending</span>;
    }
    
    switch (status) {
      case 'pending':
        return <span className="status-badge pending">Processing</span>;
      case 'confirmed':
        return <span className="status-badge confirmed">Confirmed</span>;
      case 'preparing':
        return <span className="status-badge preparing">Preparing</span>;
      case 'ready_for_delivery':
        return <span className="status-badge ready">Ready for Delivery</span>;
      case 'delivered':
        return <span className="status-badge delivered">Delivered</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">Cancelled</span>;
      case 'accepted':
        return <span className="status-badge confirmed">Accepted</span>;
      case 'in_progress':
        return <span className="status-badge preparing">In Progress</span>;
      case 'completed':
        return <span className="status-badge ready">Completed</span>;
      default:
        return <span className="status-badge pending">{status}</span>;
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'all') return true;
    return purchase.type === filter;
  });

  // Generate PDF Purchase Report
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
      const titleText = 'MY PURCHASE HISTORY REPORT';
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
      yPos += 9;

      // Customer info and report date (centered)
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(108, 117, 125);
      const customerText = `Customer: ${user.name} (${user.email})`;
      const customerWidth = doc.getTextWidth(customerText);
      doc.text(customerText, (pageWidth - customerWidth) / 2, yPos);
      yPos += 5;

      const currentDate = new Date();
      const reportDate = `Generated on ${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      const reportDateWidth = doc.getTextWidth(reportDate);
      doc.text(reportDate, (pageWidth - reportDateWidth) / 2, yPos);
      yPos += 12;

      // Summary Section
      checkPageBreak(40);
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('PURCHASE SUMMARY', leftMargin + 3, yPos + 2);
      yPos += 10;

      // Summary data
      const totalPurchases = filteredPurchases.length;
      const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.totalAmount + (p.deliveryFee || 0)), 0);
      const marketplaceOrders = filteredPurchases.filter(p => p.type === 'marketplace').length;
      const customOrders = filteredPurchases.filter(p => p.type === 'custom').length;
      const completedOrders = filteredPurchases.filter(p => p.status === 'delivered' || p.status === 'completed').length;

      const summaryData = [
        ['Total Orders', totalPurchases.toString()],
        ['Total Amount Spent', formatCurrency(totalAmount)],
        ['Marketplace Orders', marketplaceOrders.toString()],
        ['Custom Orders', customOrders.toString()],
        ['Completed Orders', completedOrders.toString()]
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
      filteredPurchases.forEach((purchase, index) => {
        checkPageBreak(35);
        
        // Order header
        doc.setFillColor(240, 248, 255);
        doc.rect(leftMargin, yPos - 2, contentWidth, 6, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`#${purchase.orderId} - ${purchase.type === 'marketplace' ? 'Marketplace' : 'Custom'} Order`, leftMargin + 3, yPos + 2);
        yPos += 8;

        // Order details
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        const orderDetails = [
          `Date: ${formatDate(purchase.orderDate)}`,
          `Status: ${purchase.status}`,
          `Payment: ${purchase.paymentMethod === 'cash_on_delivery' || purchase.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Bank Transfer'}`,
          `Amount: ${formatCurrency(purchase.totalAmount + (purchase.deliveryFee || 0))}`
        ];

        orderDetails.forEach(detail => {
          doc.text(detail, leftMargin + 5, yPos);
          yPos += 4;
        });

        if (purchase.type === 'custom') {
          doc.text(`Description: ${purchase.description || 'N/A'}`, leftMargin + 5, yPos);
          yPos += 4;
          doc.text(`Material: ${purchase.material} | Size: ${purchase.boardSize} | Color: ${purchase.boardColor}`, leftMargin + 5, yPos);
          yPos += 4;
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
      doc.save(`My_Purchases_${currentDateStr}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Generate CSV Purchase Report
  const generateCSVReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.totalAmount + (p.deliveryFee || 0)), 0);
    
    const csvData = [
      ['My Purchase History Report'],
      ['Generated Date', currentDate],
      ['Customer Name', user.name],
      ['Customer Email', user.email],
      [''],
      ['PURCHASE SUMMARY'],
      ['Total Orders', filteredPurchases.length],
      ['Total Amount Spent', `Rs. ${totalAmount.toLocaleString()}`],
      ['Marketplace Orders', filteredPurchases.filter(p => p.type === 'marketplace').length],
      ['Custom Orders', filteredPurchases.filter(p => p.type === 'custom').length],
      ['Completed Orders', filteredPurchases.filter(p => p.status === 'delivered' || p.status === 'completed').length],
      [''],
      ['ORDER DETAILS'],
      ['Order ID', 'Type', 'Date', 'Status', 'Payment Method', 'Total Amount', 'Description/Items']
    ];

    // Add order details
    filteredPurchases.forEach(purchase => {
      let description = '';
      if (purchase.type === 'custom') {
        description = `${purchase.description} | ${purchase.material} | ${purchase.boardSize} | ${purchase.boardColor}`;
      } else if (purchase.items && purchase.items.length > 0) {
        description = purchase.items.map(item => `${item.itemName} (Qty: ${item.quantity})`).join('; ');
      }

      csvData.push([
        purchase.orderId,
        purchase.type === 'marketplace' ? 'Marketplace' : 'Custom',
        formatDate(purchase.orderDate),
        purchase.status,
        purchase.paymentMethod === 'cash_on_delivery' || purchase.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Bank Transfer',
        `Rs. ${(purchase.totalAmount + (purchase.deliveryFee || 0)).toLocaleString()}`,
        description
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
    link.download = `My_Purchases_${currentDateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="my-purchases">
        <h1 className="dashboard-title">My Purchases</h1>
        <div className="loading-state">Loading purchase history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-purchases">
        <h1 className="dashboard-title">My Purchases</h1>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchPurchases} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-purchases">
      <div className="purchases-header">
        <h1 className="dashboard-title">My Purchases</h1>
        <button onClick={fetchPurchases} className="refresh-btn">
          ↻ Refresh
        </button>
      </div>

      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All Orders ({purchases.length})
        </button>
        <button 
          className={filter === 'marketplace' ? 'active' : ''} 
          onClick={() => setFilter('marketplace')}
        >
          Marketplace ({purchases.filter(p => p.type === 'marketplace').length})
        </button>
        <button 
          className={filter === 'custom' ? 'active' : ''} 
          onClick={() => setFilter('custom')}
        >
          Custom Orders ({purchases.filter(p => p.type === 'custom').length})
        </button>
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h3>No Purchase History</h3>
          <p>You haven't made any purchases yet. Browse our marketplace to find amazing designs!</p>
        </div>
      ) : (
        <>
          <div className="purchases-list">
            {filteredPurchases.map((purchase) => (
              <div key={purchase._id} className={`purchase-card ${purchase.type}`}>
                <div className="purchase-header">
                  <div className="purchase-info">
                    <h3 className="order-id">#{purchase.orderId}</h3>
                    <span className={`order-type ${purchase.type}`}>
                      {purchase.type === 'marketplace' ? 'Marketplace Order' : 'Custom Order'}
                    </span>
                  </div>
                  <div className="purchase-status">
                    {getStatusBadge(purchase.status, purchase.paymentStatus)}
                  </div>
                </div>

                <div className="purchase-details">
                  <div className="detail-row">
                    <span className="label">Order Date:</span>
                    <span className="value">{formatDate(purchase.orderDate)}</span>
                  </div>
                  
                  {purchase.deliveryDate && (
                    <div className="detail-row">
                      <span className="label">Delivery Date:</span>
                      <span className="value">{formatDate(purchase.deliveryDate)}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="label">Payment Method:</span>
                    <span className="value">
                      {purchase.paymentMethod === 'cash_on_delivery' || purchase.paymentMethod === 'cash' 
                        ? 'Cash on Delivery' 
                        : 'Bank Transfer'}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Total Amount:</span>
                    <span className="value amount">{formatCurrency(purchase.totalAmount + (purchase.deliveryFee || 0))}</span>
                  </div>
                </div>

                {purchase.type === 'marketplace' && purchase.items && purchase.items.length > 0 && (
                  <div className="purchase-items">
                    <h4>Items:</h4>
                    <div className="items-list">
                      {purchase.items.map((item, index) => (
                        <div key={index} className="item-card">
                          <div className="item-image">
                            <img 
                              src={`http://localhost:5000${item.imageUrl}`} 
                              alt={item.itemName}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                          <div className="item-info">
                            <h5>{item.itemName}</h5>
                            <p>Designer: {item.designerName}</p>
                            <p>Quantity: {item.quantity}</p>
                            <p>Price: {formatCurrency(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {purchase.type === 'custom' && (
                  <div className="custom-order-details">
                    <h4>Custom Order Details:</h4>
                    <div className="custom-info">
                      <div className="detail-row">
                        <span className="label">Description:</span>
                        <span className="value">{purchase.description}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Material:</span>
                        <span className="value">{purchase.material}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Size:</span>
                        <span className="value">{purchase.boardSize}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Color:</span>
                        <span className="value">{purchase.boardColor}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Thickness:</span>
                        <span className="value">{purchase.boardThickness}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Report Generation Section */}
          <div className="purchase-report-section">
            <h3 className="report-title">Download Reports</h3>
            <div className="purchase-report-actions">
              <button 
                className="purchase-report-btn pdf-btn"
                onClick={generatePDFReport}
                title="Download PDF Purchase Report"
              >
                <span className="report-icon">📄</span>
                PDF Report
              </button>
              <button 
                className="purchase-report-btn csv-btn"
                onClick={generateCSVReport}
                title="Download CSV Purchase Report"
              >
                <span className="report-icon">📊</span>
                CSV Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
