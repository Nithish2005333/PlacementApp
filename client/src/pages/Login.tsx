import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import '../styles/legacy-login.css'
import Footer from '../components/Footer'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ registerNumber: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/student/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', 'student')
      navigate('/profile', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const linkBase: React.CSSProperties = { color: '#a78bfa', fontWeight: 700, textDecoration: 'none', textUnderlineOffset: 2, transition: 'color .15s ease, text-decoration-color .15s ease' } as any
  const hoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#c084fc'; el.style.textDecoration = 'underline' }
  const unhoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#a78bfa'; el.style.textDecoration = 'none' }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="form-container" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', margin: '4px 0 6px' }}>
            <div className="brand-title">Placement App</div>
            <div className="brand-subtitle">Welcome back</div>
          </div>
          <h1>LOGIN</h1>
          <form className="form" onSubmit={submit}>
            {error && <div style={{ color: '#f66', textAlign: 'center', fontSize: 12 }}>{error}</div>}
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
                }} 
              />
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
            <div className="form-group">
              <p>New here? <Link to="/register" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Create an account</Link></p>
            </div>
            <div className="form-group" style={{ textAlign: 'center', fontSize: 14 }}>
              <Link to="/admin/login" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Admin Login</Link>
            </div>
            <div className="glow-btn-container">
              <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}


