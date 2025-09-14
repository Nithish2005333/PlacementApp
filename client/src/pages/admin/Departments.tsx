import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import LogoutSuccessPopup from '../../components/LogoutSuccessPopup'

const depts = [
  { name: 'CSE', fullName: 'Computer Science & Engineering' },
  { name: 'AI&DS', fullName: 'Artificial Intelligence & Data Science' },
  { name: 'Mech', fullName: 'Mechanical Engineering' },
  { name: 'ECE', fullName: 'Electronics & Communication Engineering' },
  { name: 'EEE', fullName: 'Electrical & Electronics Engineering' },
  { name: 'VLSI', fullName: 'VLSI Design' }
]

const years = [
  { name: 'First', description: '1st Year Students' },
  { name: 'Second', description: '2nd Year Students' },
  { name: 'Third', description: '3rd Year Students' },
  { name: 'Final', description: '4th Year Students' }
]

export default function Departments() {
  const q = new URLSearchParams(useLocation().search)
  const year = q.get('year') || ''
  const department = q.get('department') || ''
  const navigate = useNavigate()
  const [showLogoutPopup, setShowLogoutPopup] = React.useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setShowLogoutPopup(true)
  }

  const handleCloseLogoutPopup = () => {
    setShowLogoutPopup(false)
    navigate('/admin/login', { replace: true })
  }

  // If no department selected, show department selection
  if (!department) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-neutral-400 text-sm sm:text-base">Select a department to view years</p>
              </div>
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md w-auto text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Department</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {depts.map(d => (
                <Link 
                  key={d.name} 
                  to={`/admin/departments?department=${encodeURIComponent(d.name)}`} 
                  className="p-4 sm:p-6 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-sky-600 hover:bg-neutral-800 transition-colors group"
                >
                  <div className="text-lg font-semibold text-sky-400 mb-2 group-hover:text-sky-300">{d.name}</div>
                  <div className="text-sm text-neutral-300">{d.fullName}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <Footer />
        <LogoutSuccessPopup show={showLogoutPopup} onClose={handleCloseLogoutPopup} />
      </div>
    )
  }

  // If department selected but no year, show year selection
  if (department && !year) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="flex flex-row flex-wrap items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <nav className="text-xs sm:text-sm text-neutral-400 mb-2">
                  <Link to="/admin/departments" className="hover:text-white">Dashboard</Link>
                  <span className="mx-2">›</span>
                  <Link to="/admin/departments" className="hover:text-white">{department} Department</Link>
                </nav>
                <h1 className="text-xl sm:text-2xl font-semibold">Select Year</h1>
                <p className="text-neutral-400 text-sm sm:text-base">Choose a year to view {department} department students</p>
              </div>
              <div className="flex items-center gap-2 flex-nowrap">
                <button 
                  onClick={() => navigate('/admin/departments')}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {years.map(y => (
                <Link 
                  key={y.name} 
                  to={`/admin/students?year=${y.name}&department=${encodeURIComponent(department)}`} 
                  className="p-4 sm:p-6 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-sky-600 hover:bg-neutral-800 transition-colors group"
                >
                  <div className="text-xl sm:text-2xl font-bold text-sky-400 mb-2 group-hover:text-sky-300">{y.name}</div>
                  <div className="text-xs sm:text-sm text-neutral-300 leading-tight">{y.description}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <Footer />
        <LogoutSuccessPopup show={showLogoutPopup} onClose={handleCloseLogoutPopup} />
      </div>
    )
  }

  // This should not happen as we redirect to students page
  return null
}



