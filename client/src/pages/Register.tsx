import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import '../styles/legacy-login.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', registerNumber: '', email: '', password: '', department: '', year: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/student/register', form)
      localStorage.setItem('token', data.token)
      navigate('/profile')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h1>REGISTER</h1>
      <form className="form" onSubmit={submit}>
        {error && <div style={{ color: '#f66', textAlign: 'center', fontSize: 12 }}>{error}</div>}
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Enter your name" />
        </div>
        <div className="form-group">
          <label htmlFor="reg">Register Number:</label>
          <input id="reg" value={form.registerNumber} onChange={(e) => setForm({ ...form, registerNumber: e.target.value })} required placeholder="Enter your register number" />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="Enter your email" />
        </div>
        <div className="form-group">
          <label htmlFor="dept">Department:</label>
          <input id="dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required placeholder="Enter your department" />
        </div>
        <div className="form-group">
          <label htmlFor="year">Year:</label>
          <input id="year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required placeholder="Enter your year" />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Enter your password" />
        </div>
        <div className="form-group">
          <p>Have an account?<Link to="/login"> Login</Link></p>
        </div>
        <div className="glow-btn-container">
          <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </div>
      </form>
    </div>
  )
}


