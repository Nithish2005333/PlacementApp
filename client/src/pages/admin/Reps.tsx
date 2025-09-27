import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Footer from '../../components/Footer'
import LogoutSuccessPopup from '../../components/LogoutSuccessPopup'
import SuccessPopup from '../../components/SuccessPopup'
import ErrorPopup from '../../components/ErrorPopup'
import PasswordInput from '../../components/PasswordInput'
import api from '../../lib/api'
import { departmentsStore, type DepartmentOption } from '../../lib/departments'

interface Rep {
  username: string
  name: string | null
  email: string | null
  department: string
  year: string
  role: string
  password?: string | null
}

const years = ['First', 'Second', 'Third', 'Final']

export default function Reps() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutPopup, setShowLogoutPopup] = useState(false)
  const [deptOptions, setDeptOptions] = useState<DepartmentOption[]>([])
  
  // Get department and year from URL params
  const searchParams = new URLSearchParams(location.search)
  const currentDepartment = searchParams.get('department') || ''
  const currentYear = searchParams.get('year') || ''
  const [reps, setReps] = useState<Rep[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState<string>(currentDepartment || '')
  const [filterYear, setFilterYear] = useState<string>(currentYear || '')
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  
  // Create Rep Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    department: '',
    year: ''
  })
  const [showCreateVerification, setShowCreateVerification] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Edit Rep Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRep, setEditingRep] = useState<Rep | null>(null)
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    email: '',
    department: '',
    year: '',
    password: '',
    currentPassword: ''
  })
  const [showEditVerification, setShowEditVerification] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Delete Rep Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingRep, setDeletingRep] = useState<Rep | null>(null)
  const [showDeleteVerification, setShowDeleteVerification] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [expandedRep, setExpandedRep] = useState<string | null>(null)
  
  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }
  
  // Admin verification
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setShowLogoutPopup(true)
  }

  const handleCloseLogoutPopup = () => {
    setShowLogoutPopup(false)
    navigate('/', { replace: true })
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

  const fetchReps = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const dept = filterDept || currentDepartment
      const year = filterYear || currentYear
      if (dept) params.append('department', dept)
      if (year) params.append('year', year)
      
      const { data } = await api.get(`/admin/reps?${params.toString()}`)
      setReps(data)
    } catch (e) {
      console.error('Failed to fetch reps', e)
      showErrorMessage('Failed to load representatives')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReps()
  }, [currentDepartment, currentYear, filterDept, filterYear])

  useEffect(() => {
    departmentsStore.load()
    const unsub = departmentsStore.subscribe((list) => setDeptOptions(list))
    return () => { unsub() }
  }, [])

  // Create Rep Flow
  const openCreateModal = () => {
    setCreateForm({ 
      username: '', 
      password: '', 
      name: '', 
      email: '', 
      department: currentDepartment || '', 
      year: currentYear || '' 
    })
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateForm({ username: '', password: '', name: '', email: '', department: '', year: '' })
  }

  const proceedCreate = () => {
    if (!createForm.username || !createForm.password || !createForm.department || !createForm.year) {
      showErrorMessage('Username, password, department and year are required')
      return
    }
    setShowCreateModal(false)
    setShowCreateVerification(true)
  }

  const cancelCreateVerification = () => {
    setShowCreateVerification(false)
    setAdminCredentials({ username: '', password: '' })
  }

  const verifyAndCreateRep = async () => {
    if (!adminCredentials.username || !adminCredentials.password) {
      showErrorMessage('Please enter both username and password')
      return
    }
    
    // Validate email format
    if (!createForm.email || !validateEmail(createForm.email)) {
      showErrorMessage('Please enter a valid email address (must contain @ and proper domain)')
      return
    }
    setIsCreating(true)
    try {
      const verifyResponse = await api.post('/admin/verify', adminCredentials)
      if (!verifyResponse.data.valid) {
        showErrorMessage('Invalid admin credentials')
        setIsCreating(false)
        return
      }
      await api.post('/admin/reps', createForm)
      setShowCreateVerification(false)
      setAdminCredentials({ username: '', password: '' })
      showSuccessMessage('Representative created successfully')
      fetchReps()
    } catch (e: any) {
      console.error('Failed to create rep', e)
      const message = e?.response?.status === 409 ? 'Username already exists' : 'Failed to create representative'
      showErrorMessage(message)
    } finally {
      setIsCreating(false)
    }
  }

  // Edit Rep Flow
  const openEditModal = (rep: Rep) => {
    setEditingRep(rep)
    setEditForm({
      username: rep.username,
      name: rep.name || '',
      email: rep.email || '',
      department: rep.department,
      year: rep.year,
      password: '',
      currentPassword: rep.password || '••••••••'
    })
    setShowPassword(false)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingRep(null)
    setEditForm({ username: '', name: '', email: '', department: '', year: '', password: '', currentPassword: '' })
  }

  const proceedEdit = () => {
    if (!editForm.username || !editForm.department || !editForm.year) {
      showErrorMessage('Username, department and year are required')
      return
    }
    setShowEditModal(false)
    setShowEditVerification(true)
  }

  const cancelEditVerification = () => {
    setShowEditVerification(false)
    setAdminCredentials({ username: '', password: '' })
  }

  const verifyAndEditRep = async () => {
    if (!editingRep) return
    if (!adminCredentials.username || !adminCredentials.password) {
      showErrorMessage('Please enter both username and password')
      return
    }
    
    // Validate email format
    if (!editForm.email || !validateEmail(editForm.email)) {
      showErrorMessage('Please enter a valid email address (must contain @ and proper domain)')
      return
    }
    setIsEditing(true)
    try {
      const verifyResponse = await api.post('/admin/verify', adminCredentials)
      if (!verifyResponse.data.valid) {
        showErrorMessage('Invalid admin credentials')
        setIsEditing(false)
        return
      }
      const updateData = { ...editForm }
      if (!updateData.password) {
        const { password, currentPassword, ...rest } = updateData
        Object.assign(updateData, rest)
      } else {
        const { currentPassword, ...rest } = updateData
        Object.assign(updateData, rest)
      }
      await api.put(`/admin/reps/${editingRep.username}`, updateData)
      setShowEditVerification(false)
      setAdminCredentials({ username: '', password: '' })
      showSuccessMessage('Representative updated successfully')
      fetchReps()
    } catch (e: any) {
      console.error('Failed to edit rep', e)
      showErrorMessage('Failed to update representative')
    } finally {
      setIsEditing(false)
    }
  }

  // Delete Rep Flow
  const openDeleteModal = (rep: Rep) => {
    setDeletingRep(rep)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletingRep(null)
  }

  const proceedDelete = () => {
    setShowDeleteModal(false)
    setShowDeleteVerification(true)
  }

  const cancelDeleteVerification = () => {
    setShowDeleteVerification(false)
    setAdminCredentials({ username: '', password: '' })
  }

  const verifyAndDeleteRep = async () => {
    if (!deletingRep) return
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
      await api.delete(`/admin/reps/${deletingRep.username}`)
      setShowDeleteVerification(false)
      setAdminCredentials({ username: '', password: '' })
      showSuccessMessage('Representative deleted successfully')
      fetchReps()
    } catch (e: any) {
      console.error('Failed to delete rep', e)
      showErrorMessage('Failed to delete representative')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <style>{`
        /* Custom button styles for Edit and Delete */
        .edit-button {
          --color: rgba(59, 130, 246, 1);
          padding: 0.4em 0.8em;
          background-color: transparent;
          border-radius: .3em;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: .5s;
          font-weight: 500;
          font-size: 12px;
          border: 1px solid;
          font-family: inherit;
          text-transform: uppercase;
          color: var(--color);
          z-index: 1;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          min-width: 50px;
        }
        
        .edit-button::before, .edit-button::after {
          content: '';
          display: block;
          width: 30px;
          height: 30px;
          transform: translate(-50%, -50%);
          position: absolute;
          border-radius: 50%;
          z-index: -1;
          background-color: var(--color);
          transition: 1s ease;
        }
        
        .edit-button::before {
          top: -1em;
          left: -1em;
        }
        
        .edit-button::after {
          left: calc(100% + 1em);
          top: calc(100% + 1em);
        }
        
        .edit-button:hover::before, .edit-button:hover::after {
          height: 200px;
          width: 200px;
        }
        
        .edit-button:hover {
          color: #fff;
          text-decoration: none;
        }
        
        .edit-button:active {
          filter: brightness(.8);
        }
        
        .delete-button {
          --color: rgba(239, 68, 68, 1);
          padding: 0.4em 0.8em;
          background-color: transparent;
          border-radius: .3em;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: .5s;
          font-weight: 500;
          font-size: 12px;
          border: 1px solid;
          font-family: inherit;
          text-transform: uppercase;
          color: var(--color);
          z-index: 1;
          display: inline-block;
          text-align: center;
          min-width: 50px;
        }
        
        .delete-button::before, .delete-button::after {
          content: '';
          display: block;
          width: 30px;
          height: 30px;
          transform: translate(-50%, -50%);
          position: absolute;
          border-radius: 50%;
          z-index: -1;
          background-color: var(--color);
          transition: 1s ease;
        }
        
        .delete-button::before {
          top: -1em;
          left: -1em;
        }
        
        .delete-button::after {
          left: calc(100% + 1em);
          top: calc(100% + 1em);
        }
        
        .delete-button:hover::before, .delete-button:hover::after {
          height: 200px;
          width: 200px;
        }
        
        .delete-button:hover {
          color: #fff;
        }
        
        .delete-button:active {
          filter: brightness(.8);
        }
      `}</style>
      <div className="flex-1">
        <div className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                Manage Representatives
                {currentDepartment && (
                  <span className="text-lg sm:text-xl text-neutral-300 block sm:inline sm:ml-2">
                    - {currentDepartment} {currentYear}
                  </span>
                )}
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base">
                {currentDepartment 
                  ? `Create and manage ${currentDepartment} ${currentYear} representatives`
                  : 'Create and manage placement representatives'
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => navigate('/admin/departments')}
                className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base rounded border border-sky-700 text-sky-200 bg-transparent hover:bg-sky-900/30 hover:text-sky-100"
              >
                ← Back
              </button>
              <button 
                onClick={openCreateModal}
                className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base rounded bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                + Add Rep
              </button>
              <button 
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base rounded bg-red-600 hover:bg-red-500 text-white"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Reps List */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Placement Representatives</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  value={search}
                  onChange={(e)=>setSearch(e.target.value)}
                  placeholder="Search username, name or email"
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm w-full sm:w-64"
                />
                <select value={filterDept} onChange={(e)=>setFilterDept(e.target.value)} className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm">
                  <option value="">All Departments</option>
                  {deptOptions.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <select value={filterYear} onChange={(e)=>setFilterYear(e.target.value)} className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm">
                  <option value="">All Years</option>
                  <option value="First">First</option>
                  <option value="Second">Second</option>
                  <option value="Third">Third</option>
                  <option value="Final">Final</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-neutral-400">Loading...</div>
            ) : reps.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">No representatives found</div>
            ) : (
              <>
                {/* Desktop Table Header */}
                <div className="hidden md:grid md:grid-cols-5 p-4 border-b border-neutral-800 text-sm font-medium text-neutral-300 bg-neutral-800">
                  <div>Username</div>
                  <div>Name</div>
                  <div>Department</div>
                  <div>Year</div>
                  <div className="text-right">Actions</div>
                </div>
                
                <div className="space-y-2 p-2">
                    {reps
                      .filter(rep => !search.trim() || rep.username.toLowerCase().includes(search.trim().toLowerCase()) || (rep.name||'').toLowerCase().includes(search.trim().toLowerCase()) || (rep.email||'').toLowerCase().includes(search.trim().toLowerCase()))
                      .filter(rep => !filterDept || rep.department === filterDept)
                      .filter(rep => !filterYear || rep.year === filterYear)
                      .map((rep) => (
                  <div key={rep.username} className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
                    {/* Mobile Row - Clickable */}
                    <div 
                      className="md:hidden p-4 cursor-pointer hover:bg-neutral-700/50 transition-all duration-200 rounded-lg"
                      onClick={() => setExpandedRep(expandedRep === rep.username ? null : rep.username)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-neutral-400 text-xs font-medium">Username:</span>
                            <span className="font-mono text-sky-300 text-sm font-semibold">{rep.username}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-neutral-400 text-xs font-medium">Name:</span>
                            <span className="text-white text-sm font-medium">{rep.name || '-'}</span>
                          </div>
                          <div className="text-neutral-400 text-xs">
                            {rep.department} • {rep.year}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                            <svg 
                              className={`w-4 h-4 text-sky-400 transition-transform duration-200 ${expandedRep === rep.username ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Dropdown Details */}
                    {expandedRep === rep.username && (
                      <div className="md:hidden border-t border-neutral-700 p-4 bg-gradient-to-r from-neutral-700/30 to-neutral-600/20">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            <div className="bg-neutral-800/50 rounded-lg p-3">
                              <div className="text-xs text-neutral-400 mb-1 font-medium">Email</div>
                              <div className="text-neutral-200 break-all text-sm">{rep.email || '-'}</div>
                            </div>
                            <div className="bg-neutral-800/50 rounded-lg p-3">
                              <div className="text-xs text-neutral-400 mb-1 font-medium">Department</div>
                              <div className="text-neutral-200 text-sm">{rep.department}</div>
                            </div>
                            <div className="bg-neutral-800/50 rounded-lg p-3">
                              <div className="text-xs text-neutral-400 mb-1 font-medium">Year</div>
                              <div className="text-neutral-200 text-sm">{rep.year}</div>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2 justify-end">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(rep)
                              }} 
                              className="edit-button"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteModal(rep)
                              }} 
                              className="delete-button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Desktop Row - Clickable with dropdown */}
                    <div 
                      className="hidden md:block cursor-pointer hover:bg-neutral-700/50 transition-colors"
                      onClick={() => setExpandedRep(expandedRep === rep.username ? null : rep.username)}
                    >
                      <div className="grid md:grid-cols-5 p-4">
                        <div className="font-mono text-sky-300 text-sm font-semibold">{rep.username}</div>
                        <div className="text-white text-sm font-medium">{rep.name || '-'}</div>
                        <div className="text-neutral-300 text-sm">{rep.department}</div>
                        <div className="text-neutral-300 text-sm">{rep.year}</div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center">
                              <svg 
                                className={`w-3 h-3 text-sky-400 transition-transform duration-200 ${expandedRep === rep.username ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Dropdown Details */}
                    {expandedRep === rep.username && (
                      <div className="hidden md:block border-t border-neutral-700 p-4 bg-gradient-to-r from-neutral-700/30 to-neutral-600/20">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            <div className="bg-neutral-800/50 rounded-lg p-3">
                              <div className="text-xs text-neutral-400 mb-1 font-medium">Email</div>
                              <div className="text-neutral-200 break-all text-sm">{rep.email || '-'}</div>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2 justify-end">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(rep)
                              }} 
                              className="edit-button"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteModal(rep)
                              }} 
                              className="delete-button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <LogoutSuccessPopup show={showLogoutPopup} onClose={handleCloseLogoutPopup} />
      <SuccessPopup show={showSuccessPopup} onClose={handleCloseSuccessPopup} message={popupMessage} />
      <ErrorPopup show={showErrorPopup} onClose={handleCloseErrorPopup} message={popupMessage} />

      {/* Create Rep Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Add Representative</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Username *</label>
                <input
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Password *</label>
                <PasswordInput
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="Enter email address (e.g., rep@example.com)"
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  required
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Department *</label>
                <select
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm appearance-none bg-no-repeat bg-right pr-8"
                  style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 8px center', backgroundSize: '16px'}}
                >
                  <option value="">Select department</option>
                  {deptOptions.map(dept => (
                    <option key={dept.name} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Year *</label>
                <select
                  value={createForm.year}
                  onChange={(e) => setCreateForm({ ...createForm, year: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm appearance-none bg-no-repeat bg-right pr-8"
                  style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 8px center', backgroundSize: '16px'}}
                >
                  <option value="">Select year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={closeCreateModal} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-xs sm:text-sm">Cancel</button>
              <button onClick={proceedCreate} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs sm:text-sm">Continue to Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Verification Modal */}
      {showCreateVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Admin Verification Required</h3>
            <p className="text-sm text-neutral-300 mb-6">Please enter your admin credentials to create the representative.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                  placeholder="Enter admin username"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                <PasswordInput
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelCreateVerification} disabled={isCreating} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-xs sm:text-sm disabled:opacity-50">Cancel</button>
              <button onClick={verifyAndCreateRep} disabled={isCreating || !adminCredentials.username || !adminCredentials.password} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs sm:text-sm disabled:opacity-50">
                {isCreating ? 'Creating...' : 'Create Representative'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rep Modal */}
      {showEditModal && editingRep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Edit Representative</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Username *</label>
                <input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Current Password</label>
                <input
                  type="text"
                  value={editForm.currentPassword}
                  readOnly
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-neutral-300 text-sm font-mono"
                  placeholder="Password not available"
                />
                {editForm.currentPassword === '••••••••' && (
                  <p className="text-xs text-neutral-400 mt-1">Password is hidden for security. Enter a new password below to change it.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email address (e.g., rep@example.com)"
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  required
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Department *</label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm appearance-none bg-no-repeat bg-right pr-8"
                  style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 8px center', backgroundSize: '16px'}}
                >
                  <option value="">Select department</option>
                  {deptOptions.map(dept => (
                    <option key={dept.name} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Year *</label>
                <select
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm appearance-none bg-no-repeat bg-right pr-8"
                  style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 8px center', backgroundSize: '16px'}}
                >
                  <option value="">Select year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">New Password (leave blank to keep current)</label>
                <PasswordInput
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={closeEditModal} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-xs sm:text-sm">Cancel</button>
              <button onClick={proceedEdit} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs sm:text-sm">Continue to Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Verification Modal */}
      {showEditVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Admin Verification Required</h3>
            <p className="text-sm text-neutral-300 mb-6">Please enter your admin credentials to update the representative.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                  placeholder="Enter admin username"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                <PasswordInput
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelEditVerification} disabled={isEditing} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-xs sm:text-sm disabled:opacity-50">Cancel</button>
              <button onClick={verifyAndEditRep} disabled={isEditing || !adminCredentials.username || !adminCredentials.password} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs sm:text-sm disabled:opacity-50">
                {isEditing ? 'Updating...' : 'Update Representative'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Rep Modal */}
      {showDeleteModal && deletingRep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Delete Representative</h3>
            <p className="text-sm text-neutral-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{deletingRep.username}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeDeleteModal} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-xs sm:text-sm">Cancel</button>
              <button onClick={proceedDelete} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs sm:text-sm">Continue to Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Verification Modal */}
      {showDeleteVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 sm:p-6 max-w-sm sm:max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Admin Verification Required</h3>
            <p className="text-sm text-neutral-300 mb-6">Please enter your admin credentials to delete the representative.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                  placeholder="Enter admin username"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                <PasswordInput
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelDeleteVerification} disabled={isDeleting} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-xs sm:text-sm disabled:opacity-50">Cancel</button>
              <button onClick={verifyAndDeleteRep} disabled={isDeleting || !adminCredentials.username || !adminCredentials.password} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs sm:text-sm disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete Representative'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}