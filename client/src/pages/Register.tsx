import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import '../styles/register.css'
import { useEffect } from 'react'
import { departmentsStore } from '../lib/departments'
import Footer from '../components/Footer'
import RegistrationSuccessPopup from '../components/RegistrationSuccessPopup'
import PasswordInput from '../components/PasswordInput'
import OTPInput from '../components/OTPInput'
import ErrorPopup from '../components/ErrorPopup'
import EmailSpamPopup from '../components/EmailSpamPopup'

export default function Register() {
  const navigate = useNavigate()
  const [deptOptions, setDeptOptions] = useState<Array<{ name: string; fullName: string }>>([])
  const [form, setForm] = useState({ name: '', registerNumber: '7100', email: '', phone: '', password: '', confirmPassword: '', department: '', year: '', otp: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null)
  
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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [showEmailSpamPopup, setShowEmailSpamPopup] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState<number>(0)
  const [otpError, setOtpError] = useState(false)
  const [hasFormError, setHasFormError] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPasswordError(null)
    setShowErrorPopup(false)
    setHasFormError(false)
    
    // Validate password
    const passwordValidationError = validatePassword(form.password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      setHasFormError(true)
      return
    }
    
    // Check if passwords match
    if (form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match')
      setHasFormError(true)
      return
    }
    
    if (!otpSent || !form.otp) {
      setError('Please verify your email via OTP')
      setShowErrorPopup(true)
      setHasFormError(true)
      return
    }

    // Verify OTP first (email)
    try {
      await api.post('/auth/otp/verify', { email: form.email, purpose: 'register', code: form.otp })
      setOtpError(false) // Clear any previous OTP errors
    } catch (err:any) {
      setError(err?.response?.data?.error || 'OTP verification failed')
      setOtpError(true)
      setShowErrorPopup(true)
      return
    }

    setLoading(true)
    try {
      // Remove confirmPassword from the data sent to server
      const { confirmPassword, ...registerData } = form
      await api.post('/auth/student/register', registerData)
      // Show success popup
      setShowSuccessPopup(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
      setShowErrorPopup(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cached = departmentsStore.getCached()
    if (cached) setDeptOptions(cached)
    const unsub = departmentsStore.subscribe((depts) => { setDeptOptions(depts) })
    departmentsStore.refresh()
    const onVis = () => { if (document.visibilityState === 'visible') departmentsStore.refresh() }
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); unsub(); }
  }, [])

  // Hard fallback: also fetch directly once to guarantee options, independent of store
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/public/departments')
        if (Array.isArray(data) && data.length > 0) setDeptOptions(data)
      } catch {}
    })()
  }, [])

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false)
    navigate('/login', { replace: true })
  }

  // Auth link hover behavior (purple scheme to match other pages)
  const linkBase: React.CSSProperties = { color: '#a78bfa', fontWeight: 700, textDecoration: 'none', textUnderlineOffset: 2, transition: 'color .15s ease, text-decoration-color .15s ease' } as any
  const hoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#c084fc'; el.style.textDecoration = 'underline' }
  const unhoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#a78bfa'; el.style.textDecoration = 'none' }

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="register-page">
            <div className="form-container" style={{ position: 'relative' }}>
            <div className="brand-title">Placement App</div>
            <div className="brand-subtitle">Create your student account</div>
        
        <h1>REGISTER</h1>
        <form className="form" onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Enter your name" />
          </div>
          
          <div className="form-group">
            <label htmlFor="reg">Register Number:</label>
            <input
              id="reg"
              inputMode="numeric"
              pattern="^7100[0-9]{8}$"
              minLength={12}
              maxLength={12}
              value={form.registerNumber}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '')
                // Always enforce 7100 prefix and allow only 8 more digits
                const suffix = digitsOnly.replace(/^7100?/, '').slice(0, 8)
                const next = `7100${suffix}`.slice(0, 12)
                setForm({ ...form, registerNumber: next })
              }}
              onKeyDown={(e) => {
                const el = e.currentTarget as HTMLInputElement
                const pos = el.selectionStart ?? 0
                if ((e.key === 'Backspace' || e.key === 'Delete') && pos <= 4) {
                  e.preventDefault()
                }
              }}
              onFocus={(e) => {
                if (!form.registerNumber || !form.registerNumber.startsWith('7100')) {
                  setForm({ ...form, registerNumber: '7100' })
                }
              }}
              required
              title="Must start with 7100 and be exactly 12 digits"
              placeholder="7100XXXXXXXX (12 digits)"
            />
            
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Mobile Number:</label>
            <input 
              id="phone" 
              type="tel"
              inputMode="numeric"
              pattern="^[0-9]{10}$"
              maxLength={10}
              value={form.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                setForm({ ...form, phone: digits })
              }} 
              placeholder="Enter 10-digit mobile number" 
              title="Enter exactly 10 digits"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dept">Department:</label>
            <select 
              id="dept"
              value={form.department} 
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              required
            >
              <option value="">Select Department</option>
              {deptOptions.map(d => (
                <option key={d.name} value={d.name}>{d.fullName || d.name} ({d.name})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="year">Year:</label>
            <select 
              id="year"
              value={form.year} 
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              required
            >
              <option value="">Select Year</option>
              <option value="First">First Year</option>
              <option value="Second">Second Year</option>
              <option value="Third">Third Year</option>
              <option value="Final">Final Year</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="emailOtp">Email Verification</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="emailOtp" readOnly value={form.email} placeholder="Enter your email above" />
              <button
                type="button"
                disabled={otpSending || !form.email || resendCooldown > 0}
                onClick={async ()=>{
                  setError(null)
                  setOtpSending(true)
                  try {
                    await api.post('/auth/otp/send', { email: form.email, purpose: 'register' })
                    setOtpSent(true)
                    setResendCooldown(60)
                    setShowEmailSpamPopup(true)
                    const interval = setInterval(()=>{
                      setResendCooldown((s)=>{
                        if (s <= 1) { clearInterval(interval); return 0 }
                        return s - 1
                      })
                    }, 1000)
                  } catch (e:any) {
                    setError(e?.response?.data?.error || 'Failed to send OTP')
                    setShowErrorPopup(true)
                  } finally {
                    setOtpSending(false)
                  }
                }}
                style={{
                  padding: '1px 3px',
                  borderRadius: 10,
                  border: '1px solid #7c3aed',
                  backgroundColor: '#6d28d9',
                  color: '#fff',
                  cursor: (otpSending || !form.email || resendCooldown>0) ? 'not-allowed' : 'pointer',
                  opacity: (otpSending || !form.email || resendCooldown>0) ? 0.6 : 1,
                }}
                onMouseEnter={(e)=>{ if(!(otpSending||!form.email||resendCooldown>0)) e.currentTarget.style.backgroundColor='#9a5ff5' }}
                onMouseLeave={(e)=>{ if(!(otpSending||!form.email||resendCooldown>0)) e.currentTarget.style.backgroundColor='#5b21b6' }}
              >{otpSending ? 'Sending...' : (otpSent ? (resendCooldown>0 ? `Resend in ${resendCooldown}s` : 'Resend OTP') : 'Send OTP')}</button>
            </div>
            {otpSent && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                {resendCooldown>0 ? 'You can resend OTP after 1 minute.' : 'You can resend OTP now.'}
              </div>
            )}
          </div>
          {otpSent && (
            <div className="form-group">
              <label>OTP:</label>
              <OTPInput 
                value={form.otp} 
                onChange={(next)=> setForm({ ...form, otp: next.replace(/\s/g,'') })} 
                hasError={otpError}
                onError={setOtpError}
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(e) => {
                const password = e.target.value
                setForm({ ...form, password })
                
                // Validate password
                const validationError = validatePassword(password)
                setPasswordError(validationError)
                
                // Clear form error when user starts typing
                if (hasFormError) setHasFormError(false)
                
                // Real-time password matching validation
                if (form.confirmPassword && password) {
                  setPasswordMatch(form.confirmPassword === password)
                } else {
                  setPasswordMatch(null)
                }
              }}
              required
              placeholder="Enter your password"
              hasError={hasFormError && !!passwordError}
            />
            {passwordError && <div style={{ color: '#f66', fontSize: 12, marginTop: 4 }}>{passwordError}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <PasswordInput
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={(e) => {
                const confirmPassword = e.target.value
                setForm({ ...form, confirmPassword })
                // Clear password error when user starts typing
                if (passwordError) setPasswordError(null)
                if (hasFormError) setHasFormError(false)
                
                // Real-time password matching validation
                if (confirmPassword && form.password) {
                  setPasswordMatch(confirmPassword === form.password)
                } else {
                  setPasswordMatch(null)
                }
              }}
              required
              placeholder="Confirm your password"
              hasError={hasFormError && passwordMatch === false}
            />
            {passwordError && <div style={{ color: '#f66', fontSize: 12, marginTop: 4 }}>{passwordError}</div>}
            {passwordMatch !== null && form.confirmPassword && (
              <div style={{ 
                color: passwordMatch ? '#10b981' : '#f66', 
                fontSize: 12, 
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {passwordMatch ? '✓' : '✗'} 
                {passwordMatch ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>
          <div className="form-group">
            <p>Have an account?
              <Link to="/login" style={{ ...linkBase, marginLeft: 6 }} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Login</Link>
            </p>
          </div>
          <div className="glow-btn-container">
            <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </div>
        </form>
            </div>
          </div>
        </div>
        <Footer />
        <RegistrationSuccessPopup show={showSuccessPopup} onClose={handleCloseSuccessPopup} message="Registration submitted. Pending approval. You'll be notified once approved." />
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
    </>
  )
}


