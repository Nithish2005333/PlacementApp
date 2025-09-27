# Email OTP Setup Guide

## Current Issue
The email OTP system is not working because the Gmail account requires an **App Password** due to 2-Factor Authentication being enabled.

## Root Cause Identified
The test revealed: `534-5.7.9 Application-specific password required`

This means the Gmail account `aurcc2026@gmail.com` has 2FA enabled and requires an App Password instead of the regular password.

## Quick Fix Applied
I've updated the email configuration to use default Gmail settings with the credentials from your `notes.txt` file:
- Email: `aurcc2026@gmail.com`
- Password: `AnnaUniversity#1` (needs to be replaced with App Password)
- SMTP: `smtp.gmail.com:587`

## Testing the Fix

### Option 1: Test Email Configuration
Run the test script to verify email setup:
```bash
node test-email.js
```

### Option 2: Test OTP Endpoint
Send a POST request to test OTP generation:
```bash
curl -X POST http://localhost:10000/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","purpose":"register"}'
```

## SOLUTION: Generate Gmail App Password

### Step-by-Step Instructions

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/
   - Sign in with `aurcc2026@gmail.com`

2. **Navigate to Security**
   - Click on "Security" in the left sidebar

3. **Enable 2-Step Verification** (if not already enabled)
   - Click "2-Step Verification"
   - Follow the setup process

4. **Generate App Password**
   - In Security section, find "App passwords"
   - Click "App passwords"
   - Select "Mail" as the app
   - Select "Other" as the device
   - Enter "Placement App" as the device name
   - Click "Generate"

5. **Copy the Generated Password**
   - Google will show a 16-character password like: `abcd efgh ijkl mnop`
   - Copy this password (remove spaces)

6. **Update the Application**
   - Replace `AnnaUniversity#1` with the new App Password in the code
   - Or set it as an environment variable: `EMAIL_PASS=your_app_password_here`

### Alternative: Disable 2FA (Not Recommended)
1. Go to Google Account → Security
2. Turn OFF "2-Step Verification"
3. Enable "Less secure app access"
4. Use the original password `AnnaUniversity#1`

### 2. Connection Issues
- Ensure port 587 is not blocked by firewall
- Check if your network allows SMTP connections

## Environment Variables (Optional)
Create a `.env` file in the project root with:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=aurcc2026@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=aurcc2026@gmail.com
```

## Production Recommendations
1. Use environment variables instead of hardcoded credentials
2. Use app passwords instead of regular passwords
3. Consider using a dedicated email service (SendGrid, Mailgun, etc.)
4. Implement rate limiting for OTP requests
5. Add email templates for better user experience

## Debugging
Check server logs for detailed error messages. The updated code now provides:
- Connection verification before sending
- Detailed error logging
- Better error responses to clients

## Next Steps
1. Test the email configuration
2. Verify OTP emails are being received
3. Test the complete registration flow
4. Consider implementing email templates for better UX
