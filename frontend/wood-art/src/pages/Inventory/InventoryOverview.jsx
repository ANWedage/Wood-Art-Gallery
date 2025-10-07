import React, { useState, useEffect } from 'react';
import './InventoryOverview.css';
import jsPDF from 'jspdf';
import logo from '../../assets/logo.png';

export default function InventoryOverview() {
  console.log('📦 InventoryOverview component rendering...');
  
  const [inventoryData, setInventoryData] = useState({
    totalCombinations: 0,
    lowStockItems: 0,
    totalQuantity: 0,
    totalSuppliers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyReleases: 0,
    marketplaceItems: 0,
    stockDistribution: {
      woodTypes: {},
      boardSizes: {},
      thicknesses: {},
      colors: {}
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 InventoryOverview component mounted');
    
    // Fetch data immediately
    fetchInventoryData();
    
    // Set up real-time updates every 45 seconds
    const interval = setInterval(() => {
      console.log('⏰ Inventory auto-refresh triggered');
      fetchInventoryData();
    }, 45000);
    
    return () => {
      console.log('🧹 Cleaning up inventory interval');
      clearInterval(interval);
    };
  }, []);

  const fetchInventoryData = async () => {
    console.log('🔄 Fetching real-time inventory data...');
    try {
      setLoading(true);
      setError(null);
      
      // Initialize variables for real data
      let totalCombinations = 0;
      let lowStockItems = 0;
      let totalQuantity = 0;
      let totalSuppliers = 0;
      let pendingOrders = 0;
      let completedOrders = 0;
      let monthlyReleases = 0;
      let marketplaceItems = 0;
      let stockDistribution = {
        woodTypes: {},
        boardSizes: {},
        thicknesses: {},
        colors: {}
      };

      // Fetch stock summary
      try {
        const stockSummaryResponse = await fetch('/api/stock/summary');
        const stockSummaryData = await stockSummaryResponse.json();
        console.log('📊 Stock summary data:', stockSummaryData);
        
        if (stockSummaryData.success && stockSummaryData.summary) {
          totalCombinations = stockSummaryData.summary.totalCombinations || 0;
          lowStockItems = stockSummaryData.summary.lowStockItems || 0;
          totalQuantity = stockSummaryData.summary.totalQuantity || 0;
        }
      } catch (stockSummaryError) {
        console.warn('⚠️ Failed to fetch stock summary, using default values:', stockSummaryError.message);
      }

      // Fetch all stock items for distribution analysis and value calculation
      try {
        const stockItemsResponse = await fetch('/api/stock');
        const stockItemsData = await stockItemsResponse.json();
        console.log('📦 Stock items data:', stockItemsData);
        
        if (stockItemsData.success && Array.isArray(stockItemsData.stock)) {
          // Analyze stock distribution
          stockItemsData.stock.forEach(item => {
            // Wood types distribution
            const woodType = item.material || 'Unknown';
            stockDistribution.woodTypes[woodType] = (stockDistribution.woodTypes[woodType] || 0) + (item.availableQuantity || 0);

            // Board sizes distribution
            const boardSize = item.boardSize || 'Unknown';
            stockDistribution.boardSizes[boardSize] = (stockDistribution.boardSizes[boardSize] || 0) + (item.availableQuantity || 0);

            // Thickness distribution
            const thickness = item.thickness || 'Unknown';
            stockDistribution.thicknesses[thickness] = (stockDistribution.thicknesses[thickness] || 0) + (item.availableQuantity || 0);

            // Colors distribution
            const color = item.color || 'Unknown';
            stockDistribution.colors[color] = (stockDistribution.colors[color] || 0) + (item.availableQuantity || 0);
          });
        }
      } catch (stockItemsError) {
        console.warn('⚠️ Failed to fetch stock items, using default values:', stockItemsError.message);
      }

      // Fetch suppliers count
      try {
        const suppliersResponse = await fetch('/api/suppliers');
        const suppliersData = await suppliersResponse.json();
        console.log('🏭 Suppliers data:', suppliersData);
        
        if (suppliersData.success && Array.isArray(suppliersData.suppliers)) {
          totalSuppliers = suppliersData.suppliers.length;
        }
      } catch (suppliersError) {
        console.warn('⚠️ Failed to fetch suppliers, using default value:', suppliersError.message);
      }

      // Fetch custom orders for completed count
      let pendingCustomOrders = 0;
      let completedCustomOrders = 0;
      
      try {
        // Fetch pending custom orders
        const pendingResponse = await fetch('/api/customOrder/pending');
        const pendingData = await pendingResponse.json();
        console.log('🎨 Pending custom orders data:', pendingData);
        
        if (pendingData.success && Array.isArray(pendingData.orders)) {
          pendingCustomOrders = pendingData.orders.length;
        }
        
        // Fetch completed custom orders
        const completedResponse = await fetch('/api/customOrder/completed');
        const completedData = await completedResponse.json();
        console.log('🎨 Completed custom orders data:', completedData);
        
        if (completedData.success && Array.isArray(completedData.orders)) {
          completedCustomOrders = completedData.orders.length;
        }
      } catch (customOrderError) {
        console.warn('⚠️ Failed to fetch custom orders, using fallback values:', customOrderError.message);
        // Keep default values of 0
      }

      // Calculate total pending and completed orders
      pendingOrders = pendingCustomOrders;
      completedOrders = completedCustomOrders;
      
      console.log('📊 Orders breakdown:', {
        pendingCustomOrders,
        totalPendingOrders: pendingOrders,
        completedCustomOrders,
        totalCompletedOrders: completedOrders
      });

      // Fetch stock releases for monthly analysis
      try {
        const stockReleasesResponse = await fetch('/api/stock/releases');
        const stockReleasesData = await stockReleasesResponse.json();
        console.log('📤 Stock releases data:', stockReleasesData);
        
        if (stockReleasesData.success && Array.isArray(stockReleasesData.releases)) {
          // Count releases from current month
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          monthlyReleases = stockReleasesData.releases.filter(release => {
            const releaseDate = new Date(release.releaseDate);
            return releaseDate.getMonth() === currentMonth && releaseDate.getFullYear() === currentYear;
          }).length;
        }
      } catch (stockReleasesError) {
        console.warn('⚠️ Failed to fetch stock releases, using default value:', stockReleasesError.message);
      }

      // Fetch marketplace items count
      try {
        const marketplaceResponse = await fetch('/api/design/all-designs');
        const marketplaceData = await marketplaceResponse.json();
        console.log('🛒 Marketplace items data:', marketplaceData);
        
        if (marketplaceData.success && marketplaceData.count !== undefined) {
          marketplaceItems = marketplaceData.count;
        } else if (marketplaceData.success && Array.isArray(marketplaceData.designs)) {
          marketplaceItems = marketplaceData.designs.length;
        } else if (Array.isArray(marketplaceData)) {
          marketplaceItems = marketplaceData.length;
        }
      } catch (marketplaceError) {
        console.warn('⚠️ Failed to fetch marketplace items, using default value:', marketplaceError.message);
      }

      const finalData = {
        totalCombinations,
        lowStockItems,
        totalQuantity,
        totalSuppliers,
        pendingOrders,
        completedOrders,
        monthlyReleases,
        marketplaceItems,
        stockDistribution
      };
      
      console.log('✅ Real-time inventory data loaded:', finalData);
      setInventoryData(finalData);
    } catch (error) {
      console.error('❌ Error fetching inventory data:', error);
      setError(`Failed to load inventory data: ${error.message}`);
    } finally {
      console.log('🏁 Inventory loading complete');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatNumber = (number) => {
    return number.toLocaleString();
  };

  // Generate PDF Inventory Report
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
      const bottomMargin = 15; // Reserve space for footer

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredHeight) => {
        if (yPos + requiredHeight > pageHeight - bottomMargin) {
          doc.addPage();
          yPos = 15; // Start new page with margin
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
      const titleText = 'INVENTORY OVERVIEW REPORT';
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
      yPos += 9;

      // Period and report number (centered)
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(108, 117, 125);
      const currentDate = new Date();
      const periodText = `As of ${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      const periodWidth = doc.getTextWidth(periodText);
      doc.text(periodText, (pageWidth - periodWidth) / 2, yPos);
      yPos += 5;

      const reportNo = `Report No: INV-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const reportNoWidth = doc.getTextWidth(reportNo);
      doc.text(reportNo, (pageWidth - reportNoWidth) / 2, yPos);
      yPos += 12;

      // Summary Section
      checkPageBreak(50); // Check if we need space for summary section
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('INVENTORY SUMMARY', leftMargin + 3, yPos + 2);
      yPos += 10;

      // Summary table
      const summaryData = [
        ['Total Stock Items', formatNumber(inventoryData.totalCombinations)],
        ['Total Quantity Available', `${formatNumber(inventoryData.totalQuantity)} units`],
        ['Stock Health Percentage', `${getStockHealthPercentage()}%`],
        ['Low Stock Alerts', formatNumber(inventoryData.lowStockItems)],
        ['Active Suppliers', formatNumber(inventoryData.totalSuppliers)],
        ['Completed Orders', formatNumber(inventoryData.completedOrders)],
        ['Marketplace Items', formatNumber(inventoryData.marketplaceItems)]
      ];

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      summaryData.forEach((row, index) => {
        checkPageBreak(8); // Check space for each row
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

      // Wood Types Distribution
      const topWoodTypes = getTopWoodTypes();
      checkPageBreak(20 + (topWoodTypes.length * 5)); // Check space for section
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('WOOD TYPES DISTRIBUTION', leftMargin + 3, yPos + 2);
      yPos += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      topWoodTypes.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(leftMargin, yPos - 2, contentWidth, 5, 'F');
        }
        
        doc.setFont(undefined, 'normal');
        doc.text(row[0], leftMargin + 3, yPos);
        const valueText = `${formatNumber(row[1])} units`;
        const valueWidth = doc.getTextWidth(valueText);
        doc.text(valueText, pageWidth - rightMargin - 3 - valueWidth, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Board Sizes Distribution
      const topBoardSizes = getTopBoardSizes();
      checkPageBreak(20 + (topBoardSizes.length * 5)); // Check space for section
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('BOARD SIZES DISTRIBUTION', leftMargin + 3, yPos + 2);
      yPos += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      topBoardSizes.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(leftMargin, yPos - 2, contentWidth, 5, 'F');
        }
        
        doc.setFont(undefined, 'normal');
        doc.text(row[0], leftMargin + 3, yPos);
        const valueText = `${formatNumber(row[1])} units`;
        const valueWidth = doc.getTextWidth(valueText);
        doc.text(valueText, pageWidth - rightMargin - 3 - valueWidth, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Thickness Distribution
      const topThicknesses = getTopThicknesses();
      checkPageBreak(20 + (topThicknesses.length * 5)); // Check space for section
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('THICKNESS DISTRIBUTION', leftMargin + 3, yPos + 2);
      yPos += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      topThicknesses.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(leftMargin, yPos - 2, contentWidth, 5, 'F');
        }
        
        doc.setFont(undefined, 'normal');
        doc.text(row[0], leftMargin + 3, yPos);
        const valueText = `${formatNumber(row[1])} units`;
        const valueWidth = doc.getTextWidth(valueText);
        doc.text(valueText, pageWidth - rightMargin - 3 - valueWidth, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Colors Distribution
      const topColors = getTopColors();
      checkPageBreak(20 + (topColors.length * 5)); // Check space for section
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('COLORS DISTRIBUTION', leftMargin + 3, yPos + 2);
      yPos += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      topColors.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(leftMargin, yPos - 2, contentWidth, 5, 'F');
        }
        
        doc.setFont(undefined, 'normal');
        doc.text(row[0], leftMargin + 3, yPos);
        const valueText = `${formatNumber(row[1])} units`;
        const valueWidth = doc.getTextWidth(valueText);
        doc.text(valueText, pageWidth - rightMargin - 3 - valueWidth, yPos);
        yPos += 5;
      });
      yPos += 8;

      // Operations Summary
      checkPageBreak(25); // Check space for operations summary
      doc.setFillColor(255, 243, 205);
      doc.rect(leftMargin, yPos, contentWidth, 16, 'F');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Operations Summary', leftMargin + 3, yPos + 4);
      doc.setFont(undefined, 'normal');
      const opsText = `Completed Orders: ${inventoryData.completedOrders} | Monthly Releases: ${inventoryData.monthlyReleases} | Stock Health: ${getStockHealthPercentage()}%`;
      doc.text(opsText, leftMargin + 3, yPos + 8);
      const additionalOpsText = `Total Suppliers: ${inventoryData.totalSuppliers} | Marketplace Items: ${inventoryData.marketplaceItems} | Low Stock Items: ${inventoryData.lowStockItems}`;
      doc.text(additionalOpsText, leftMargin + 3, yPos + 12);
      yPos += 20;

      // Disclaimer
      checkPageBreak(25); // Check space for disclaimer
      doc.setFillColor(248, 249, 250);
      const disclaimerHeight = 18;
      doc.rect(leftMargin, yPos, contentWidth, disclaimerHeight, 'F');
      doc.setTextColor(73, 80, 87);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text('Important Notice:', leftMargin + 3, yPos + 4);
      doc.setFont(undefined, 'normal');
      
      const disclaimerText = 'This inventory report is generated from real-time data and provides a comprehensive overview of current stock levels, distribution, and operational metrics. All quantities are accurate as of the generation date.';
      const splitText = doc.splitTextToSize(disclaimerText, contentWidth - 6);
      doc.text(splitText, leftMargin + 3, yPos + 7);
      yPos += disclaimerHeight + 6;

      // Footer
      checkPageBreak(15); // Check space for footer
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
      doc.save(`Inventory_Overview_${currentDateStr}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Generate CSV Inventory Report
  const generateCSVReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const csvData = [
      ['Inventory Overview Report'],
      ['Generated Date', currentDate],
      ['Company', 'Wood Art Gallery'],
      [''],
      ['INVENTORY SUMMARY'],
      ['Metric', 'Value'],
      ['Total Stock Items', inventoryData.totalCombinations],
      ['Total Quantity Available', inventoryData.totalQuantity],
      ['Stock Health Percentage', `${getStockHealthPercentage()}%`],
      ['Low Stock Alerts', inventoryData.lowStockItems],
      ['Active Suppliers', inventoryData.totalSuppliers],
      ['Completed Orders', inventoryData.completedOrders],
      ['Marketplace Items', inventoryData.marketplaceItems],
      [''],
      ['WOOD TYPES DISTRIBUTION'],
      ['Wood Type', 'Quantity'],
      ...getTopWoodTypes().map(([type, quantity]) => [type, quantity]),
      [''],
      ['BOARD SIZES DISTRIBUTION'],
      ['Board Size', 'Quantity'],
      ...getTopBoardSizes().map(([size, quantity]) => [size, quantity]),
      [''],
      ['THICKNESS DISTRIBUTION'],
      ['Thickness', 'Quantity'],
      ...getTopThicknesses().map(([thickness, quantity]) => [thickness, quantity]),
      [''],
      ['COLORS DISTRIBUTION'],
      ['Color', 'Quantity'],
      ...getTopColors().map(([color, quantity]) => [color, quantity]),
      [''],
      ['OPERATIONS SUMMARY'],
      ['Completed Orders', inventoryData.completedOrders],
      ['Monthly Releases', inventoryData.monthlyReleases],
      ['Stock Health %', getStockHealthPercentage()],
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
    link.download = `Inventory_Overview_${currentDateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStockHealthPercentage = () => {
    if (inventoryData.totalCombinations === 0) return 0;
    const healthyItems = inventoryData.totalCombinations - inventoryData.lowStockItems;
    return Math.round((healthyItems / inventoryData.totalCombinations) * 100);
  };

  const getTopWoodTypes = () => {
    return Object.entries(inventoryData.stockDistribution.woodTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getTopBoardSizes = () => {
    return Object.entries(inventoryData.stockDistribution.boardSizes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4);
  };

  const getTopThicknesses = () => {
    return Object.entries(inventoryData.stockDistribution.thicknesses)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  // Added: get top colors helper
  const getTopColors = () => {
    return Object.entries(inventoryData.stockDistribution.colors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6);
  };

  const createPieChartStyle = (data, colors) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      return { background: '#e0e0e0' };
    }

    const segments = [];
    let currentAngle = 0;

    Object.entries(data).forEach(([key, value], index) => {
      if (value > 0) {
        const percentage = (value / total) * 100;
        const angle = (percentage / 100) * 360;
        segments.push(`${colors[index % colors.length]} ${currentAngle}deg ${currentAngle + angle}deg`);
        currentAngle += angle;
      }
    });

    return {
      background: `conic-gradient(${segments.join(', ')})`
    };
  };

  // Added: Map color names to hex codes (tan, blue, brown, etc.)
  const COLOR_NAME_TO_HEX = {
    tan: '#D2B48C',
    blue: '#0000FF',
    brown: '#A52A2A',
    red: '#FF0000',
    green: '#008000',
    yellow: '#FFFF00',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    black: '#000000',
    white: '#FFFFFF',
    gray: '#808080',
    grey: '#808080',
    maroon: '#800000',
    navy: '#000080',
    teal: '#008080',
    olive: '#808000',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    beige: '#F5F5DC',
    ivory: '#FFFFF0',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    // Wood tone aliases often used in inventory
    walnut: '#773F1A',
    mahogany: '#8E3B1A',
    cherry: '#A22C29',
    maple: '#D2B48C', // close to tan/burlywood
    oak: '#C3B091',
  };

  const getColorHex = (name) => {
    if (!name) return '#999999';
    const n = String(name).toLowerCase().trim();
    // If already a hex code, return as-is
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(n)) return n;
    // Try exact match, then remove spaces
    if (COLOR_NAME_TO_HEX[n]) return COLOR_NAME_TO_HEX[n];
    const compact = n.replace(/\s+/g, '');
    if (COLOR_NAME_TO_HEX[compact]) return COLOR_NAME_TO_HEX[compact];
    // Fallback
    return '#999999';
  };

  if (loading) {
    return (
      <div className="inv-ovw-loading-wrapper">
        <div className="inv-ovw-loading-spinner"></div>
        <p className="inv-ovw-loading-text">Loading inventory overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inv-ovw-error-wrapper">
        <div className="inv-ovw-error-icon">⚠️</div>
        <p className="inv-ovw-error-text">{error}</p>
        <button className="inv-ovw-retry-btn" onClick={fetchInventoryData}>
          Retry
        </button>
      </div>
    );
  }

  const topWoodTypes = getTopWoodTypes();
  const topBoardSizes = getTopBoardSizes();
  const topThicknesses = getTopThicknesses();
  // Added: compute top colors
  const topColors = getTopColors();
  const stockHealthPercentage = getStockHealthPercentage();

  return (
    <div className="inv-ovw-main-container">
      {/* Header Section */}
      <div className="inv-ovw-header-section">
        <div className="inv-ovw-header-content">
          <h1 className="inv-ovw-main-title">Advanced Inventory Overview</h1>
          <p className="inv-ovw-subtitle">Real-time inventory management and analytics</p>
        </div>
      </div>

      {/* Main Summary Cards */}
      <div className="inv-ovw-summary-grid">
        <div className="inv-ovw-card inv-ovw-stock-card">
          <div className="inv-ovw-card-header">
            <div className="inv-ovw-card-icon inv-ovw-stock-icon">📦</div>
            <div className="inv-ovw-card-info">
              <h3 className="inv-ovw-card-title">Total Stock Items</h3>
              <div className="inv-ovw-card-amount inv-ovw-stock-amount">
                {formatNumber(inventoryData.totalCombinations)}
              </div>
            </div>
          </div>
          <div className="inv-ovw-card-description">
            Unique material combinations
          </div>
        </div>

        <div className="inv-ovw-card inv-ovw-quantity-card">
          <div className="inv-ovw-card-header">
            <div className="inv-ovw-card-icon inv-ovw-quantity-icon">📊</div>
            <div className="inv-ovw-card-info">
              <h3 className="inv-ovw-card-title">Total Quantity</h3>
              <div className="inv-ovw-card-amount inv-ovw-quantity-amount">
                {formatNumber(inventoryData.totalQuantity)}
              </div>
            </div>
          </div>
          <div className="inv-ovw-card-description">
            Total units in stock
          </div>
        </div>

        <div className="inv-ovw-card inv-ovw-health-card">
          <div className="inv-ovw-card-header">
            <div className="inv-ovw-card-icon inv-ovw-health-icon">🎯</div>
            <div className="inv-ovw-card-info">
              <h3 className="inv-ovw-card-title">Stock Health</h3>
              <div className={`inv-ovw-card-amount ${stockHealthPercentage >= 80 ? 'inv-ovw-healthy' : stockHealthPercentage >= 60 ? 'inv-ovw-warning' : 'inv-ovw-critical'}`}>
                {stockHealthPercentage}%
              </div>
            </div>
          </div>
          <div className="inv-ovw-card-description">
            Healthy stock percentage
          </div>
        </div>
      </div>

      {/* Status Cards Row */}
      <div className="inv-ovw-status-grid">
        <div className="inv-ovw-status-card inv-ovw-alert-card">
          <div className="inv-ovw-status-icon">⚠️</div>
          <div className="inv-ovw-status-info">
            <div className="inv-ovw-status-number">{inventoryData.lowStockItems}</div>
            <div className="inv-ovw-status-label">Low Stock Alerts</div>
          </div>
        </div>

        <div className="inv-ovw-status-card inv-ovw-suppliers-card">
          <div className="inv-ovw-status-icon">🏭</div>
          <div className="inv-ovw-status-info">
            <div className="inv-ovw-status-number">{inventoryData.totalSuppliers}</div>
            <div className="inv-ovw-status-label">Active Suppliers</div>
          </div>
        </div>

        <div className="inv-ovw-status-card inv-ovw-orders-card">
          <div className="inv-ovw-status-icon">✅</div>
          <div className="inv-ovw-status-info">
            <div className="inv-ovw-status-number">{inventoryData.completedOrders}</div>
            <div className="inv-ovw-status-label">Completed Custom Orders</div>
          </div>
        </div>

        <div className="inv-ovw-status-card inv-ovw-releases-card">
          <div className="inv-ovw-status-icon">📤</div>
          <div className="inv-ovw-status-info">
            <div className="inv-ovw-status-number">{inventoryData.monthlyReleases}</div>
            <div className="inv-ovw-status-label">Stock Releases</div>
          </div>
        </div>

        <div className="inv-ovw-status-card inv-ovw-marketplace-card">
          <div className="inv-ovw-status-icon">🛒</div>
          <div className="inv-ovw-status-info">
            <div className="inv-ovw-status-number">{formatNumber(inventoryData.marketplaceItems || 0)}</div>
            <div className="inv-ovw-status-label">Marketplace Items</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="inv-ovw-charts-container">
        {/* Wood Types Distribution Chart */}
        <div className="inv-ovw-chart-wrapper">
          <div className="inv-ovw-chart-header">
            <h2 className="inv-ovw-chart-title">Wood Types Distribution</h2>
            <div className="inv-ovw-chart-total">{formatNumber(inventoryData.totalQuantity)} units</div>
          </div>
          
          <div className="inv-ovw-chart-body">
            <div className="inv-ovw-pie-container">
              <div 
                className="inv-ovw-pie-chart inv-ovw-wood-pie"
                style={createPieChartStyle(inventoryData.stockDistribution.woodTypes, ['#8B4513', '#CD853F', '#DEB887', '#F4A460', '#A0522D'])}
              >
                <div className="inv-ovw-pie-center">
                  <div className="inv-ovw-center-label">Wood Types</div>
                  <div className="inv-ovw-center-value">{Object.keys(inventoryData.stockDistribution.woodTypes).length}</div>
                </div>
              </div>
            </div>
            
            <div className="inv-ovw-legend-container">
              {topWoodTypes.map(([type, quantity], index) => {
                const colors = ['#8B4513', '#CD853F', '#DEB887', '#F4A460', '#A0522D'];
                const total = Object.values(inventoryData.stockDistribution.woodTypes).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? ((quantity / total) * 100).toFixed(1) : 0;
                
                return (
                  <div key={type} className="inv-ovw-legend-item">
                    <div className="inv-ovw-legend-dot" style={{backgroundColor: colors[index]}}></div>
                    <div className="inv-ovw-legend-info">
                      <div className="inv-ovw-legend-label">{type}</div>
                      <div className="inv-ovw-legend-value">{formatNumber(quantity)} units</div>
                      <div className="inv-ovw-legend-percent">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Board Sizes Distribution Chart */}
        <div className="inv-ovw-chart-wrapper">
          <div className="inv-ovw-chart-header">
            <h2 className="inv-ovw-chart-title">Board Sizes Distribution</h2>
            <div className="inv-ovw-chart-total">{formatNumber(inventoryData.totalQuantity)} units</div>
          </div>
          
          <div className="inv-ovw-chart-body">
            <div className="inv-ovw-pie-container">
              <div 
                className="inv-ovw-pie-chart inv-ovw-size-pie"
                style={createPieChartStyle(inventoryData.stockDistribution.boardSizes, ['#4A90E2', '#50C878', '#FF6B6B', '#FFD700'])}
              >
                <div className="inv-ovw-pie-center">
                  <div className="inv-ovw-center-label">Board Sizes</div>
                  <div className="inv-ovw-center-value">{Object.keys(inventoryData.stockDistribution.boardSizes).length}</div>
                </div>
              </div>
            </div>
            
            <div className="inv-ovw-legend-container">
              {topBoardSizes.map(([size, quantity], index) => {
                const colors = ['#4A90E2', '#50C878', '#FF6B6B', '#FFD700'];
                const total = Object.values(inventoryData.stockDistribution.boardSizes).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? ((quantity / total) * 100).toFixed(1) : 0;
                
                return (
                  <div key={size} className="inv-ovw-legend-item">
                    <div className="inv-ovw-legend-dot" style={{backgroundColor: colors[index]}}></div>
                    <div className="inv-ovw-legend-info">
                      <div className="inv-ovw-legend-label">{size}</div>
                      <div className="inv-ovw-legend-value">{formatNumber(quantity)} units</div>
                      <div className="inv-ovw-legend-percent">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Thickness Distribution Chart */}
        <div className="inv-ovw-chart-wrapper">
          <div className="inv-ovw-chart-header">
            <h2 className="inv-ovw-chart-title">Thickness Distribution</h2>
            <div className="inv-ovw-chart-total">{formatNumber(inventoryData.totalQuantity)} units</div>
          </div>
          
          <div className="inv-ovw-chart-body">
            <div className="inv-ovw-pie-container">
              <div 
                className="inv-ovw-pie-chart inv-ovw-thickness-pie"
                style={createPieChartStyle(inventoryData.stockDistribution.thicknesses, ['#9C27B0', '#E91E63', '#FF5722', '#FF9800', '#FFC107'])}
              >
                <div className="inv-ovw-pie-center">
                  <div className="inv-ovw-center-label">Thickness</div>
                  <div className="inv-ovw-center-value">{Object.keys(inventoryData.stockDistribution.thicknesses).length}</div>
                </div>
              </div>
            </div>
            
            <div className="inv-ovw-legend-container">
              {topThicknesses.map(([thickness, quantity], index) => {
                const colors = ['#9C27B0', '#E91E63', '#FF5722', '#FF9800', '#FFC107'];
                const total = Object.values(inventoryData.stockDistribution.thicknesses).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? ((quantity / total) * 100).toFixed(1) : 0;
                
                return (
                  <div key={thickness} className="inv-ovw-legend-item">
                    <div className="inv-ovw-legend-dot" style={{backgroundColor: colors[index]}}></div>
                    <div className="inv-ovw-legend-info">
                      <div className="inv-ovw-legend-label">{thickness}</div>
                      <div className="inv-ovw-legend-value">{formatNumber(quantity)} units</div>
                      <div className="inv-ovw-legend-percent">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colors Distribution Chart */}
        <div className="inv-ovw-chart-wrapper">
          <div className="inv-ovw-chart-header">
            <h2 className="inv-ovw-chart-title">Colors Distribution</h2>
            <div className="inv-ovw-chart-total">{formatNumber(inventoryData.totalQuantity)} units</div>
          </div>
          
          <div className="inv-ovw-chart-body">
            <div className="inv-ovw-pie-container">
              {(() => {
                const colorKeys = Object.keys(inventoryData.stockDistribution.colors);
                const palette = colorKeys.map((k) => getColorHex(k));
                return (
                  <div 
                    className="inv-ovw-pie-chart inv-ovw-colors-pie"
                    style={createPieChartStyle(inventoryData.stockDistribution.colors, palette)}
                  >
                    <div className="inv-ovw-pie-center">
                      <div className="inv-ovw-center-label">Colors</div>
                      <div className="inv-ovw-center-value">{colorKeys.length}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="inv-ovw-legend-container">
              {topColors.map(([colorName, quantity]) => {
                const total = Object.values(inventoryData.stockDistribution.colors).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? ((quantity / total) * 100).toFixed(1) : 0;
                const hex = getColorHex(colorName);
                
                return (
                  <div key={colorName} className="inv-ovw-legend-item">
                    <div className="inv-ovw-legend-dot" style={{backgroundColor: hex, border: '1px solid #e0e0e0'}}></div>
                    <div className="inv-ovw-legend-info">
                      <div className="inv-ovw-legend-label">{colorName}</div>
                      <div className="inv-ovw-legend-value">{formatNumber(quantity)} units</div>
                      <div className="inv-ovw-legend-percent">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Section */}
      <div className="inv-ovw-details-section">
        <h2 className="inv-ovw-section-title">Inventory Analytics</h2>
        
        <div className="inv-ovw-details-grid">
          <div className="inv-ovw-detail-group">
            <h3 className="inv-ovw-group-title">Stock Status</h3>
            <div className="inv-ovw-detail-items">
              <div className="inv-ovw-detail-item">
                <span className="inv-ovw-detail-label">Total Stock Combinations</span>
                <span className="inv-ovw-detail-value">{formatNumber(inventoryData.totalCombinations)}</span>
              </div>
              <div className="inv-ovw-detail-item">
                <span className="inv-ovw-detail-label">Total Quantity Available</span>
                <span className="inv-ovw-detail-value">{formatNumber(inventoryData.totalQuantity)} units</span>
              </div>
            </div>
          </div>

          <div className="inv-ovw-detail-group">
            <h3 className="inv-ovw-group-title">Operations</h3>
            <div className="inv-ovw-detail-items">
              <div className="inv-ovw-detail-item">
                <span className="inv-ovw-detail-label">Active Suppliers</span>
                <span className="inv-ovw-detail-value">{inventoryData.totalSuppliers}</span>
              </div>
              <div className="inv-ovw-detail-item">
                <span className="inv-ovw-detail-label">Total Completed Orders</span>
                <span className="inv-ovw-detail-value">{inventoryData.completedOrders}</span>
              </div>
              <div className="inv-ovw-detail-item">
                <span className="inv-ovw-detail-label">This Month's Releases</span>
                <span className="inv-ovw-detail-value">{inventoryData.monthlyReleases}</span>
              </div>
              <div className="inv-ovw-detail-item">
                <span className="inv-ovw-detail-label">Marketplace Items</span>
                <span className="inv-ovw-detail-value">{inventoryData.marketplaceItems}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Section */}
      <div className="inv-ovw-report-section">
        <h2 className="inv-ovw-section-title">Generate Reports</h2>
        <div className="inv-ovw-report-actions">
          <button 
            className="inv-ovw-report-btn pdf-btn"
            onClick={generatePDFReport}
            title="Download PDF Inventory Report"
          >
            <span className="report-icon">📄</span>
            PDF Inventory Report
          </button>
          <button 
            className="inv-ovw-report-btn csv-btn"
            onClick={generateCSVReport}
            title="Download CSV Inventory Report"
          >
            <span className="report-icon">📊</span>
            CSV Inventory Report
          </button>
        </div>
      </div>
    </div>
  );
}
