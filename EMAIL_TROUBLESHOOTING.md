# Email Troubleshooting Guide

## ✅ Current Status
Your email service is now **WORKING CORRECTLY**! The server logs show:
- Email service is configured properly
- Welcome emails are being sent successfully
- No errors in the email sending process

## 🔍 Why You Might Not Receive Emails

### 1. **Check Spam/Junk Folder**
   - Gmail, Yahoo, Outlook often filter automated emails
   - Look in **Spam**, **Junk**, or **Promotions** folder
   - Mark emails from `slwoodartgallery@gmail.com` as "Not Spam"

### 2. **Email Delivery Delay**
   - Sometimes emails take 1-5 minutes to arrive
   - Gmail's servers may have slight delays
   - Wait a few minutes and refresh your inbox

### 3. **Firewall/Network Issues**
   - Some networks block outgoing SMTP traffic
   - Try registering from a different network (mobile hotspot)
   - Check if your ISP blocks port 587/465

### 4. **Gmail Security Settings**
   - Your Gmail account might have additional security restrictions
   - Try enabling "Less secure app access" (not recommended for production)
   - Or regenerate the App Password

## 🧪 Testing Steps

### Test 1: Register with Your Own Email
```
1. Go to http://localhost:5174
2. Click "Register"
3. Use your personal email address
4. Complete registration
5. Check inbox AND spam folder
```

### Test 2: Check Server Logs
The backend should show:
```
Welcome email sent successfully to [email]
Email sending result: { success: true, message: 'Welcome email sent successfully' }
```

### Test 3: Test Different Email Providers
Try registering with:
- Gmail account
- Yahoo account  
- Outlook/Hotmail account
- Work/school email

## 🔧 Quick Fixes

### Fix 1: Regenerate App Password
1. Go to Google Account → Security → App Passwords
2. Delete the old "Wood Art Gallery" app password
3. Generate a new one
4. Update `.env` file with new password (no spaces)
5. Restart server

### Fix 2: Check Email Format
Your `.env` should look exactly like this:
```env
EMAIL_USER=slwoodartgallery@gmail.com
EMAIL_PASSWORD=ctexsjsqiioayqhm
```
- No quotes around values
- No spaces in password
- Exact Gmail address

### Fix 3: Enable Gmail IMAP
1. Go to Gmail Settings → Forwarding and POP/IMAP
2. Enable IMAP access
3. Save changes

## 📧 Email Template Preview
Users should receive an email like this:

**Subject:** Welcome to Wood Art Gallery - Your Account Details

**From:** slwoodartgallery@gmail.com

**Content:** Professional welcome email with:
- User's name and role
- Login credentials (email and password)
- Security recommendations
- Role-specific information

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Email not configured" error | Remove spaces from app password in `.env` |
| Server won't start | Fix `createTransport` (not `createTransporter`) |
| 535 Authentication error | Regenerate Gmail app password |
| Connection timeout | Check network/firewall settings |
| Emails in spam | Mark sender as safe, check spam folder |

## ✨ Verification Commands

Run these to verify everything is working:

```bash
# Test email service
curl http://localhost:5000/api/test-email

# Should return: {"success":true,"message":"Email service is configured correctly"}
```

```bash
# Test registration
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","address":"123 Test","phone":"1234567890","email":"your-email@gmail.com","password":"Test@123","role":"customer"}'
```

## 🎯 Final Recommendation

**Your email system IS working!** The most likely reason you're not seeing emails is:

1. **Check Spam Folder** - This is the #1 reason
2. **Wait 2-3 minutes** - Email delivery can be delayed
3. **Try a different email address** - Some providers are stricter

The server logs confirm emails are being sent successfully. The issue is likely on the receiving end, not the sending end.

## 📞 If Still Not Working

1. Try registering with a different email provider
2. Check with your email provider about blocked automated emails
3. Consider using a dedicated email service like SendGrid for production
4. Test with a temporary email service to verify sending works

Your implementation is solid and working correctly! 🎉
