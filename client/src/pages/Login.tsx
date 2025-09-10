import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import '../styles/legacy-login.css'

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
      // navigate first, then hard fallback to handle any SPA routing issues
      navigate('/profile', { replace: true })
      setTimeout(() => { if (location.pathname !== '/profile') location.href = '/profile' }, 150)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h1>LOGIN</h1>
      <form className="form" onSubmit={submit}>
        {error && <div style={{ color: '#f66', textAlign: 'center', fontSize: 12 }}>{error}</div>}
        <div className="form-group">
          <label htmlFor="regNo">Register Number:</label>
          <input id="regNo" name="regNo" placeholder="Enter your register number" required value={form.registerNumber} onChange={(e) => setForm({ ...form, registerNumber: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input id="password" name="password" type="password" placeholder="Enter your password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="form-group">
          <p>New here? <Link to="/register"> Create an account</Link></p>
        </div>
        <div className="form-group" style={{ textAlign: 'center', fontSize: 14 }}>
          <Link to="/admin/login">Admin Login</Link>
        </div>
        <div className="glow-btn-container">
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </div>
      </form>
    </div>
  )
}


