import { Link, useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'

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
    <div className="max-w-4xl mx-auto p-6" style={{ position: 'relative', paddingBottom: 48 }}>
      <div className="flex items-center gap-2 mb-6">
        <h1 className="flex-1 min-w-0 font-bold text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
        <div className="flex items-center gap-2 flex-nowrap">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md border border-sky-700 text-sky-200 bg-transparent hover:bg-sky-900/30 hover:text-sky-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#111] whitespace-nowrap"
          >
            ← Back
          </button>
          <button 
            onClick={handleLogout}
            className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-white/10 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111] whitespace-nowrap"
          >
            Logout
          </button>
        </div>
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
      <Footer fixed />
    </div>
  )
}



