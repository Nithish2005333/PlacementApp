import { Link, useNavigate } from 'react-router-dom'

const years = [
  { name: 'First', description: '1st Year Students' },
  { name: 'Second', description: '2nd Year Students' },
  { name: 'Third', description: '3rd Year Students' },
  { name: 'Final', description: '4th Year Students' }
]

export default function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md"
        >
          Logout
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-4">Select Year</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {years.map(y => (
          <Link 
            key={y.name} 
            to={`/admin/departments?year=${y.name}`} 
            className="p-4 sm:p-6 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-sky-600 hover:bg-neutral-800 transition-colors group"
          >
            <div className="text-xl sm:text-2xl font-bold text-sky-400 mb-2 group-hover:text-sky-300">{y.name}</div>
            <div className="text-xs sm:text-sm text-neutral-300 leading-tight">{y.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}



