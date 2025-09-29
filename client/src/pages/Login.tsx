import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import '../styles/legacy-login.css'
import Footer from '../components/Footer'
import PasswordInput from '../components/PasswordInput'
import ErrorPopup from '../components/ErrorPopup'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ registerNumber: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [regNumberError, setRegNumberError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setShowErrorPopup(false)
    setRegNumberError(false)
    setPasswordError(false)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/student/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', 'student')
      navigate('/profile', { replace: true })
    } catch (err: any) {
      const status = err?.response?.status
      const msg = err?.response?.data?.error
      let errorMessage = ''
      if (status === 403) {
        errorMessage = 'Registration pending approval. You will be notified by email once approved.'
        setRegNumberError(true)
      } else if (msg === 'Invalid username') {
        errorMessage = 'Register number not found'
        setRegNumberError(true)
      } else if (msg === 'Incorrect password') {
        errorMessage = 'Incorrect password'
        setPasswordError(true)
      } else {
        errorMessage = msg || 'Login failed'
        setRegNumberError(true)
        setPasswordError(true)
      }
      setError(errorMessage)
      setShowErrorPopup(true)
    } finally {
      setLoading(false)
    }
  }

  const linkBase: React.CSSProperties = { color: '#a78bfa', fontWeight: 700, textDecoration: 'none', textUnderlineOffset: 2, transition: 'color .15s ease, text-decoration-color .15s ease' } as any
  const hoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#c084fc'; el.style.textDecoration = 'underline' }
  const unhoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#a78bfa'; el.style.textDecoration = 'none' }

  return (
    <div className="min-h-screen flex flex-col">
      <button
        onClick={() => navigate('/')}
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
            <div className="brand-subtitle">Welcome back</div>
          </div>
          <h1>LOGIN</h1>
          <form className="form" onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="regNo">Register Number:</label>
              <input 
                id="regNo" 
                name="regNo" 
                placeholder="Enter your register number" 
                required 
                inputMode="numeric"
                pattern="^[0-9]{12}$"
                minLength={12}
                maxLength={12}
                title="Enter exactly 12 digits"
                value={form.registerNumber} 
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 12)
                  setForm({ ...form, registerNumber: digitsOnly })
                  // Clear error when user starts typing
                  if (regNumberError) setRegNumberError(false)
                }}
                className={regNumberError ? 'error' : ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <PasswordInput
                id="password"
                name="password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value })
                  // Clear error when user starts typing
                  if (passwordError) setPasswordError(false)
                }}
                placeholder="Enter your password"
                required
                hasError={passwordError}
              />
            </div>
            <div className="form-group">
              <p>New here? <Link to="/register" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Create an account</Link></p>
              <p style={{ marginTop: '8px' }}>
                <Link to="/forgot-password" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Forgot Password?</Link>
              </p>
              {/* <p style={{ marginTop: '8px' }}>
                <Link to="/admin/login" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Admin Login</Link>
              </p> */}
            </div>
            
            <div className="glow-btn-container">
              <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
      <ErrorPopup 
        show={showErrorPopup} 
        onClose={() => setShowErrorPopup(false)} 
        message={error || ''} 
      />
    </div>
  )
}


