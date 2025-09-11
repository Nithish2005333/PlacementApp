import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../../lib/api'

export default function StudentList() {
  const q = new URLSearchParams(useLocation().search)
  const year = q.get('year') || ''
  const department = q.get('department') || ''
  const [rows, setRows] = useState<any[]>([])
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/admin/login', { replace: true })
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/students', { params: { year, department } })
        setRows(data)
      } catch (error) {
        console.error('Failed to fetch students:', error)
        setRows([])
      }
    })()
  }, [year, department])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-neutral-400 mb-2">
            <Link to="/admin/dashboard" className="hover:text-white">Dashboard</Link>
            <span className="mx-2">›</span>
            <Link to={`/admin/departments?year=${year}`} className="hover:text-white">Departments</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{department} - {year} Year</span>
          </nav>
          <h1 className="text-2xl font-semibold">{year} Year Students</h1>
          <p className="text-neutral-400">{department} Department</p>
          <p className="text-sm text-neutral-500">{rows.length} student{rows.length !== 1 ? 's' : ''} found</p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md"
        >
          Logout
        </button>
      </div>
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
        <div className="grid grid-cols-2 p-4 border-b border-neutral-800 text-sm font-medium text-neutral-300 bg-neutral-800">
          <div>Register Number</div>
          <div>Student Name</div>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">
            <div className="text-lg mb-2">No students found</div>
            <div className="text-sm">No students are registered for {year} year in {department} department</div>
          </div>
        ) : (
          rows.map(s => (
            <Link 
              to={`/admin/students/${s._id}`} 
              key={s._id} 
              className="grid grid-cols-2 p-4 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0"
            >
              <div className="font-mono text-sky-400">{s.registerNumber}</div>
              <div className="text-white">{s.name}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}



