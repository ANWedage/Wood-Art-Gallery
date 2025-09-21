const nodemailer = require('nodemailer');

// Configure the email transporter
// NOTE: For production, use environment variables for email credentials
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  // Check if email credentials are configured
  if (!emailUser || !emailPassword || emailUser === 'your-email@gmail.com') {
    console.warn('Email credentials not configured. Using mock email service.');
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to other email services
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });
};

const transporter = createTransporter();

// Function to send welcome email with credentials
const sendWelcomeEmail = async (userEmail, userName, userPassword, userRole) => {
  try {
    // If transporter is not configured, simulate email sending
    if (!transporter) {
      console.log('=== MOCK EMAIL SERVICE ===');
      console.log(`To: ${userEmail}`);
      console.log(`Subject: Welcome to Wood Art Gallery - Your Account Details`);
      console.log(`User: ${userName} (${userRole})`);
      console.log(`Email: ${userEmail}`);
      console.log(`Password: ${userPassword}`);
      console.log('=== EMAIL SENT (MOCK) ===');
      return { success: true, message: 'Welcome email sent successfully (mock mode)' };
    }
    const roleDisplayName = {
      'customer': 'Customer',
      'designer': 'Designer',
      'staff-designer': 'Staff Designer',
      'admin': 'Administrator',
      'inventory': 'Inventory Manager',
      'financial': 'Financial Manager',
      'delivery': 'Delivery Staff'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER || 'woodartgallery@gmail.com',
      to: userEmail,
      subject: 'Welcome to Wood Art Gallery - Your Account Details',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #8B4513; margin: 20px 0; }
            .credential-item { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #8B4513; }
            .credential-value { background: #f0f0f0; padding: 8px; border-radius: 4px; font-family: monospace; margin-top: 5px; }
            .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { background: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🪵 Wood Art Gallery</h1>
              <p>Welcome to our creative community!</p>
            </div>
            
            <div class="content">
              <h2>Welcome, ${userName}!</h2>
              <p>Thank you for registering with Wood Art Gallery. Your account has been successfully created as a <strong>${roleDisplayName[userRole] || userRole}</strong>.</p>
              
              <div class="credentials">
                <h3>🔐 Your Login Credentials</h3>
                <div class="credential-item">
                  <div class="credential-label">Email Address:</div>
                  <div class="credential-value">${userEmail}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label">Password:</div>
                  <div class="credential-value">${userPassword}</div>
                </div>
              </div>
              
              <div class="important">
                <strong>⚠️ Important Security Notice:</strong>
                <ul>
                  <li>Keep your credentials secure and don't share them</li>
                  <li>Delete this email after saving your credentials safely</li>
                </ul>
              </div>
              
              <p>You can now log in to your account and start exploring our platform:</p>
              
              ${userRole === 'customer' ? `
                <p><strong>As a Customer, you can:</strong></p>
                <ul>
                  <li>Browse our wood art designs</li>
                  <li>Place custom design orders</li>
                  <li>Track your order status</li>
                  <li>Manage your profile</li>
                </ul>
              ` : userRole === 'designer' ? `
                <p><strong>As a Designer, you can:</strong></p>
                <ul>
                  <li>Upload your creative designs</li>
                  <li>Manage your design portfolio</li>
                  <li>View your earnings</li>
                  <li>Update your profile</li>
                </ul>
              ` : userRole === 'staff-designer' ? `
                <p><strong>As a Staff Designer, you can:</strong></p>
                <ul>
                  <li>View pending custom orders</li>
                  <li>Accept and work on orders</li>
                  <li>Mark orders as completed</li>
                  <li>Notify delivery team</li>
                  <li>Track your salary information</li>
                </ul>
              ` : `
                <p><strong>Welcome to the Wood Art Gallery team!</strong></p>
                <p>Your account has been set up with ${roleDisplayName[userRole] || userRole} privileges.</p>
              `}
              
              <div class="footer">
                <p>If you have any questions or need assistance, please contact our support team.</p>
                <p><strong>Wood Art Gallery Team</strong><br>
                Email: slwoodartgallery@gmail.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${userEmail}`);
    return { success: true, message: 'Welcome email sent successfully' };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, message: 'Failed to send welcome email', error: error.message };
  }
};

// Function to test email configuration
const testEmailConnection = async () => {
  try {
    if (!transporter) {
      return { 
        success: false, 
        message: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file.',
        mock: true
      };
    }
    
    await transporter.verify();
    console.log('Email service is ready to send emails');
    return { success: true, message: 'Email service is configured correctly' };
  } catch (error) {
    console.error('Email service configuration error:', error);
    return { success: false, message: 'Email service configuration error', error: error.message };
  }
};

// Function to send order accepted email to customer
const sendOrderAcceptedEmail = async (customerEmail, customerName, order, baseUrl) => {
  try {
    if (!customerEmail) {
      console.warn('No customer email provided for order accepted email');
      return { success: false, message: 'No customer email provided' };
    }

    // Build public URLs for image and download endpoint
    const base = (baseUrl || '').replace(/\/$/, '');
    const imagePublicUrl = order.referenceImageUrl ? `${base}/${order.referenceImageUrl.replace(/^\/+/, '')}` : null;
    const downloadUrl = `${base}/api/customOrder/${order._id}/download-image`;

    if (!transporter) {
      console.log('=== MOCK EMAIL SERVICE ===');
      console.log(`To: ${customerEmail}`);
      console.log(`Subject: Your Custom Order ${order.orderId || order._id} Has Been Accepted`);
      console.log('Order details:', {
        orderId: order.orderId || order._id,
        estimatedPrice: order.estimatedPrice,
        notes: order.notes
      });
      console.log(`Reference Image (public): ${imagePublicUrl}`);
      console.log(`Download Link: ${downloadUrl}`);
      console.log('=== EMAIL SENT (MOCK) ===');
      return { success: true, message: 'Order accepted email sent (mock mode)' };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'woodartgallery@gmail.com',
      to: customerEmail,
      subject: `Your Custom Order ${order.orderId || order._id} Has Been Accepted`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8B4513; color: white; padding: 15px; text-align: center; border-radius: 8px; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .order-info { background: white; padding: 15px; border-radius: 6px; margin-top: 10px; }
            .footer { color: #666; font-size: 13px; margin-top: 15px; }
            a.button { background: #8B4513; color: white; padding: 10px 14px; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🪵 Wood Art Gallery</h2>
            </div>
            <div class="content">
              <h3>Hi ${customerName || 'Customer'},</h3>
              <p>Good news — your custom order <strong>${order.orderId || order._id}</strong> has been accepted by our staff designer.</p>

              <div class="order-info">
                <p><strong>Order ID:</strong> ${order.orderId || order._id}</p>
                ${order.estimatedPrice ? `<p><strong>Estimated Price:</strong> ${order.estimatedPrice}</p>` : ''}
                ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
                <p><strong>Board:</strong> ${order.boardColor || ''} / ${order.material || ''} / ${order.boardSize || ''} / ${order.boardThickness || ''}</p>
                ${order.description ? `<p><strong>Description:</strong> ${order.description}</p>` : ''}
              </div>

              

              <p>If you have any questions or need to make changes, please reply to this email.</p>

              <div class="footer">
                <p>Thank you for choosing Wood Art Gallery.</p>
                <p><strong>Wood Art Gallery Team</strong><br>slwoodartgallery@gmail.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order accepted email sent successfully to ${customerEmail}`);
    return { success: true, message: 'Order accepted email sent' };
  } catch (error) {
    console.error('Error sending order accepted email:', error);
    return { success: false, message: 'Failed to send order accepted email', error: error.message };
  }
};

// Function to send design deletion notice to designer
const sendDesignDeletionEmail = async (designerEmail, designerName, itemName, itemCode, reason) => {
  try {
    if (!designerEmail) {
      console.warn('No designer email provided for deletion email');
      return { success: false, message: 'No designer email' };
    }
    const codeDisplay = itemCode || 'N/A';
    if (!transporter) {
      console.log('=== MOCK EMAIL SERVICE ===');
      console.log(`To: ${designerEmail}`);
      console.log('Subject: Your Marketplace Item Has Been Removed');
      console.log('Body preview:', { itemName, itemCode: codeDisplay, reason });
      console.log('=== EMAIL SENT (MOCK) ===');
      return { success: true, message: 'Design deletion email sent (mock)' };
    }
    const mailOptions = {
      from: process.env.EMAIL_USER || 'woodartgallery@gmail.com',
      to: designerEmail,
      subject: 'Your Marketplace Item Has Been Removed',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>body{font-family:Arial,sans-serif;color:#333;} .container{max-width:640px;margin:0 auto;padding:24px;} .header{background:#8B4513;color:#fff;padding:18px 24px;border-radius:8px 8px 0 0;} .content{background:#f9f9f9;padding:28px;border-radius:0 0 8px 8px;} .badge{display:inline-block;background:#8B4513;color:#fff;padding:4px 10px;font-size:12px;border-radius:14px;margin-top:6px;} .item-box{background:#fff;padding:16px 18px;border-left:4px solid #8B4513;border-radius:6px;margin:18px 0;} .reason{background:#fff3cd;padding:14px 16px;border:1px solid #ffe08a;border-radius:6px;font-size:14px;} .footer{margin-top:30px;font-size:12px;color:#666;text-align:center;}</style>
      </head><body><div class="container"><div class="header"><h2>🪵 Wood Art Gallery</h2></div><div class="content">
      <p>Hi ${designerName || 'Designer'},</p>
      <p>Your marketplace item has been removed by the Inventory Management team because it violated our terms and conditions.</p>
      <div class="item-box">
        <p><strong>Item:</strong> ${itemName || 'Unnamed Item'}</p>
        <p><strong>Item Code:</strong> ${codeDisplay}</p>
      </div>
      <div class="reason"><strong>Reason:</strong> ${reason || 'Violation of marketplace terms and conditions.'}</div>
      <p>If you believe this was a mistake, you may reply to this email for clarification or submit a revised item compliant with the guidelines.</p>
      <p>Thank you for your understanding.</p>
      <div class="footer">Wood Art Gallery • slwoodartgallery@gmail.com</div></div></div></body></html>`
    };
    await transporter.sendMail(mailOptions);
    console.log(`Design deletion email sent to ${designerEmail}`);
    return { success: true, message: 'Design deletion email sent' };
  } catch (error) {
    console.error('Error sending design deletion email:', error);
    return { success: false, message: 'Failed to send design deletion email', error: error.message };
  }
};

// Function to send payment approved email (for both custom and marketplace orders)
const sendPaymentApprovedEmail = async (customerEmail, customerName, orderId, orderType = 'regular', amount, paymentMethod) => {
  try {
    if (!customerEmail) {
      console.warn('No customer email provided for payment approved email');
      return { success: false, message: 'No customer email' };
    }

    if (!transporter) {
      console.log('=== MOCK EMAIL SERVICE ===');
      console.log(`To: ${customerEmail}`);
      console.log(`Subject: Payment Approved - Order ${orderId}`);
      console.log('Order Type:', orderType, 'Amount:', amount);
      console.log('=== EMAIL SENT (MOCK) ===');
      return { success: true, message: 'Payment approved email sent (mock)' };
    }

    const safeAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount.toFixed(2) : amount || '';
    const displayType = orderType === 'custom' ? 'Custom Order' : 'Marketplace Order';

    const mailOptions = {
      from: process.env.EMAIL_USER || 'woodartgallery@gmail.com',
      to: customerEmail,
      subject: `Payment Approved - ${displayType} ${orderId}`,
      html: `<!DOCTYPE html><html><head><meta charset='utf-8'/>
      <style>
        body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f3ef;color:#2f2f2f;line-height:1.5;}
        .wrapper{max-width:620px;margin:0 auto;padding:0 16px;}
        .card{background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.08);margin-top:24px;}
        .header{background:linear-gradient(135deg,#5c3317,#8b5a2b);padding:28px 24px;text-align:center;color:#ffeedd;}
        .header h1{margin:0;font-size:26px;letter-spacing:0.5px;font-weight:600;color:white;}
        .header small{display:block;margin-top:6px;font-size:13px;color:#f2e3d5;color:white;}
        .content{padding:28px 24px 32px;}
        h2{margin:0 0 16px;font-size:20px;color:#5c3317;}
        p{margin:0 0 14px;}
        .highlight{background:#fff7ec;border:1px solid #f2e1c2;padding:14px 16px;border-radius:8px;}
        .data-box{margin:22px 0 26px;display:flex;flex-wrap:wrap;border:1px solid #e8dccf;border-radius:10px;overflow:hidden;}
        .data-box div{flex:1 1 220px;padding:14px 16px;background:#fcfbf9;border-right:1px solid #e8dccf;}
        .data-box div:last-child{border-right:none;}
        .data-box span.label{display:block;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;color:#8b5a2b;font-weight:600;margin-bottom:4px;}
        .amount{font-size:22px;font-weight:600;color:#4a2c15;}
        .btn{display:inline-block;background:#8b5a2b;color:#fff !important;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;margin-top:8px;}
        .divider{height:1px;background:linear-gradient(to right,transparent,#d4c3b4,transparent);margin:28px 0;}
        .footer{text-align:center;font-size:12px;color:#7a6a5d;padding:18px 0 40px;}
        @media (max-width:560px){.header{padding:22px 18px}.content{padding:24px 18px}.data-box div{flex:1 1 100%;border-right:none;border-bottom:1px solid #e8dccf}.data-box div:last-child{border-bottom:none}.amount{font-size:20px}}
      </style>
      </head><body><div class='wrapper'><div class='card'>
        <div class='header'>
          <h1>🪵 Wood Art Gallery</h1>
          <small>Crafted with passion & authenticity</small>
        </div>
        <div class='content'>
          <h2>Payment Approved</h2>
          <p>Hi ${customerName || 'Valued Customer'},</p>
          <p>Your payment for your <strong>${displayType}</strong> has been <strong style="color:#2e7d32;">approved</strong>. We have started the next steps in processing your order.</p>
          <div class='data-box'>
            <div><span class='label'>Order ID</span><strong>${orderId}</strong></div>
            ${safeAmount ? `<div><span class='label'>Amount</span><span class='amount'>LKR ${safeAmount}</span></div>` : ''}
            <div><span class='label'>Payment Method</span>${paymentMethod ? paymentMethod.replace('_',' ') : 'Bank'}</div>
          </div>
          <div class='highlight'>
            ${orderType === 'custom' ? 'Our artisans will proceed with crafting your custom piece. You will receive updates as it progresses.' : 'Your order is being prepared. We will notify you as it moves toward delivery.'}
          </div>
          <div class='divider'></div>
          <p style='margin-top:0;'>If you have any questions, just reply to this email—our team is happy to help.</p>
          <p style='margin:26px 0 0;font-size:14px;color:#5c3317;font-weight:600;'>Thank you for supporting laser printed wood art.</p>
          <p style='margin:4px 0 0;font-size:13px;color:#6d5a4d;'>Wood Art Gallery Team</p>
        </div>
      </div><div class='footer'>© ${new Date().getFullYear()} Wood Art Gallery • slwoodartgallery@gmail.com</div></div></body></html>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment approved email sent to ${customerEmail}`);
    return { success: true, message: 'Payment approved email sent' };
  } catch (error) {
    console.error('Error sending payment approved email:', error);
    return { success: false, message: 'Failed to send payment approved email', error: error.message };
  }
};

// Function to send payment denied email (for both custom and marketplace orders)
const sendPaymentDeniedEmail = async (customerEmail, customerName, orderId, orderType = 'regular', reason) => {
  try {
    if (!customerEmail) {
      console.warn('No customer email provided for payment denied email');
      return { success: false, message: 'No customer email' };
    }

    if (!transporter) {
      console.log('=== MOCK EMAIL SERVICE ===');
      console.log(`To: ${customerEmail}`);
      console.log(`Subject: Payment Not Approved - Order ${orderId}`);
      console.log('Reason:', reason || 'N/A');
      console.log('=== EMAIL SENT (MOCK) ===');
      return { success: true, message: 'Payment denied email sent (mock)' };
    }

    const displayType = orderType === 'custom' ? 'Custom Order' : 'Marketplace Order';

    const mailOptions = {
      from: process.env.EMAIL_USER || 'woodartgallery@gmail.com',
      to: customerEmail,
      subject: `Payment Not Approved - ${displayType} ${orderId}`,
      html: `<!DOCTYPE html><html><head><meta charset='utf-8'/>
      <style>
        body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f3ef;color:#2f2f2f;line-height:1.5;}
        .wrapper{max-width:620px;margin:0 auto;padding:0 16px;}
        .card{background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.08);margin-top:24px;}
        .header{background:linear-gradient(135deg,#5c3317,#8b5a2b);padding:28px 24px;text-align:center;color:#ffeedd;}
        .header h1{margin:0;font-size:26px;letter-spacing:0.5px;font-weight:600;color:white;}
        .header small{display:block;margin-top:6px;font-size:13px;color:#f2e3d5;color:white;}
        .content{padding:28px 24px 32px;}
        h2{margin:0 0 16px;font-size:20px;color:#5c3317;}
        p{margin:0 0 14px;}
        .alert{background:#fff4f2;border:1px solid #f3c6bd;padding:14px 16px;border-radius:8px;}
        .reason{background:#fff7ec;border:1px solid #f2e1c2;padding:12px 14px;border-radius:6px;margin-top:12px;font-size:14px;}
        .divider{height:1px;background:linear-gradient(to right,transparent,#d4c3b4,transparent);margin:28px 0;}
        .footer{text-align:center;font-size:12px;color:#7a6a5d;padding:18px 0 40px;}
        @media (max-width:560px){.header{padding:22px 18px}.content{padding:24px 18px}}
      </style>
      </head><body><div class='wrapper'><div class='card'>
        <div class='header'>
          <h1>🪵 Wood Art Gallery</h1>
          <small>Crafted with passion & authenticity</small>
        </div>
        <div class='content'>
          <h2>Payment Not Approved</h2>
          <p>Hi ${customerName || 'Valued Customer'},</p>
          <p>We reviewed the bank payment you submitted for <strong>${displayType}</strong> <strong>${orderId}</strong>, but unfortunately it could not be approved.</p>
          <div class='alert'>The order remains unpaid. ${orderType === 'custom' ? 'You may re-submit payment so the custom work can begin.' : 'You may place a new order and upload a valid payment.'}</div>
          ${reason ? `<div class='reason'><strong>Reason Provided:</strong><br>${reason}</div>` : ''}
          <div class='divider'></div>
          <p style='margin-top:0;'>If you believe this is a mistake or need assistance, reply to this email and our team will help.</p>
          <p style='margin:26px 0 0;font-size:14px;color:#5c3317;font-weight:600;'>We appreciate your interest in our laser printed wood pieces.</p>
          <p style='margin:4px 0 0;font-size:13px;color:#6d5a4d;'>Wood Art Gallery Team</p>
        </div>
      </div><div class='footer'>© ${new Date().getFullYear()} Wood Art Gallery • slwoodartgallery@gmail.com</div></div></body></html>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment denied email sent to ${customerEmail}`);
    return { success: true, message: 'Payment denied email sent' };
  } catch (error) {
    console.error('Error sending payment denied email:', error);
    return { success: false, message: 'Failed to send payment denied email', error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  testEmailConnection,
  sendOrderAcceptedEmail,
  sendDesignDeletionEmail,
  sendPaymentApprovedEmail,
  sendPaymentDeniedEmail
};
