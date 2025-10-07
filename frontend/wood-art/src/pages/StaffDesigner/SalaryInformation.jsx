import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './SalaryInformation.css';
import logo from '../../assets/logo.png';
import jsPDF from 'jspdf';

export default function SalaryInformation() {
  const { user } = useAuth();
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (user && user.email) {
      fetchSalaryRecords();
    }
  }, [user]);

  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/staff-designer-salaries');
      const data = await res.json();
      
      if (data.success) {
        // Filter records for the current logged-in staff designer
        const userRecords = data.salaries.filter(salary => 
          salary.staffDesignerEmail === user.email
        );
        setSalaryRecords(userRecords);
        
        // Set the most recent record as selected by default
        if (userRecords.length > 0) {
          setSelectedRecord(userRecords[0]);
        }
      } else {
        setError(data.message || 'Failed to load salary records');
      }
    } catch (err) {
      setError('Error loading salary records');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate PDF Report
  const generatePDFReport = async (record) => {
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
      const titleText = 'EMPLOYEE SALARY STATEMENT';
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
      yPos += 9;

      // Period and report number (centered) - Better spacing
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(108, 117, 125);
      const periodText = `Period: ${record.month} ${record.year}`;
      const periodWidth = doc.getTextWidth(periodText);
      doc.text(periodText, (pageWidth - periodWidth) / 2, yPos);
      yPos += 5;

      const reportNo = `Report No: WSG-${record.year}-${record.month.substring(0,3).toUpperCase()}-${record.transactionId.substring(0, 8)}`;
      const reportNoWidth = doc.getTextWidth(reportNo);
      doc.text(reportNo, (pageWidth - reportNoWidth) / 2, yPos);
      yPos += 12;

      // Employee Information Section - More visible
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Employee Information', leftMargin + 3, yPos + 2);
      yPos += 10;

      // Employee details in two columns - Better readability
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      const col1X = leftMargin + 4;
      const col2X = pageWidth / 2 + 4;
      let tempYPos = yPos;
      
      // Left column - Personal Details
      doc.setFont(undefined, 'bold');
      doc.text('Personal Details', col1X, tempYPos);
      doc.setFont(undefined, 'normal');
      tempYPos += 4;
      doc.text(`Name: ${record.staffDesignerName}`, col1X, tempYPos);
      tempYPos += 3.5;
      doc.text(`Email: ${record.staffDesignerEmail}`, col1X, tempYPos);
      tempYPos += 3.5;
      doc.text('Position: Staff Designer', col1X, tempYPos);

      // Right column - Pay Period (reset tempYPos to match left column start)
      tempYPos = yPos;
      doc.setFont(undefined, 'bold');
      doc.text('Pay Period', col2X, tempYPos);
      doc.setFont(undefined, 'normal');
      tempYPos += 4;
      doc.text(`Month: ${record.month}`, col2X, tempYPos);
      tempYPos += 3.5;
      doc.text(`Year: ${record.year}`, col2X, tempYPos);
      tempYPos += 3.5;
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, col2X, tempYPos);
      
      // Move yPos to after both columns
      yPos += 16;

      // Earnings Section - More visible
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Earnings Breakdown', leftMargin + 3, yPos + 2);
      yPos += 10;

      // Earnings table - Better readability
      const earningsData = [
        ['Basic Salary', formatCurrency(record.basicSalary)],
        ['Allowances', formatCurrency(record.allowances)],
        ['EPF Contribution (Company)', formatCurrency(record.epfCompanyShare)],
        ['ETF Contribution (Company)', formatCurrency(record.etfCompanyShare)],
        ['GROSS SALARY', formatCurrency(record.grossSalary)]
      ];

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      earningsData.forEach((row, index) => {
        // Add alternating background for better readability
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(leftMargin, yPos - 2, contentWidth, 5, 'F');
        }
        
        doc.setFont(undefined, index === earningsData.length - 1 ? 'bold' : 'normal');
        doc.text(row[0], leftMargin + 3, yPos);
        const amountWidth = doc.getTextWidth(row[1]);
        doc.text(row[1], pageWidth - rightMargin - 3 - amountWidth, yPos);
        yPos += 5;
      });
      yPos += 6;

      // Deductions Section - More visible
      doc.setFillColor(44, 62, 80);
      doc.rect(leftMargin, yPos - 3, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Deductions', leftMargin + 3, yPos + 2);
      yPos += 10;

      // Deductions table - Better readability
      const deductionsData = [
        ['EPF Contribution (Employee - 8%)', formatCurrency(record.epfEmployeeShare)],
        ['Income Tax', record.taxAmount > 0 ? formatCurrency(record.taxAmount) : 'N/A'],
        ['Loan Installments', record.loanInstallments > 0 ? formatCurrency(record.loanInstallments) : 'N/A']
      ];

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      deductionsData.forEach((row, index) => {
        // Add alternating background for better readability
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(leftMargin, yPos - 2, contentWidth, 5, 'F');
        }
        
        doc.text(row[0], leftMargin + 3, yPos);
        const amountWidth = doc.getTextWidth(row[1]);
        doc.text(row[1], pageWidth - rightMargin - 3 - amountWidth, yPos);
        yPos += 5;
      });
      yPos += 7;

      // Net Salary Box - More prominent and visible
      doc.setFillColor(40, 167, 69);
      doc.rect(leftMargin, yPos, contentWidth, 16, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      const netSalaryLabel = 'NET SALARY PAYABLE';
      const netSalaryAmount = formatCurrency(record.netSalary);
      const labelWidth = doc.getTextWidth(netSalaryLabel);
      doc.text(netSalaryLabel, (pageWidth - labelWidth) / 2, yPos + 6);
      doc.setFontSize(15);
      const amountWidth = doc.getTextWidth(netSalaryAmount);
      doc.text(netSalaryAmount, (pageWidth - amountWidth) / 2, yPos + 12);
      yPos += 20;

      // Transaction Information - More visible
      doc.setFillColor(255, 243, 205);
      doc.rect(leftMargin, yPos, contentWidth, 10, 'F');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Payment Information', leftMargin + 3, yPos + 4);
      doc.setFont(undefined, 'normal');
      doc.text(`Transaction Reference: ${record.transactionId}`, leftMargin + 3, yPos + 7);
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
      
      const disclaimerText = 'This salary statement is confidential and intended solely for the named employee. All amounts are in LKR. EPF and ETF contributions are made as per Sri Lankan labor law requirements. For queries, contact HR department.';
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
      doc.save(`Salary_Report_${record.staffDesignerName}_${record.month}_${record.year}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Generate CSV Report
  const generateCSVReport = (record) => {
    const csvData = [
      ['Employee Salary Report'],
      ['Employee Name', record.staffDesignerName],
      ['Employee Email', record.staffDesignerEmail],
      ['Report Period', `${record.month} ${record.year}`],
      ['Report Generated', new Date().toLocaleDateString()],
      ['Transaction ID', record.transactionId],
      [''],
      ['EARNINGS BREAKDOWN'],
      ['Description', 'Amount (LKR)'],
      ['Basic Salary', record.basicSalary],
      ['Allowances', record.allowances],
      ['EPF (Company Share)', record.epfCompanyShare],
      ['ETF (Company Share)', record.etfCompanyShare],
      ['Gross Salary', record.grossSalary],
      [''],
      ['DEDUCTIONS'],
      ['Description', 'Amount (LKR)'],
      ['EPF (Employee Share)', record.epfEmployeeShare],
      ['Income Tax', record.taxAmount || 0],
      ['Loan Installments', record.loanInstallments || 0],
      [''],
      ['NET SALARY PAYABLE', record.netSalary],
      [''],
      ['Company Contact Information'],
      ['Email', 'contact@woodartgallery.com'],
      ['Phone', '+94 77 123 4567'],
      ['Address', 'No. 123, Galle Road, Colombo 03, Sri Lanka']
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Salary_Report_${record.staffDesignerName}_${record.month}_${record.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="salary-information">
        <h1 className="staffdesigner-dashboard-title">Salary Information</h1>
        <div className="loading-state">Loading salary information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="salary-information">
        <h1 className="staffdesigner-dashboard-title">Salary Information</h1>
        <div className="error-state">{error}</div>
      </div>
    );
  }

  if (salaryRecords.length === 0) {
    return (
      <div className="salary-information">
        <h1 className="staffdesigner-dashboard-title">Salary Information</h1>
        <div className="no-salary-data">
          <p>No salary records found. Your salary information will appear here once it's been processed by the financial team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-information">
      <h1 className="staffdesigner-dashboard-title">Salary Information</h1>
      
      {/* Salary Records List */}
      <div className="salary-records-section">
        <h2>Salary Records</h2>
        <div className="salary-records-list">
          {salaryRecords.map((record) => (
            <div 
              key={record._id} 
              className={`salary-record-item ${selectedRecord?._id === record._id ? 'active' : ''}`}
              onClick={() => setSelectedRecord(record)}
            >
              <div className="record-header">
                <span className="record-month">{record.month} {record.year}</span>
                <span className="record-net-salary">{formatCurrency(record.netSalary)}</span>
              </div>
              <div className="record-date">
                Processed: {formatDate(record.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Salary Report */}
      {selectedRecord && (
        <div className="salary-report-section">
          <div className="salary-report">
            <div className="salary-report-header">
              <h2>Salary Report</h2>
              <div className="report-period">
                {selectedRecord.month} {selectedRecord.year}
              </div>
            </div>

            <div className="salary-details">
              <div className="staff-info">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{selectedRecord.staffDesignerName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{selectedRecord.staffDesignerEmail}</span>
                </div>
                <div className="info-row">
                  <span className="label">Month:</span>
                  <span className="value">{selectedRecord.month} {selectedRecord.year}</span>
                </div>
              </div>

              <div className="earnings-section">
                <h3>Earnings</h3>
                <div className="info-row">
                  <span className="label">Basic Salary:</span>
                  <span className="value amount">{formatCurrency(selectedRecord.basicSalary)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Allowances:</span>
                  <span className="value amount">{formatCurrency(selectedRecord.allowances)}</span>
                </div>
                <div className="info-row">
                  <span className="label">EPF (Company Share):</span>
                  <span className="value amount">{formatCurrency(selectedRecord.epfCompanyShare)}</span>
                </div>
                <div className="info-row">
                  <span className="label">ETF (Company Share):</span>
                  <span className="value amount">{formatCurrency(selectedRecord.etfCompanyShare)}</span>
                </div>
                <div className="info-row total">
                  <span className="label">Gross Salary:</span>
                  <span className="value amount">{formatCurrency(selectedRecord.grossSalary)}</span>
                </div>
              </div>

              <div className="deductions-section">
                <h3>Deductions</h3>
                <div className="info-row">
                  <span className="label">EPF(Employee Share):</span>
                  <span className="value amount">{formatCurrency(selectedRecord.epfEmployeeShare)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Tax:</span>
                  <span className="value amount">{selectedRecord.taxAmount > 0 ? formatCurrency(selectedRecord.taxAmount) : '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Loans:</span>
                  <span className="value amount">{selectedRecord.loanInstallments > 0 ? formatCurrency(selectedRecord.loanInstallments) : '-'}</span>
                </div>
              </div>

              <div className="net-salary-section">
                <div className="info-row final">
                  <span className="label">Net Salary:</span>
                  <span className="value amount">{formatCurrency(selectedRecord.netSalary)}</span>
                </div>
              </div>

              <div className="transaction-info">
                <div className="info-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value transaction-id">{selectedRecord.transactionId}</span>
                </div>
              </div>
            </div>

            <div className="report-actions">
              <button 
                className="report-btn pdf-btn"
                onClick={async () => await generatePDFReport(selectedRecord)}
                title="Download PDF Report"
              >
                <span className="report-icon">📄</span>
                PDF Report
              </button>
              <button 
                className="report-btn csv-btn"
                onClick={() => generateCSVReport(selectedRecord)}
                title="Download CSV Report"
              >
                <span className="report-icon">�</span>
                CSV Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
