import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import '../styles/register.css'
import Footer from '../components/Footer'

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
      await api.post('/auth/student/register', form)
      // After successful registration, redirect to login page
      navigate('/login', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Auth link hover behavior (purple scheme to match other pages)
  const linkBase: React.CSSProperties = { color: '#a78bfa', fontWeight: 700, textDecoration: 'none', textUnderlineOffset: 2, transition: 'color .15s ease, text-decoration-color .15s ease' } as any
  const hoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#c084fc'; el.style.textDecoration = 'underline' }
  const unhoverLink = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget as HTMLElement; el.style.color = '#a78bfa'; el.style.textDecoration = 'none' }

  return (
    <>
      <div className="register-page">
        <div className="form-container">
        <div className="brand-title">Placement App</div>
        <div className="brand-subtitle">Create your student account</div>
        
        <h1>REGISTER</h1>
        <form className="form" onSubmit={submit}>
          {error && <div style={{ color: '#f66', textAlign: 'center', fontSize: 12 }}>{error}</div>}
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Enter your name" />
          </div>
          <div className="form-group">
            <label htmlFor="reg">Register Number:</label>
            <input
              id="reg"
              inputMode="numeric"
              pattern="^[0-9]{12}$"
              minLength={12}
              maxLength={12}
              value={form.registerNumber}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 12)
                setForm({ ...form, registerNumber: digitsOnly })
              }}
              required
              title="Enter exactly 12 digits"
              placeholder="Enter 12 digit register number"
            />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Only numbers, exactly 12 digits</div>
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
              <option value="Final">Final Year</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Enter your password" />
          </div>
          <div className="form-group">
            <p>Have an account?
              <Link to="/login" style={{ ...linkBase, marginLeft: 6 }} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Login</Link>
            </p>
            <p style={{ textAlign: 'center', fontSize: 14, marginTop: 4 }}>
              <Link to="/admin/login" style={linkBase} onMouseEnter={hoverLink} onMouseLeave={unhoverLink}>Admin Login</Link>
            </p>
          </div>
          <div className="glow-btn-container">
            <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </div>
        </form>
        </div>
      </div>
      <Footer />
    </>
  )
}


