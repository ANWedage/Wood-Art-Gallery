# Email Functionality Setup Guide

## Overview
The Wood Art Gallery application now automatically sends welcome emails to users after successful registration. These emails contain their login credentials (email and password) for easy access.

## Features Implemented

### 1. Welcome Email on Registration
- **When**: Triggered immediately after a user successfully registers (Customer or Designer)
- **Content**: Professional email with user's credentials, role-specific information, and security recommendations
- **Recipients**: All new users (customers, designers, staff designers, etc.)

### 2. Email Content Includes
- Welcome message with user's name and role
- Login credentials (email and password)
- Security recommendations (change password after first login)
- Role-specific information about platform features
- Professional styling with Wood Art Gallery branding

## Setup Instructions

### Step 1: Configure Email Service
1. Open `backend/.env` file
2. Replace the placeholder email credentials:

```env
# Replace these with your actual Gmail credentials
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Step 2: Gmail Setup (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-step verification → App passwords
   - Generate a new app password for "Wood Art Gallery"
3. **Update .env file**:
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASSWORD`: The generated app password (not your regular password)

### Step 3: Alternative Email Services
You can use other email services by modifying `backend/utils/emailService.js`:

```javascript
// For Outlook/Hotmail
service: 'outlook'

// For Yahoo
service: 'yahoo'

// For custom SMTP
host: 'your-smtp-host.com',
port: 587,
secure: false,
```

## Current Status

### Mock Mode (Default)
- Currently running in **mock mode** (no actual emails sent)
- Credentials are logged to the backend console for testing
- Registration works perfectly, but emails are simulated

### Production Mode
- Configure real email credentials to enable actual email sending
- All functionality works the same, but real emails are sent

## Testing

### 1. Test Email Configuration
```bash
curl http://localhost:5000/api/test-email
```

### 2. Test Registration Flow
1. Visit the application at `http://localhost:5174`
2. Click "Register" 
3. Fill in the registration form
4. Submit the form
5. Check backend console for mock email output (or your inbox if configured)
6. Success message appears: "Registration successful! Please check your email for login credentials."

## File Structure

```
backend/
├── .env                          # Email configuration
├── utils/
│   └── emailService.js          # Email sending logic
├── server.js                    # Registration endpoint with email
└── package.json                 # Added nodemailer dependency

frontend/
└── wood-art/
    └── src/
        ├── components/Auth/
        │   ├── RegisterForm.jsx  # Updated with success message
        │   └── Auth.css         # Added success message styling
        └── context/
            └── AuthContext.jsx   # Updated to handle email confirmation
```

## Security Features

### 1. Password Security
- Passwords are hashed before storage (bcrypt)
- Original password is only sent via email once
- Users are encouraged to change password after first login

### 2. Email Security
- App passwords used instead of account passwords
- Email credentials stored in environment variables
- Graceful fallback to mock mode if not configured

### 3. Error Handling
- Registration doesn't fail if email sending fails
- Comprehensive error logging
- User-friendly error messages

## User Experience Flow

1. **User registers** → Fills registration form
2. **Form submission** → Validates data and creates account
3. **Email sent** → Welcome email with credentials dispatched
4. **Success message** → "Please check your email for login credentials"
5. **Form clears** → Auto-switches to login form after 3 seconds
6. **User receives email** → Professional welcome email with credentials
7. **User logs in** → Uses credentials from email

## Next Steps

1. **Configure Real Email Service** (when ready for production)
2. **Test with Real Email** to ensure delivery
3. **Customize Email Template** (optional - already professionally styled)
4. **Add Email Verification** (optional future enhancement)

## Support

The email system is fully functional and ready for production. Simply configure the email credentials in the `.env` file to enable real email sending.
