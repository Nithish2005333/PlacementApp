import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import LogoutSuccessPopup from '../../components/LogoutSuccessPopup'
import SuccessPopup from '../../components/SuccessPopup'
import ErrorPopup from '../../components/ErrorPopup'
import PasswordInput from '../../components/PasswordInput'
import api from '../../lib/api'
import { departmentsStore } from '../../lib/departments'

// Fallback for initial render; will be replaced by API data
const defaultDepts = [
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
  const department = q.get('department') || (localStorage.getItem('role') === 'staff' ? (localStorage.getItem('admin_department') || '') : '')
  const navigate = useNavigate()
  const [showLogoutPopup, setShowLogoutPopup] = useState(false)
  const [departments, setDepartments] = useState<{ name: string; fullName: string }[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAdminVerificationModal, setShowAdminVerificationModal] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  // Add Department modal state
  const [showAddDeptModal, setShowAddDeptModal] = useState(false)
  const [deptName, setDeptName] = useState('')
  const [deptFullName, setDeptFullName] = useState('')
  const [showAddVerificationModal, setShowAddVerificationModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper: merge API departments with defaults, de-duplicated by name (case-insensitive)
  const mergeWithDefaults = (apiDepts: { name: string; fullName: string }[]) => {
    const seen = new Set<string>()
    const merged: { name: string; fullName: string }[] = []
    ;[...apiDepts, ...defaultDepts].forEach(d => {
      const key = d.name.trim().toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        merged.push({ name: d.name, fullName: d.fullName || d.name })
      }
    })
    return merged.sort((a, b) => a.name.localeCompare(b.name))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setShowLogoutPopup(true)
  }

  const handleCloseLogoutPopup = () => {
    setShowLogoutPopup(false)
    navigate('/', { replace: true })
  }
  // Add Department flow
  const openAddDept = () => {
    setDeptName('')
    setDeptFullName('')
    setShowAddDeptModal(true)
  }

  const cancelAddDept = () => {
    setShowAddDeptModal(false)
    setDeptName('')
    setDeptFullName('')
  }

  const proceedAddDept = () => {
    if (!deptName.trim()) {
      showErrorMessage('Department name is required')
      return
    }
    // Prevent duplicates (case-insensitive)
    const exists = (loadingDepts ? defaultDepts : departments)
      .some(d => d.name.trim().toLowerCase() === deptName.trim().toLowerCase())
    if (exists) {
      showErrorMessage(`Department ${deptName.trim()} already exists`)
      return
    }
    setShowAddDeptModal(false)
    setShowAddVerificationModal(true)
  }

  const cancelAddVerification = () => {
    setShowAddVerificationModal(false)
    setAdminCredentials({ username: '', password: '' })
  }

  const verifyAndCreateDept = async () => {
    if (!adminCredentials.username || !adminCredentials.password) {
      showErrorMessage('Please enter both username and password')
      return
    }
    // Double-check duplicate just before create
    const exists = (loadingDepts ? defaultDepts : departments)
      .some(d => d.name.trim().toLowerCase() === deptName.trim().toLowerCase())
    if (exists) {
      showErrorMessage(`Department ${deptName.trim()} already exists`)
      setShowAddVerificationModal(false)
      setAdminCredentials({ username: '', password: '' })
      return
    }
    setIsSubmitting(true)
    try {
      const verifyResponse = await api.post('/admin/verify', adminCredentials)
      if (!verifyResponse.data.valid) {
        showErrorMessage('Invalid admin credentials')
        setIsSubmitting(false)
        return
      }
      await api.post('/admin/departments', {
        name: deptName.trim(),
        fullName: deptFullName.trim() || deptName.trim(),
      })
      // refresh list
      const { data } = await api.get('/admin/departments')
      setDepartments(mergeWithDefaults(data))
      // notify global store so dropdowns update immediately
      departmentsStore.refresh()
      setShowAddVerificationModal(false)
      setAdminCredentials({ username: '', password: '' })
      showSuccessMessage(`Department ${deptName.trim()} created`)
    } catch (e) {
      console.error('Failed to create department', e)
      const anyErr: any = e as any
      const msg = anyErr?.response?.status === 409 ? `Department ${deptName.trim()} already exists` : 'Failed to create department'
      showErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const showSuccessMessage = (message: string) => {
    setPopupMessage(message)
    setShowSuccessPopup(true)
  }

  const showErrorMessage = (message: string) => {
    setPopupMessage(message)
    setShowErrorPopup(true)
  }

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false)
    setPopupMessage('')
  }

  const handleCloseErrorPopup = () => {
    setShowErrorPopup(false)
    setPopupMessage('')
  }

  useEffect(() => {
    (async () => {
      setLoadingDepts(true)
      try {
        const { data } = await api.get('/admin/departments')
        setDepartments(mergeWithDefaults(data))
      } catch (e) {
        console.error('Failed to fetch departments', e)
        // keep defaults
      } finally {
        setLoadingDepts(false)
      }
    })()
  }, [])

  const requestDeleteDepartment = (name: string) => {
    setDeptToDelete(name)
    setShowDeleteModal(true)
  }

  const cancelDeleteDepartment = () => {
    setShowDeleteModal(false)
    setDeptToDelete(null)
  }

  const proceedDeleteDepartment = () => {
    setShowDeleteModal(false)
    setShowAdminVerificationModal(true)
  }

  const cancelVerification = () => {
    setShowAdminVerificationModal(false)
    setAdminCredentials({ username: '', password: '' })
    setDeptToDelete(null)
  }

  const verifyAdminAndDeleteDept = async () => {
    if (!deptToDelete) return
    if (!adminCredentials.username || !adminCredentials.password) {
      showErrorMessage('Please enter both username and password')
      return
    }
    setIsDeleting(true)
    try {
      const verifyResponse = await api.post('/admin/verify', adminCredentials)
      if (!verifyResponse.data.valid) {
        showErrorMessage('Invalid admin credentials')
        setIsDeleting(false)
        return
      }

      await api.delete(`/admin/departments/${encodeURIComponent(deptToDelete)}`)
      // Refresh departments
      const { data } = await api.get('/admin/departments')
      setDepartments(mergeWithDefaults(data))
      departmentsStore.refresh()
      showSuccessMessage(`Department ${deptToDelete} deleted`)
      setShowAdminVerificationModal(false)
      setAdminCredentials({ username: '', password: '' })
      setDeptToDelete(null)
    } catch (e) {
      console.error('Failed to delete department', e)
      showErrorMessage('Failed to delete department')
    } finally {
      setIsDeleting(false)
    }
  }

  // If no department selected, show department selection
  if (!department) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <div className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-neutral-400 text-base sm:text-lg">Select a department to view years</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => navigate('/admin/reps')}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-blue-700 text-blue-200 bg-transparent hover:bg-blue-900/30 hover:text-blue-100 rounded"
                >
                  Manage Reps
                </button>
                <button 
                  onClick={() => navigate('/admin/staff')}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-indigo-700 text-indigo-200 bg-transparent hover:bg-indigo-900/30 hover:text-indigo-100 rounded"
                >
                  Manage Staffs
                </button>
                <button 
                  onClick={openAddDept}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-emerald-700 text-emerald-200 bg-transparent hover:bg-emerald-900/30 hover:text-emerald-100 rounded"
                >
                  + Add Dept
                </button>
                <button
                  onClick={() => { if ((loadingDepts ? defaultDepts : departments).length > 0) { setDeptToDelete((loadingDepts ? defaultDepts : departments)[0].name); setShowDeleteModal(true) } }}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-red-700 text-red-200 bg-transparent hover:bg-red-900/30 hover:text-red-100 rounded"
                >
                  Delete Dept
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-red-600 hover:bg-red-500 text-white rounded"
                >
                  Logout
                </button>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Select Department</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {loadingDepts ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 sm:p-8 rounded-lg bg-neutral-900 border border-neutral-800 animate-pulse">
                    <div className="h-6 w-28 bg-neutral-700 rounded mb-3"></div>
                    <div className="h-5 w-48 bg-neutral-800 rounded"></div>
                  </div>
                ))
              ) : (
                departments.map(d => (
                  <Link 
                    key={d.name}
                    to={`/admin/departments?department=${encodeURIComponent(d.name)}`} 
                    className="group block p-6 sm:p-8 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/20 hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl sm:text-3xl font-bold text-sky-400 group-hover:text-sky-300 transition-colors duration-300">{d.name}</div>
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/30 transition-colors duration-300">
                        <svg className="w-4 h-4 text-sky-400 group-hover:text-sky-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-sm sm:text-base text-neutral-300 group-hover:text-neutral-200 transition-colors duration-300 leading-relaxed">{d.fullName}</div>
                    <div className="mt-4 pt-3 border-t border-neutral-700 group-hover:border-sky-500/30 transition-colors duration-300">
                      <div className="text-xs text-neutral-500 group-hover:text-sky-400 transition-colors duration-300">Click to view years</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
        <Footer />
        <LogoutSuccessPopup show={showLogoutPopup} onClose={handleCloseLogoutPopup} />
        <SuccessPopup show={showSuccessPopup} onClose={handleCloseSuccessPopup} message={popupMessage} />
        <ErrorPopup show={showErrorPopup} onClose={handleCloseErrorPopup} message={popupMessage} />
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Delete Department</h3>
              <div className="space-y-3 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Select Department</label>
                  <select
                    value={deptToDelete || ''}
                    onChange={(e) => setDeptToDelete(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="" disabled>Select department</option>
                    {(loadingDepts ? defaultDepts : departments).map(d => (
                      <option key={d.name} value={d.name}>{d.name} - {d.fullName}</option>
                    ))}
                  </select>
                </div>
                {deptToDelete && (
                  <p className="text-sm sm:text-base text-neutral-300">You are about to delete <span className="font-semibold text-white">{deptToDelete}</span>. This action cannot be undone.</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button onClick={cancelDeleteDepartment} className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1">Cancel</button>
                <button onClick={proceedDeleteDepartment} disabled={!deptToDelete} className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50">Continue to Verification</button>
              </div>
            </div>
          </div>
        )}
        {/* Admin Verification Modal */}
        {showAdminVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Admin Verification Required</h3>
              <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
                Please enter your admin credentials to confirm department deletion.
              </p>
              <div className="space-y-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                  <input type="text" value={adminCredentials.username} onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })} placeholder="Enter admin username" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                  <PasswordInput value={adminCredentials.password} onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })} placeholder="Enter admin password" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button onClick={cancelVerification} disabled={isDeleting} className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1 disabled:opacity-50">Cancel</button>
                <button onClick={verifyAdminAndDeleteDept} disabled={isDeleting || !adminCredentials.username || !adminCredentials.password} className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50">
                  {isDeleting ? 'Deleting...' : 'Delete Department'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Add Department Modal */}
        {showAddDeptModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Add New Department</h3>
              <div className="space-y-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Department Code</label>
                  <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g., CSE" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Department Full Name</label>
                  <input value={deptFullName} onChange={(e) => setDeptFullName(e.target.value)} placeholder="e.g., Computer Science & Engineering" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button onClick={cancelAddDept} className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1">Cancel</button>
                <button onClick={proceedAddDept} className="px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2">Continue to Verification</button>
              </div>
            </div>
          </div>
        )}
        {/* Add Department Verification Modal */}
        {showAddVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Admin Verification Required</h3>
              <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">Please enter your admin credentials to create the department.</p>
              <div className="space-y-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                  <input type="text" value={adminCredentials.username} onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })} placeholder="Enter admin username" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                  <PasswordInput value={adminCredentials.password} onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })} placeholder="Enter admin password" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button onClick={cancelAddVerification} disabled={isSubmitting} className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1 disabled:opacity-50">Cancel</button>
                <button onClick={verifyAndCreateDept} disabled={isSubmitting || !adminCredentials.username || !adminCredentials.password} className="px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Create Department'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // If department selected but no year, show year selection
  if (department && !year) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <div className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-row flex-wrap items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <nav className="text-xs sm:text-sm text-neutral-400 mb-2">
                  <Link to="/admin/departments" className="hover:text-white">Dashboard</Link>
                  <span className="mx-2">›</span>
                  <Link to="/admin/departments" className="hover:text-white">{department} Department</Link>
                </nav>
                <h1 className="text-2xl sm:text-3xl font-semibold">Select Year</h1>
                <p className="text-neutral-400 text-base sm:text-lg">Choose a year to view {department} department students</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {localStorage.getItem('role') !== 'staff' && (
                <button 
                  onClick={() => navigate('/admin/departments')}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-sky-700 text-sky-200 bg-transparent hover:bg-sky-900/30 hover:text-sky-100 rounded"
                >
                  ← Back
                </button>
                )}
                <button 
                  onClick={() => navigate(`/admin/reps?department=${encodeURIComponent(department)}`)}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-blue-700 text-blue-200 bg-transparent hover:bg-blue-900/30 hover:text-blue-100 rounded"
                >
                  Manage Reps
                </button>
                {localStorage.getItem('role') === 'admin' && (
                <button 
                  onClick={() => navigate('/admin/staff')}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-indigo-700 text-indigo-200 bg-transparent hover:bg-indigo-900/30 hover:text-indigo-100 rounded"
                >
                  Manage Staffs
                </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-red-600 hover:bg-red-500 text-white rounded"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {years.map(y => (
                <Link 
                  key={y.name} 
                  to={`/admin/students?year=${y.name}&department=${encodeURIComponent(department)}`}
                  className="group block p-6 sm:p-8 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/20 hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl sm:text-3xl font-bold text-sky-400 group-hover:text-sky-300 transition-colors duration-300">{y.name}</div>
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/30 transition-colors duration-300">
                      <svg className="w-4 h-4 text-sky-400 group-hover:text-sky-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm sm:text-base text-neutral-300 group-hover:text-neutral-200 transition-colors duration-300 leading-relaxed">{y.description}</div>
                  <div className="mt-4 pt-3 border-t border-neutral-700 group-hover:border-sky-500/30 transition-colors duration-300">
                    <div className="text-xs text-neutral-500 group-hover:text-sky-400 transition-colors duration-300">View students</div>
                  </div>
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



