import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../lib/api'
import '../../styles/legacy-login.css'
import Footer from '../../components/Footer'
import PasswordInput from '../../components/PasswordInput'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const { data } = await api.post('/auth/admin/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', 'admin')
      navigate('/admin/departments', { replace: true })
    } catch (e: any) {
      setError(e.response?.data?.error || 'Login failed')
    }
  }

  const linkBase: React.CSSProperties = { color: '#a78bfa', fontWeight: 700, textDecoration: 'none', textUnderlineOffset: 2, transition: 'color .15s ease, text-decoration-color .15s ease' } as any
  const hoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#c084fc'; el.style.textDecoration = 'underline' }
  const unhoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#a78bfa'; el.style.textDecoration = 'none' }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="form-container" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', margin: '8px 0 12px' }}>
            <div className="brand-title">Placement App</div>
            <div className="brand-subtitle">Admin access</div>
          </div>
          <h1>LOGIN</h1>
          <form className="form" onSubmit={submit}>
            {error && <div style={{ color: '#f66', textAlign: 'center', fontSize: 12 }}>{error}</div>}
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
              <button type="submit">Login</button>
            </div>
            <div className="form-group" style={{ textAlign: 'center', fontSize: 14 }}>
              <Link to="/login" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Student Login</Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}


