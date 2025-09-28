const nodemailer = require('nodemailer');

let sharedTransporter = null;

// Optional: HTTP email provider (Resend) to avoid SMTP timeouts on some hosts
async function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    // Use Resend's default sender for free tier (no domain verification needed)
    const from = process.env.RESEND_FROM || 'noreply@resend.dev';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html, text })
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(()=> '');
      console.error(`Resend API error ${res.status}: ${bodyText}`);
      throw new Error(`Resend API error ${res.status}: ${bodyText}`);
    }
    const data = await res.json();
    console.log('Resend email sent successfully:', data);
    return { provider: 'resend', id: data.id };
  } catch (err) {
    console.error('Resend send error:', err.message);
    return null;
  }
}

// Optional: SendGrid HTTP API to avoid SMTP timeouts on some hosts
async function sendViaSendGrid({ to, subject, html, text }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return null;
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'aurcc2026@gmail.com';
    console.log(`SendGrid HTTP API - From: ${from}, To: ${to}`);
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject: subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html }
        ]
      })
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(()=> '');
      console.error(`SendGrid API error ${res.status}: ${bodyText}`);
      throw new Error(`SendGrid API error ${res.status}: ${bodyText}`);
    }
    console.log('SendGrid email sent via HTTP API');
    return { provider: 'sendgrid-http', id: 'sent' };
  } catch (err) {
    console.error('SendGrid HTTP send error:', err.message);
    return null;
  }
}

function createTransport() {
  // Default Gmail configuration if env vars are not set
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || (process.env.NODE_ENV === 'production' ? 'false' : 'false')).toLowerCase() === 'true';
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '';

  console.log(`Email config - Host: ${host}, Port: ${port}, User: ${user}, Secure: ${secure}`);
  if (!user || !pass) {
    console.log('Env snapshot (email-related):', {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_SECURE: process.env.EMAIL_SECURE,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS_len: process.env.EMAIL_PASS ? String(process.env.EMAIL_PASS).length : 0,
      GMAIL_USER: process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD_len: process.env.GMAIL_APP_PASSWORD ? String(process.env.GMAIL_APP_PASSWORD).length : 0,
      NODE_ENV: process.env.NODE_ENV
    });
  }

  if (!host || !user || !pass) {
    console.warn('Email configuration incomplete: set EMAIL_HOST, EMAIL_USER, EMAIL_PASS for production. Using no-op transport in dev.');
  }

  // Connection pooling for faster subsequent sends
  return nodemailer.createTransport({ 
    host, 
    port, 
    secure, 
    auth: { user, pass },
    pool: true,
    maxConnections: Number(process.env.EMAIL_MAX_CONNECTIONS || 3),
    maxMessages: Number(process.env.EMAIL_MAX_MESSAGES || 50),
    // Conservative timeouts to fail fast instead of hanging
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 10000),
    // Gmail specific settings
    tls: { rejectUnauthorized: false }
  });
}

function getTransporter() {
  if (!sharedTransporter) {
    sharedTransporter = createTransport();
  }
  return sharedTransporter;
}

async function sendEmail({ to, subject, html, text }) {
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'aurcc2026@gmail.com';
    console.log(`Attempting to send email to: ${to}, from: ${from}, subject: ${subject}`);

    // Use Resend first (most reliable for cloud hosting)
    if (process.env.RESEND_API_KEY) {
      console.log('Email provider selected: Resend (HTTPS) - Most reliable for cloud');
    } else if (process.env.SENDGRID_API_KEY) {
      console.log('Email provider selected: SendGrid (HTTPS)');
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('Email provider selected: Gmail SMTP');
    }
    
    // Try Resend first (best for cloud hosting)
    const viaResend = await sendViaResend({ to, subject, html, text });
    if (viaResend) {
      return { messageId: viaResend.id, accepted: [to], rejected: [] };
    }
    
    // Fallback to SendGrid if Resend fails
    const viaSendGrid = await sendViaSendGrid({ to, subject, html, text });
    if (viaSendGrid) {
      return { messageId: viaSendGrid.id, accepted: [to], rejected: [] };
    }

    // Last resort: Gmail SMTP (may timeout on cloud hosting)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('HTTP providers failed, trying Gmail SMTP (may timeout on cloud)...');
    } else {
      console.log('No email providers available');
    }

    const transporter = getTransporter();

    // Optional verify (disabled by default for speed)
    const shouldVerify = String(process.env.EMAIL_VERIFY || 'false').toLowerCase() === 'true';
    if (shouldVerify) {
      await transporter.verify();
      console.log('Email server connection verified successfully');
    }

    // Enhanced email headers to avoid spam
    const mailOptions = {
      from: `"Placement App" <${from}>`,
      to,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'Placement App v1.0',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'X-Report-Abuse': 'Please report abuse to support@placementapp.com',
        'List-Unsubscribe': '<mailto:unsubscribe@placementapp.com>',
        'Return-Path': from,
        'Reply-To': from,
        'X-Entity-Ref-ID': Date.now().toString(),
        'X-Auto-Response-Suppress': 'All',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully. MessageId: ${info.messageId}, Accepted: ${info.accepted}, Rejected: ${info.rejected}`);
    return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
  } catch (error) {
    console.error('Email send error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command
    });
    const friendly = new Error('Email sending failed');
    friendly.code = 'EMAIL_SEND_FAILED';
    throw friendly;
  }
}

async function sendOtpEmail(to, code, purpose = 'Verification Code') {
  const subject = `Your ${purpose} - ${code}`;
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${purpose}</title>
    <meta name="description" content="Your verification code for Placement App">
    <meta name="robots" content="noindex, nofollow">
  </head>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif">
    <div style="max-width:600px;margin:0 auto;background-color:#ffffff">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px 20px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600">Placement App</h1>
        <p style="color:#e2e8f0;margin:10px 0 0 0;font-size:16px">Student Registration Portal</p>
      </div>
      
      <!-- Content -->
      <div style="padding:40px 30px">
        <h2 style="color:#1f2937;margin:0 0 20px 0;font-size:20px;text-align:center">${purpose}</h2>
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 30px 0;text-align:center">
          Please use the following verification code to complete your registration:
        </p>
        
        <!-- OTP Code -->
        <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:30px;text-align:center;margin:30px 0">
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1f2937;font-family:'Courier New',monospace">${code}</div>
        </div>
        
        <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:15px;margin:20px 0">
          <p style="color:#92400e;margin:0;font-size:14px;text-align:center">
            <strong>⏰ This code expires in 5 minutes</strong>
          </p>
        </div>
        
        <div style="background:#e0f2fe;border:1px solid #0ea5e9;border-radius:8px;padding:15px;margin:20px 0">
          <p style="color:#0c4a6e;margin:0;font-size:14px;text-align:center">
            <strong>📧 Email Delivery:</strong> If you don't see this email in your inbox, please check your <strong>spam/junk folder</strong> and mark it as "Not Spam" to receive future emails.
          </p>
        </div>
        
        <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:30px 0 0 0;text-align:center">
          If you did not request this code, please ignore this email.<br>
          For security reasons, do not share this code with anyone.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px;margin:0">
          This is an automated message from Placement App. Please do not reply to this email.
        </p>
        <p style="color:#9ca3af;font-size:12px;margin:5px 0 0 0">
          Placement App - Student Registration Portal
        </p>
      </div>
    </div>
  </body>
  </html>`;
  
  const text = `Your ${purpose} is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this code, please ignore this email.\n\nFor security reasons, do not share this code with anyone.\n\nPlacement App - Student Registration Portal`;
  return sendEmail({ to, subject, html, text });
}

module.exports = { sendEmail, sendOtpEmail };


