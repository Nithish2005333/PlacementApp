import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import api from '../../lib/api'

export default function StudentList() {
  const q = new URLSearchParams(useLocation().search)
  const year = q.get('year') || ''
  const department = q.get('department') || ''
  const [rows, setRows] = useState<any[]>([])
  const [query, setQuery] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null)
  const [showMessage, setShowMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const navigate = useNavigate()

  console.log('StudentList URL params:', { year, department, search: useLocation().search })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/admin/login', { replace: true })
  }

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    setStudentToDelete({ id: studentId, name: studentName })
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!studentToDelete) return

    try {
      await api.delete(`/admin/students/${studentToDelete.id}`)
      // Refresh the student list
      const { data } = await api.get('/admin/students', { params: { year, department } })
      setRows(data)
      setShowMessage({ type: 'success', text: 'Student deleted successfully' })
      setShowDeleteModal(false)
      setStudentToDelete(null)
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setShowMessage(null), 3000)
    } catch (error) {
      console.error('Failed to delete student:', error)
      setShowMessage({ type: 'error', text: 'Failed to delete student' })
      setShowDeleteModal(false)
      setStudentToDelete(null)
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => setShowMessage(null), 5000)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setStudentToDelete(null)
  }


  useEffect(() => {
    (async () => {
      if (!year || !department) {
        console.log('Missing required parameters:', { year, department })
        setRows([])
        return
      }
      
      try {
        console.log('Fetching students with params:', { year, department })
        const { data } = await api.get('/admin/students', { params: { year, department } })
        console.log('Students data received:', data)
        // Sort students by register number
        const sortedData = data.sort((a: any, b: any) => {
          return a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true })
        })
        setRows(sortedData)
      } catch (error) {
        console.error('Failed to fetch students:', error)
        setRows([])
      }
    })()
  }, [year, department])

  const normalized = (v: string) => (v || '').toString().toLowerCase().trim()
  const qNorm = normalized(query)
  const filteredRows = qNorm
    ? rows.filter(s => {
        const name = normalized(s.name)
        const reg = normalized(s.registerNumber)
        return name.includes(qNorm) || reg.includes(qNorm)
      })
    : rows

  return (
    <>
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <nav className="text-xs sm:text-sm text-neutral-400 mb-3 flex flex-wrap items-center gap-1">
          <Link to="/admin/departments" className="hover:text-white whitespace-nowrap">Dashboard</Link>
          <span className="text-neutral-500">›</span>
          <Link to={`/admin/departments?department=${encodeURIComponent(department)}`} className="hover:text-white whitespace-nowrap">{department} Department</Link>
          <span className="text-neutral-500">›</span>
          <Link to={`/admin/departments?department=${encodeURIComponent(department)}`} className="hover:text-white whitespace-nowrap">{year} Year</Link>
        </nav>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">{year} Year Students</h1>
            <p className="text-neutral-400 text-sm sm:text-base">{department} Department</p>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">{filteredRows.length} of {rows.length} student{rows.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => navigate(`/admin/departments?department=${encodeURIComponent(department)}`)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md border border-sky-700 text-sky-200 bg-transparent hover:bg-sky-900/30 hover:text-sky-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#111] whitespace-nowrap"
            >
              ← Back
            </button>
            <button 
              onClick={handleLogout}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-white/10 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111] whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#93c5fd" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span className="font-semibold text-neutral-200">Search Students</span>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#9ca3af" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or reg. no (e.g., 710022104002 or Nithishwaran)"
              aria-label="Search students by name or register number"
              className="w-full pl-9 pr-3 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
            />
          </div>
        </div>
      </div>
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden sm:grid grid-cols-3 p-4 border-b border-neutral-800 text-sm font-medium text-neutral-300 bg-neutral-800">
          <div>Register Number</div>
          <div>Student Name</div>
          <div>Actions</div>
        </div>
        
        {filteredRows.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-neutral-400">
            <div className="text-base sm:text-lg mb-2">No students found</div>
            <div className="text-xs sm:text-sm">Try clearing the search or check different filters</div>
          </div>
        ) : (
          filteredRows.map((s, index) => (
            <div key={s._id}>
              {/* Desktop Layout */}
              <div className="hidden sm:grid grid-cols-3 p-4 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0">
                <Link 
                  to={`/admin/students/${s._id}`}
                  className="font-mono text-sky-400 text-base hover:text-sky-300"
                >
                  {s.registerNumber}
                </Link>
                <Link 
                  to={`/admin/students/${s._id}`}
                  className="text-white text-base hover:text-neutral-300"
                >
                  {s.name}
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/students/${s._id}`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
                  >
                    View
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteStudent(s._id, s.name)
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="sm:hidden p-4 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/admin/students/${s._id}`}
                      className="font-mono text-sky-400 text-sm hover:text-sky-300 block mb-1"
                    >
                      {s.registerNumber}
                    </Link>
                    <Link 
                      to={`/admin/students/${s._id}`}
                      className="text-white text-sm hover:text-neutral-300 block truncate"
                    >
                      {s.name}
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/admin/students/${s._id}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium text-center min-w-[60px]"
                    >
                      View
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteStudent(s._id, s.name)
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium min-w-[60px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Line separator between students (except for the last one) */}
              {index < filteredRows.length - 1 && (
                <div className="border-b border-neutral-700"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Confirm Delete</h3>
            <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{studentToDelete?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Message */}
      {showMessage && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50">
          <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg ${
            showMessage.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base flex-1">{showMessage.text}</span>
              <button
                onClick={() => setShowMessage(null)}
                className="ml-2 text-white hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <Footer />
    </>
  )
}



