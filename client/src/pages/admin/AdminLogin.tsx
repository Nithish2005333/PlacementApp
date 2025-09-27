import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../lib/api'
import '../../styles/legacy-login.css'
import Footer from '../../components/Footer'
import PasswordInput from '../../components/PasswordInput'
import ErrorPopup from '../../components/ErrorPopup'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setShowErrorPopup(false)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/admin/login', form)
      localStorage.setItem('token', data.token)
      if (data?.admin?.role) localStorage.setItem('role', data.admin.role)
      if (data?.admin?.department) localStorage.setItem('admin_department', data.admin.department)
      if (data?.admin?.year) localStorage.setItem('admin_year', data.admin.year)

      // Role-based redirects
      const role = data?.admin?.role
      const dept = data?.admin?.department
      const yr = data?.admin?.year
      if (role === 'rep' && dept && yr) {
        navigate(`/admin/students?department=${encodeURIComponent(dept)}&year=${encodeURIComponent(yr)}`, { replace: true })
        return
      }
      if (role === 'staff' && dept) {
        navigate(`/admin/departments?department=${encodeURIComponent(dept)}`, { replace: true })
        return
      }
      // Main admin default
      navigate('/admin/departments', { replace: true })
    } catch (e: any) {
      const msg = e.response?.data?.error
      let errorMessage = 'Login failed'
      if (msg === 'Invalid username') errorMessage = 'Username not found'
      else if (msg === 'Incorrect password') errorMessage = 'Incorrect password'
      else if (typeof msg === 'string') errorMessage = msg
      setError(errorMessage)
      setShowErrorPopup(true)
    } finally { setLoading(false) }
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
          <div style={{ textAlign: 'center', margin: '8px 0 12px' }}>
            <div className="brand-title">Placement App</div>
            <div className="brand-subtitle">Admin access</div>
          </div>
          <h1>LOGIN</h1>
          <form className="form" onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input id="username" name="username" placeholder="Enter admin username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <PasswordInput
                id="password"
                name="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="glow-btn-container">
              <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            </div>
            <div className="form-group" style={{ textAlign: 'center', fontSize: 14 }}>
              <Link to="/login" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Student Login</Link>
              <p style={{ marginTop: 8 }}>
                <Link to="/forgot-password" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Forgot Password</Link>
              </p>
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


