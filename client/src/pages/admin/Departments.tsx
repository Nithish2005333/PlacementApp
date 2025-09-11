import { Link, useLocation, useNavigate } from 'react-router-dom'

const depts = [
  { name: 'CSE', fullName: 'Computer Science & Engineering' },
  { name: 'AI&DS', fullName: 'Artificial Intelligence & Data Science' },
  { name: 'Mech', fullName: 'Mechanical Engineering' },
  { name: 'ECE', fullName: 'Electronics & Communication Engineering' },
  { name: 'EEE', fullName: 'Electrical & Electronics Engineering' },
  { name: 'VLSI', fullName: 'VLSI Design' }
]

export default function Departments() {
  const q = new URLSearchParams(useLocation().search)
  const year = q.get('year') || ''
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-neutral-400 mb-2">
            <Link to="/admin/dashboard" className="hover:text-white">Dashboard</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Departments - {year} Year</span>
          </nav>
          <h1 className="text-2xl font-semibold">Select Department</h1>
          <p className="text-neutral-400">Choose a department to view {year} year students</p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md"
        >
          Logout
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {depts.map(d => (
          <Link 
            key={d.name} 
            to={`/admin/students?year=${year}&department=${encodeURIComponent(d.name)}`} 
            className="p-6 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-sky-600 hover:bg-neutral-800 transition-colors"
          >
            <div className="text-lg font-semibold text-sky-400 mb-2">{d.name}</div>
            <div className="text-sm text-neutral-300">{d.fullName}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}



