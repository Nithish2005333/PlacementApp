import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../lib/api'
import '../../styles/legacy-login.css'

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
      navigate('/admin/dashboard', { replace: true })
    } catch (e: any) {
      setError(e.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="form-container">
      <h1>LOGIN</h1>
      <form className="form" onSubmit={submit}>
        {error && <div style={{ color: '#f66', textAlign: 'center', fontSize: 12 }}>{error}</div>}
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input id="username" name="username" placeholder="Enter admin username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input id="password" name="password" type="password" placeholder="Enter your password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="glow-btn-container">
          <button type="submit">Login</button>
        </div>
        <div className="form-group" style={{ textAlign: 'center', fontSize: 14 }}>
          <Link to="/login">Student Login</Link>
        </div>
      </form>
    </div>
  )
}


