import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import OTPInput from '../components/OTPInput';
import PasswordInput from '../components/PasswordInput';
import Footer from '../components/Footer';
import ErrorPopup from '../components/ErrorPopup';
import EmailSpamPopup from '../components/EmailSpamPopup';
import '../styles/legacy-login.css';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp' | 'reset'>('phone');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  // current password not required in forgot flow
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [showEmailSpamPopup, setShowEmailSpamPopup] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  
  // Password validation function
  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least one special character'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/student/forgot-password', { email });
      if (response.data.ok) {
        setOtpSent(true);
        setStep('otp');
        setSuccess('OTP sent to your email');
        setShowEmailSpamPopup(true);
        // start resend cooldown (60s)
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((s) => {
            if (s <= 1) { clearInterval(interval); return 0; }
            return s - 1;
          })
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to send OTP';
      if (errorMessage.includes('No registered student found')) {
        setError('No account found with this email address. Please check your email or contact support.');
      } else {
        setError(errorMessage);
      }
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email || resendCooldown > 0) return;
    setOtpSending(true);
    setError('');
    try {
      const response = await api.post('/auth/student/forgot-password', { email });
      if (response.data.ok) {
        setSuccess('OTP resent to your email');
        setShowEmailSpamPopup(true);
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((s) => {
            if (s <= 1) { clearInterval(interval); return 0; }
            return s - 1;
          })
        }, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
      setShowErrorPopup(true);
    } finally {
      setOtpSending(false);
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setShowErrorPopup(true);
      return;
    }

    setOtpVerifying(true);
    setError('');
    try {
      const response = await api.post('/auth/student/verify-forgot-otp', { 
        email,
        code: otp 
      });
      if (response.data.valid) {
        setOtpVerified(true);
        setStep('reset');
        setSuccess('OTP verified successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
      setShowErrorPopup(true);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      setShowErrorPopup(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      setShowErrorPopup(true);
      return;
    }
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setError(passwordValidationError);
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/student/reset-password', {
        email,
        newPassword,
        confirmPassword
      });
      if (response.data.success) {
        setSuccess('Password updated successfully! You can now login with your new password.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const linkBase: React.CSSProperties = { color: '#a78bfa', fontWeight: 700, textDecoration: 'none', textUnderlineOffset: 2, transition: 'color .15s ease, text-decoration-color .15s ease' } as any
  const hoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#c084fc'; el.style.textDecoration = 'underline' }
  const unhoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#a78bfa'; el.style.textDecoration = 'none' }

  return (
    <div className="min-h-screen flex flex-col">
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="fixed top-2 left-2 z-50 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white shadow-md backdrop-blur"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="flex-1 flex items-center justify-center">
        <div className="form-container" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', margin: '4px 0 6px' }}>
            <div className="brand-title">Placement App</div>
            <div className="brand-subtitle">Secure password reset</div>
          </div>
          <h1>RESET PASSWORD</h1>

          {success && <div style={{ color: '#16a34a', textAlign: 'center', fontSize: 12, marginBottom: 8 }}>{success}</div>}

          {step === 'phone' && (
            <form className="form" onSubmit={handlePhoneSubmit}>
              <div className="form-group">
              <label htmlFor="phone">Registered Email:</label>
              <input 
                id="phone" 
                name="email" 
                placeholder="Enter your registered email" 
                required 
                type="email"
                value={email} 
                onChange={handlePhoneChange} 
              />
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                Enter the email address you used during registration
              </div>
              </div>

              <div className="glow-btn-container">
                <button type="submit" disabled={loading || !email}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form className="form" onSubmit={handleOTPSubmit}>
              <div className="form-group">
                <label>Enter OTP:</label>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    length={6}
                    containerClassName="otp-fp-container"
                    cellClassName="otp-fp-cell"
                  />
                </div>
              </div>

              <div className="glow-btn-container" style={{ marginTop: 8 }}>
                <button type="submit" disabled={otpVerifying || otp.length !== 6}>{otpVerifying ? 'Verifying...' : 'Verify OTP'}</button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 10, display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  style={linkBase}
                  onMouseEnter={hoverLink}
                  onMouseLeave={unhoverLink}
                  className="text-button"
                >Back to email</button>
                <span style={{ color: '#9ca3af' }}>|</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || otpSending}
                  style={{ ...linkBase, opacity: (resendCooldown > 0 || otpSending) ? 0.6 : 1 }}
                  onMouseEnter={hoverLink}
                  onMouseLeave={unhoverLink}
                  className="text-button"
                  title={resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend OTP'}
                >
                  {otpSending ? 'Resending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form className="form" onSubmit={handlePasswordReset}>
              {/* Current password removed for OTP-based reset */}

              <div className="form-group">
                <label htmlFor="newPassword">New Password:</label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onValueChange={setNewPassword}
                  placeholder="Enter your new password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password:</label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  placeholder="Confirm your new password"
                  required
                />
                {confirmPassword && (
                  <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600, color: newPassword && confirmPassword && newPassword === confirmPassword ? '#22c55e' : '#ef4444' }}>
                    {newPassword && confirmPassword && newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <div className="glow-btn-container">
                <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  style={linkBase}
                  onMouseEnter={hoverLink}
                  onMouseLeave={unhoverLink}
                >Back to OTP</button>
              </div>
            </form>
          )}

          <div className="form-group" style={{ textAlign: 'center' }}>
            <p>
              <Link to="/login" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
      <ErrorPopup 
        show={showErrorPopup} 
        onClose={() => setShowErrorPopup(false)} 
        message={error || ''} 
      />
      <EmailSpamPopup 
        show={showEmailSpamPopup} 
        onClose={() => setShowEmailSpamPopup(false)} 
        type="otp"
      />
    </div>
  );
};

export default ForgotPassword;
