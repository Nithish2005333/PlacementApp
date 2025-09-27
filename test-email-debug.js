const { sendOtpEmail } = require('./server/lib/email');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('Environment variables:');
  console.log('- SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET');
  console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
  
  try {
    const result = await sendOtpEmail('freefire2005333@gmail.com', '123456', 'Test OTP');
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
