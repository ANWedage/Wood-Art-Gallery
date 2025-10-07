import React, { useState, useEffect } from 'react';
import './FinancialOverview.css';
import jsPDF from 'jspdf';
import logo from '../../assets/logo.png';

export default function FinancialOverview() {
  console.log('🎯 FinancialOverview component rendering...');
  
  const [financialData, setFinancialData] = useState({
    marketplaceIncome: 0,
    customizedOrderIncome: 0,
    staffDesignerSalaries: 0,
    supplierPayments: 0,
    deliveryPayments: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 FinancialOverview component mounted');
    
    // Fetch data immediately
    fetchFinancialData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh triggered');
      fetchFinancialData();
    }, 30000);
    
    return () => {
      console.log('🧹 Cleaning up interval');
      clearInterval(interval);
    };
  }, []);

  const fetchFinancialData = async () => {
    console.log('🔄 Fetching real-time financial data...');
    try {
      setLoading(true);
      setError(null);
      
      // Initialize variables for real data
      let marketplaceIncome = 0;
      let customizedOrderIncome = 0;
      let staffDesignerSalaries = 0;
      let supplierPayments = 0;
      let deliveryPayments = 0;

      // Fetch marketplace income (commissions from marketplace orders)
      const marketplaceResponse = await fetch('/api/financial/marketplace-income');
      const marketplaceData = await marketplaceResponse.json();
      console.log('📊 Marketplace data:', marketplaceData);
      console.log('📊 Marketplace totals:', marketplaceData.totals);
      if (marketplaceData.success && marketplaceData.totals) {
        marketplaceIncome = marketplaceData.totals.commission || 0;
        console.log('📊 Marketplace income extracted:', marketplaceIncome);
      }

      // Fetch customized order income (total item prices from custom orders)
      const customOrderResponse = await fetch('http://localhost:5000/api/financial/customize-order-income');
      const customOrderData = await customOrderResponse.json();
      console.log('🎨 Custom order data:', customOrderData);
      console.log('🎨 Custom order totals:', customOrderData.totals);
      if (customOrderData.success && customOrderData.totals) {
        customizedOrderIncome = customOrderData.totals.itemPrice || 0;
        console.log('🎨 Custom order income extracted:', customizedOrderIncome);
      }

      // Fetch staff designer salaries (total gross salaries)
      const salariesResponse = await fetch('/api/staff-designer-salaries');
      const salariesData = await salariesResponse.json();
      console.log('👨‍💼 Salaries data:', salariesData);
      if (salariesData.success && Array.isArray(salariesData.salaries)) {
        staffDesignerSalaries = salariesData.salaries.reduce((total, salary) => {
          return total + (salary.grossSalary || 0);
        }, 0);
      }

      // Fetch supplier payments
      const supplierResponse = await fetch('/api/supplier-payments');
      const supplierData = await supplierResponse.json();
      console.log('🏭 Supplier data:', supplierData);
      console.log('🏭 Supplier payments array:', supplierData.payments);
      if (supplierData.success && Array.isArray(supplierData.payments)) {
        supplierPayments = supplierData.payments.reduce((total, payment) => {
          const paidAmount = payment.paidAmount || 0;
          console.log('🏭 Processing payment:', payment.supplierName, 'Amount:', paidAmount);
          return total + paidAmount;
        }, 0);
        console.log('🏭 Total supplier payments calculated:', supplierPayments);
      }

      // Fetch delivery payments (total delivery charges from completed orders)
      const [marketplaceDeliveryResponse, customDeliveryResponse] = await Promise.all([
        fetch('http://localhost:5000/api/orders/delivery/marketplace?section=completed'),
        fetch('http://localhost:5000/api/customOrder/delivery/custom?section=completed')
      ]);
      
      const marketplaceDeliveryData = await marketplaceDeliveryResponse.json();
      const customDeliveryData = await customDeliveryResponse.json();
      
      console.log('🚚 Marketplace delivery data:', marketplaceDeliveryData);
      console.log('🚚 Custom delivery data:', customDeliveryData);
      
      // Calculate total delivery charges
      let marketplaceDeliveryCharges = 0;
      let customDeliveryCharges = 0;
      
      if (marketplaceDeliveryData.success && Array.isArray(marketplaceDeliveryData.orders)) {
        marketplaceDeliveryCharges = marketplaceDeliveryData.orders.reduce((total, order) => {
          return total + (order.deliveryFee || 250); // Default 250 if no delivery fee
        }, 0);
      }
      
      if (customDeliveryData.success && Array.isArray(customDeliveryData.orders)) {
        customDeliveryCharges = customDeliveryData.orders.reduce((total, order) => {
          return total + (order.deliveryFee || 250); // Default 250 if no delivery fee
        }, 0);
      }
      
      deliveryPayments = marketplaceDeliveryCharges + customDeliveryCharges;

      // Calculate totals
      const totalIncome = marketplaceIncome + customizedOrderIncome;
      const totalExpenses = staffDesignerSalaries + supplierPayments + deliveryPayments;
      const netProfit = totalIncome - totalExpenses;

      const finalData = {
        marketplaceIncome,
        customizedOrderIncome,
        staffDesignerSalaries,
        supplierPayments,
        deliveryPayments,
        totalIncome,
        totalExpenses,
        netProfit
      };
      
      console.log('✅ Real-time financial data loaded:', finalData);
      setFinancialData(finalData);
    } catch (error) {
      console.error('❌ Error fetching financial data:', error);
      setError(`Failed to load financial data: ${error.message}`);
    } finally {
      console.log('🏁 Loading complete');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  // Generate PDF Balance Sheet Report
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

      // Add logo (centered) - Well-sized for visibility
      if (logoBase64) {
        const logoWidth = 35;
        const logoHeight = 35;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(logoBase64, 'PNG', logoX, yPos, logoWidth, logoHeight);
        yPos += logoHeight + 6;
      }

      // Company contact information (centered) - Better visibility
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

      // Horizontal line - More prominent
      yPos += 5;
      doc.setDrawColor(44, 62, 80);
      doc.setLineWidth(0.8);
      doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
      yPos += 10;

      // Report title (centered) - More visible
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.setFont(undefined, 'bold');
      const titleText = 'FINANCIAL BALANCE SHEET';
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
      yPos += 9;

      // Period and report number (centered) - Better spacing
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(108, 117, 125);
      const currentDate = new Date();
      const periodText = `As of ${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      const periodWidth = doc.getTextWidth(periodText);
      doc.text(periodText, (pageWidth - periodWidth) / 2, yPos);
      yPos += 5;

      const reportNo = `Report No: WB-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const reportNoWidth = doc.getTextWidth(reportNo);
      doc.text(reportNo, (pageWidth - reportNoWidth) / 2, yPos);
      yPos += 12;

      // Horizontal layout for Income and Expenses - Side by side
      const sectionStartY = yPos;
      const sectionWidth = (contentWidth - 6) / 2; // Split available width with small gap
      const incomeStartX = leftMargin;
      const expensesStartX = leftMargin + sectionWidth + 6;
      
      // Income Section (Left side)
      doc.setFillColor(44, 62, 80);
      doc.rect(incomeStartX, yPos - 3, sectionWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('INCOME', incomeStartX + 3, yPos + 2);
      let incomeYPos = yPos + 10;

      // Income table - Better readability
      const incomeData = [
        ['Marketplace Income', formatCurrency(financialData.marketplaceIncome)],
        ['Customized Order Income', formatCurrency(financialData.customizedOrderIncome)],
        ['Total Income', formatCurrency(financialData.totalIncome)]
      ];

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      incomeData.forEach((row, index) => {
        // Add alternating background for better readability
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(incomeStartX, incomeYPos - 2, sectionWidth, 5, 'F');
        }
        
        doc.setFont(undefined, index === incomeData.length - 1 ? 'bold' : 'normal');
        doc.text(row[0], incomeStartX + 3, incomeYPos);
        const amountWidth = doc.getTextWidth(row[1]);
        doc.text(row[1], incomeStartX + sectionWidth - 3 - amountWidth, incomeYPos);
        incomeYPos += 5;
      });

      // Expenses Section (Right side)
      doc.setFillColor(44, 62, 80);
      doc.rect(expensesStartX, yPos - 3, sectionWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('EXPENSES', expensesStartX + 3, yPos + 2);
      let expensesYPos = yPos + 10;

      // Expenses table - Better readability
      const expensesData = [
        ['Salaries', formatCurrency(financialData.staffDesignerSalaries)],
        ['Supplier Payments', formatCurrency(financialData.supplierPayments)],
        ['Delivery Payments', formatCurrency(financialData.deliveryPayments)],
        ['Total Expenses', formatCurrency(financialData.totalExpenses)]
      ];

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      expensesData.forEach((row, index) => {
        // Add alternating background for better readability
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(expensesStartX, expensesYPos - 2, sectionWidth, 5, 'F');
        }
        
        doc.setFont(undefined, index === expensesData.length - 1 ? 'bold' : 'normal');
        doc.text(row[0], expensesStartX + 3, expensesYPos);
        const amountWidth = doc.getTextWidth(row[1]);
        doc.text(row[1], expensesStartX + sectionWidth - 3 - amountWidth, expensesYPos);
        expensesYPos += 5;
      });

      // Set yPos to the maximum of both sections plus spacing
      yPos = Math.max(incomeYPos, expensesYPos) + 10;

      // Net Profit Box - More prominent and visible
      const profitColor = financialData.netProfit >= 0 ? [40, 167, 69] : [220, 53, 69];
      doc.setFillColor(...profitColor);
      doc.rect(leftMargin, yPos, contentWidth, 16, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      const profitLabel = `NET ${financialData.netProfit >= 0 ? 'PROFIT' : 'LOSS'}`;
      const profitAmount = formatCurrency(Math.abs(financialData.netProfit));
      const labelWidth = doc.getTextWidth(profitLabel);
      doc.text(profitLabel, (pageWidth - labelWidth) / 2, yPos + 6);
      doc.setFontSize(15);
      const amountWidth = doc.getTextWidth(profitAmount);
      doc.text(profitAmount, (pageWidth - amountWidth) / 2, yPos + 12);
      yPos += 20;

      // Financial Summary - More visible
      doc.setFillColor(255, 243, 205);
      doc.rect(leftMargin, yPos, contentWidth, 10, 'F');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Financial Summary', leftMargin + 3, yPos + 4);
      doc.setFont(undefined, 'normal');
      const calculation = `Calculation: Total Income (${formatCurrency(financialData.totalIncome)}) - Total Expenses (${formatCurrency(financialData.totalExpenses)})`;
      doc.text(calculation, leftMargin + 3, yPos + 7);
      yPos += 14;

      // Disclaimer - Better visibility
      doc.setFillColor(248, 249, 250);
      const disclaimerHeight = 18;
      doc.rect(leftMargin, yPos, contentWidth, disclaimerHeight, 'F');
      doc.setTextColor(73, 80, 87);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text('Important Notice:', leftMargin + 3, yPos + 4);
      doc.setFont(undefined, 'normal');
      
      const disclaimerText = 'This balance sheet is generated from real-time financial data and provides a comprehensive overview of the company\'s financial position. All amounts are in Sri Lankan Rupees (LKR). For detailed analysis or queries, contact the financial department.';
      const splitText = doc.splitTextToSize(disclaimerText, contentWidth - 6);
      doc.text(splitText, leftMargin + 3, yPos + 7);
      yPos += disclaimerHeight + 6;

      // Footer - More visible
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
      doc.save(`Balance_Sheet_${currentDateStr}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Generate CSV Balance Sheet Report
  const generateCSVReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const csvData = [
      ['Financial Balance Sheet'],
      ['Generated Date', currentDate],
      ['Company', 'Wood Art Gallery'],
      [''],
      ['INCOME'],
      ['Description', 'Amount (LKR)'],
      ['Marketplace Income', financialData.marketplaceIncome],
      ['Customized Order Income', financialData.customizedOrderIncome],
      ['Total Income', financialData.totalIncome],
      [''],
      ['EXPENSES'],
      ['Description', 'Amount (LKR)'],
      ['Salaries', financialData.staffDesignerSalaries],
      ['Supplier Payments', financialData.supplierPayments],
      ['Delivery Payments', financialData.deliveryPayments],
      ['Total Expenses', financialData.totalExpenses],
      [''],
      ['PROFIT/LOSS CALCULATION'],
      ['Total Income', financialData.totalIncome],
      ['Total Expenses', financialData.totalExpenses],
      ['Net Profit/Loss', financialData.netProfit],
      [''],
      ['Company Contact Information'],
      ['Email', 'slwoodartgallery@gmail.com'],
      ['Phone', '+94 77 123 4567'],
      ['Address', 'No. 123, Kaduwela Road, Malabe, Sri Lanka']
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const currentDateStr = new Date().toISOString().split('T')[0];
    link.download = `Balance_Sheet_${currentDateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getIncomeChartPercentages = () => {
    if (financialData.totalIncome === 0) return { marketplace: 0, customized: 0 };
    
    return {
      marketplace: (financialData.marketplaceIncome / financialData.totalIncome) * 100,
      customized: (financialData.customizedOrderIncome / financialData.totalIncome) * 100
    };
  };

  const getExpenseChartPercentages = () => {
    if (financialData.totalExpenses === 0) return { salaries: 0, suppliers: 0, delivery: 0 };
    
    return {
      salaries: (financialData.staffDesignerSalaries / financialData.totalExpenses) * 100,
      suppliers: (financialData.supplierPayments / financialData.totalExpenses) * 100,
      delivery: (financialData.deliveryPayments / financialData.totalExpenses) * 100
    };
  };

  const createPieChartStyle = (percentages, colors) => {
    if (Object.values(percentages).every(val => val === 0)) {
      return { background: '#e0e0e0' };
    }

    const segments = [];
    let currentAngle = 0;

    Object.entries(percentages).forEach(([key, percentage], index) => {
      if (percentage > 0) {
        const angle = (percentage / 100) * 360;
        segments.push(`${colors[index]} ${currentAngle}deg ${currentAngle + angle}deg`);
        currentAngle += angle;
      }
    });

    return {
      background: `conic-gradient(${segments.join(', ')})`
    };
  };

  if (loading) {
    return (
      <div className="fin-ovw-loading-wrapper">
        <div className="fin-ovw-loading-spinner"></div>
        <p className="fin-ovw-loading-text">Loading financial overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fin-ovw-error-wrapper">
        <div className="fin-ovw-error-icon">⚠️</div>
        <p className="fin-ovw-error-text">{error}</p>
        <button className="fin-ovw-retry-btn" onClick={fetchFinancialData}>
          Retry
        </button>
      </div>
    );
  }

  const incomePercentages = getIncomeChartPercentages();
  const expensePercentages = getExpenseChartPercentages();

  return (
    <div className="fin-ovw-main-container">
      {/* Header Section */}
      <div className="fin-ovw-header-section">
        <div className="fin-ovw-header-content">
          <h1 className="fin-ovw-main-title">Financial Overview Dashboard</h1>
          <p className="fin-ovw-subtitle">Real-time financial performance and analytics</p>
        </div>
      </div>

      {/* Main Summary Cards */}
      <div className="fin-ovw-summary-grid">
        <div className="fin-ovw-card fin-ovw-income-card">
          <div className="fin-ovw-card-header">
            <div className="fin-ovw-card-icon fin-ovw-income-icon">💰</div>
            <div className="fin-ovw-card-info">
              <h3 className="fin-ovw-card-title">Total Income</h3>
              <div className="fin-ovw-card-amount fin-ovw-income-amount">
                {formatCurrency(financialData.totalIncome)}
              </div>
            </div>
          </div>
          <div className="fin-ovw-card-description">
            Revenue from all sources
          </div>
        </div>

        <div className="fin-ovw-card fin-ovw-expense-card">
          <div className="fin-ovw-card-header">
            <div className="fin-ovw-card-icon fin-ovw-expense-icon">💸</div>
            <div className="fin-ovw-card-info">
              <h3 className="fin-ovw-card-title">Total Expenses</h3>
              <div className="fin-ovw-card-amount fin-ovw-expense-amount">
                {formatCurrency(financialData.totalExpenses)}
              </div>
            </div>
          </div>
          <div className="fin-ovw-card-description">
            All operational costs
          </div>
        </div>

        <div className="fin-ovw-card fin-ovw-profit-card">
          <div className="fin-ovw-card-header">
            <div className="fin-ovw-card-icon fin-ovw-profit-icon">📈</div>
            <div className="fin-ovw-card-info">
              <h3 className="fin-ovw-card-title">Net Profit</h3>
              <div className={`fin-ovw-card-amount ${financialData.netProfit >= 0 ? 'fin-ovw-positive' : 'fin-ovw-negative'}`}>
                {formatCurrency(financialData.netProfit)}
              </div>
            </div>
          </div>
          <div className="fin-ovw-card-description">
            Total income - Total expenses
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="fin-ovw-charts-container">
        {/* Income Chart */}
        <div className="fin-ovw-chart-wrapper">
          <div className="fin-ovw-chart-header">
            <h2 className="fin-ovw-chart-title">Income Breakdown</h2>
            <div className="fin-ovw-chart-total">{formatCurrency(financialData.totalIncome)}</div>
          </div>
          
          <div className="fin-ovw-chart-body">
            <div className="fin-ovw-pie-container">
              <div 
                className="fin-ovw-pie-chart fin-ovw-income-pie"
                style={createPieChartStyle(incomePercentages, ['#FFD700', '#7B68EE'])}
              >
                <div className="fin-ovw-pie-center">
                  <div className="fin-ovw-center-label">Income</div>
                  <div className="fin-ovw-center-value">{formatCurrency(financialData.totalIncome)}</div>
                </div>
              </div>
            </div>
            
            <div className="fin-ovw-legend-container">
              <div className="fin-ovw-legend-item">
                <div className="fin-ovw-legend-dot" style={{backgroundColor: '#FFD700'}}></div>
                <div className="fin-ovw-legend-info">
                  <div className="fin-ovw-legend-label">Marketplace Income</div>
                  <div className="fin-ovw-legend-value">{formatCurrency(financialData.marketplaceIncome)}</div>
                  <div className="fin-ovw-legend-percent">{incomePercentages.marketplace.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="fin-ovw-legend-item">
                <div className="fin-ovw-legend-dot" style={{backgroundColor: '#7B68EE'}}></div>
                <div className="fin-ovw-legend-info">
                  <div className="fin-ovw-legend-label">Customized Orders</div>
                  <div className="fin-ovw-legend-value">{formatCurrency(financialData.customizedOrderIncome)}</div>
                  <div className="fin-ovw-legend-percent">{incomePercentages.customized.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Chart */}
        <div className="fin-ovw-chart-wrapper">
          <div className="fin-ovw-chart-header">
            <h2 className="fin-ovw-chart-title">Expenses Breakdown</h2>
            <div className="fin-ovw-chart-total">{formatCurrency(financialData.totalExpenses)}</div>
          </div>
          
          <div className="fin-ovw-chart-body">
            <div className="fin-ovw-pie-container">
              <div 
                className="fin-ovw-pie-chart fin-ovw-expense-pie"
                style={createPieChartStyle(expensePercentages, ['#FF6B6B', '#4ECDC4', '#1e3a8a'])}
              >
                <div className="fin-ovw-pie-center">
                  <div className="fin-ovw-center-label">Expenses</div>
                  <div className="fin-ovw-center-value">{formatCurrency(financialData.totalExpenses)}</div>
                </div>
              </div>
            </div>
            
            <div className="fin-ovw-legend-container">
              <div className="fin-ovw-legend-item">
                <div className="fin-ovw-legend-dot" style={{backgroundColor: '#FF6B6B'}}></div>
                <div className="fin-ovw-legend-info">
                  <div className="fin-ovw-legend-label">Staff Salaries</div>
                  <div className="fin-ovw-legend-value">{formatCurrency(financialData.staffDesignerSalaries)}</div>
                  <div className="fin-ovw-legend-percent">{expensePercentages.salaries.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="fin-ovw-legend-item">
                <div className="fin-ovw-legend-dot" style={{backgroundColor: '#4ECDC4'}}></div>
                <div className="fin-ovw-legend-info">
                  <div className="fin-ovw-legend-label">Suppliers</div>
                  <div className="fin-ovw-legend-value">{formatCurrency(financialData.supplierPayments)}</div>
                  <div className="fin-ovw-legend-percent">{expensePercentages.suppliers.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="fin-ovw-legend-item">
                <div className="fin-ovw-legend-dot" style={{backgroundColor: '#1e3a8a'}}></div>
                <div className="fin-ovw-legend-info">
                  <div className="fin-ovw-legend-label">Delivery</div>
                  <div className="fin-ovw-legend-value">{formatCurrency(financialData.deliveryPayments)}</div>
                  <div className="fin-ovw-legend-percent">{expensePercentages.delivery.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Section */}
      <div className="fin-ovw-details-section">
        <h2 className="fin-ovw-section-title">Detailed Breakdown</h2>
        
        <div className="fin-ovw-details-grid">
          <div className="fin-ovw-detail-group">
            <h3 className="fin-ovw-group-title">Income Sources</h3>
            <div className="fin-ovw-detail-items">
              <div className="fin-ovw-detail-item">
                <span className="fin-ovw-detail-label">Marketplace Commissions</span>
                <span className="fin-ovw-detail-value">{formatCurrency(financialData.marketplaceIncome)}</span>
              </div>
              <div className="fin-ovw-detail-item">
                <span className="fin-ovw-detail-label">Custom Design Revenue</span>
                <span className="fin-ovw-detail-value">{formatCurrency(financialData.customizedOrderIncome)}</span>
              </div>
            </div>
          </div>

          <div className="fin-ovw-detail-group">
            <h3 className="fin-ovw-group-title">Expense Categories</h3>
            <div className="fin-ovw-detail-items">
              <div className="fin-ovw-detail-item">
                <span className="fin-ovw-detail-label">Staff Designer Salaries</span>
                <span className="fin-ovw-detail-value">{formatCurrency(financialData.staffDesignerSalaries)}</span>
              </div>
              <div className="fin-ovw-detail-item">
                <span className="fin-ovw-detail-label">Supplier Payments</span>
                <span className="fin-ovw-detail-value">{formatCurrency(financialData.supplierPayments)}</span>
              </div>
              <div className="fin-ovw-detail-item">
                <span className="fin-ovw-detail-label">Delivery Charges</span>
                <span className="fin-ovw-detail-value">{formatCurrency(financialData.deliveryPayments)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Section */}
      <div className="fin-ovw-report-section">
        <h2 className="fin-ovw-section-title">Generate Reports</h2>
        <div className="fin-ovw-report-actions">
          <button 
            className="fin-ovw-report-btn pdf-btn"
            onClick={generatePDFReport}
            title="Download PDF Balance Sheet"
          >
            <span className="report-icon">📄</span>
            PDF Balance Sheet
          </button>
          <button 
            className="fin-ovw-report-btn csv-btn"
            onClick={generateCSVReport}
            title="Download CSV Balance Sheet"
          >
            <span className="report-icon">📊</span>
            CSV Balance Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
