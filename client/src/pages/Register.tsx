import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
// Use a dedicated stylesheet so body centering from legacy login doesn't affect Register
import '../styles/register.css'

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
    <div className="register-page">
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
          <select 
            id="dept"
            value={form.department} 
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            required
          >
            <option value="">Select Department</option>
            <option value="CSE">Computer Science & Engineering (CSE)</option>
            <option value="AI&DS">Artificial Intelligence & Data Science (AI&DS)</option>
            <option value="Mech">Mechanical Engineering (Mech)</option>
            <option value="ECE">Electronics & Communication Engineering (ECE)</option>
            <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
            <option value="VLSI">VLSI Design (VLSI)</option>
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
            <option value="Fourth">Fourth Year</option>
          </select>
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
    </div>
  )
}


