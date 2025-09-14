import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import LogoutSuccessPopup from '../../components/LogoutSuccessPopup'
import FilterSuccessPopup from '../../components/FilterSuccessPopup'
import SuccessPopup from '../../components/SuccessPopup'
import ErrorPopup from '../../components/ErrorPopup'
import PasswordInput from '../../components/PasswordInput'
import api from '../../lib/api'

export default function StudentList() {
  const q = new URLSearchParams(useLocation().search)
  const year = q.get('year') || ''
  const department = q.get('department') || ''
  const [rows, setRows] = useState<any[]>([])
  const [query, setQuery] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [showLogoutPopup, setShowLogoutPopup] = useState(false)
  const [showFilterSuccessPopup, setShowFilterSuccessPopup] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState({
    willingToPlace: [] as string[],
    historyOfArrears: [] as string[],
    currentArrears: [] as string[],
    cgpaRange: '',
    technicalSkills: [] as string[],
    softSkills: [] as string[],
    gender: '',
    year: '',
    department: '',
    hscPercentage: '',
    sslcPercentage: '',
    hasInternship: [] as string[],
    hasProjects: [] as string[],
    hasCertifications: [] as string[],
    currentSemester: ''
  })
  const [tempSkill, setTempSkill] = useState({ technical: '', soft: '' })
  const [filteredRows, setFilteredRows] = useState<any[]>([])
  const [isFiltered, setIsFiltered] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showAdminVerificationModal, setShowAdminVerificationModal] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const navigate = useNavigate()

  console.log('StudentList URL params:', { year, department, search: useLocation().search })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setShowLogoutPopup(true)
  }

  const handleCloseLogoutPopup = () => {
    setShowLogoutPopup(false)
    navigate('/admin/login', { replace: true })
  }

  const handleCloseFilterSuccessPopup = () => {
    setShowFilterSuccessPopup(false)
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
      showSuccessMessage(`Student ${studentToDelete.name} deleted successfully`)
      setShowDeleteModal(false)
      setStudentToDelete(null)
    } catch (error) {
      console.error('Failed to delete student:', error)
      showErrorMessage('Failed to delete student')
      setShowDeleteModal(false)
      setStudentToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setStudentToDelete(null)
  }

  const addSkill = (type: 'technical' | 'soft') => {
    const skill = type === 'technical' ? tempSkill.technical : tempSkill.soft
    if (!skill.trim()) return
    
    const currentSkills = filters[type === 'technical' ? 'technicalSkills' : 'softSkills']
    if (!currentSkills.includes(skill.trim())) {
      setFilters({
        ...filters,
        [type === 'technical' ? 'technicalSkills' : 'softSkills']: [...currentSkills, skill.trim()]
      })
    }
    
    setTempSkill({ ...tempSkill, [type]: '' })
  }

  const removeSkill = (type: 'technical' | 'soft', index: number) => {
    const currentSkills = filters[type === 'technical' ? 'technicalSkills' : 'softSkills']
    setFilters({
      ...filters,
      [type === 'technical' ? 'technicalSkills' : 'softSkills']: currentSkills.filter((_, i) => i !== index)
    })
  }

  const applyFilters = async () => {
    try {
      // Build filter parameters, only include non-empty values
      const filterParams: any = {
        year,
        department
      }
      
      // Only add filters that have values
      if (filters.willingToPlace.length > 0) filterParams.willingToPlace = filters.willingToPlace.join(',')
      if (filters.historyOfArrears.length > 0) filterParams.historyOfArrears = filters.historyOfArrears.join(',')
      if (filters.currentArrears.length > 0) filterParams.currentArrears = filters.currentArrears.join(',')
      if (filters.cgpaRange) filterParams.cgpaRange = filters.cgpaRange
      if (filters.gender) filterParams.gender = filters.gender
      if (filters.technicalSkills.length > 0) filterParams.technicalSkills = filters.technicalSkills.join(',')
      if (filters.softSkills.length > 0) filterParams.softSkills = filters.softSkills.join(',')
      if (filters.hscPercentage) filterParams.hscPercentage = filters.hscPercentage
      if (filters.sslcPercentage) filterParams.sslcPercentage = filters.sslcPercentage
      if (filters.hasInternship.length > 0) filterParams.hasInternship = filters.hasInternship.join(',')
      if (filters.hasProjects.length > 0) filterParams.hasProjects = filters.hasProjects.join(',')
      if (filters.hasCertifications.length > 0) filterParams.hasCertifications = filters.hasCertifications.join(',')
      if (filters.currentSemester) filterParams.currentSemester = filters.currentSemester
      
      console.log('Applying filters with params:', filterParams)
      
      const { data } = await api.get('/admin/students/filter', { params: filterParams })
      console.log('Filter results:', data)
      
      setFilteredRows(data)
      setIsFiltered(true)
      setShowFilterModal(false)
      setShowFilterSuccessPopup(true)
      
      // Clear search query when applying filters
      setQuery('')
    } catch (error) {
      console.error('Failed to apply filters:', error)
      showErrorMessage('Failed to apply filters')
    }
  }

  const clearFilters = () => {
    setFilters({
      willingToPlace: [],
      historyOfArrears: [],
      currentArrears: [],
      cgpaRange: '',
      technicalSkills: [],
      softSkills: [],
      gender: '',
      year: '',
      department: '',
      hscPercentage: '',
      sslcPercentage: '',
      hasInternship: [],
      hasProjects: [],
      hasCertifications: [],
      currentSemester: ''
    })
    setFilteredRows([])
    setIsFiltered(false)
    setQuery('')
    setShowFilterModal(false)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allStudentIds = new Set(searchFilteredRows.map(s => s._id))
      setSelectedStudents(allStudentIds)
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleEnterDeleteMode = () => {
    setIsDeleteMode(true)
    setSelectedStudents(new Set())
  }

  const handleExitDeleteMode = () => {
    setIsDeleteMode(false)
    setSelectedStudents(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedStudents.size === 0) return
    setShowBulkDeleteModal(true)
  }

  const confirmBulkDelete = () => {
    setShowBulkDeleteModal(false)
    setShowAdminVerificationModal(true)
  }

  const verifyAdminAndDelete = async () => {
    if (!adminCredentials.username || !adminCredentials.password) {
      showErrorMessage('Please enter both username and password')
      return
    }

    setIsDeleting(true)
    try {
      // First verify admin credentials
      const verifyResponse = await api.post('/admin/verify', {
        username: adminCredentials.username,
        password: adminCredentials.password
      })

      if (!verifyResponse.data.valid) {
        showErrorMessage('Invalid admin credentials')
        setIsDeleting(false)
        return
      }

      // If verification successful, proceed with bulk delete
      const studentIds = Array.from(selectedStudents)
      await api.post('/admin/students/bulk-delete', {
        studentIds,
        year,
        department
      })

      // Refresh the student list
      const { data } = await api.get('/admin/students', { params: { year, department } })
      const sortedData = data.sort((a: any, b: any) => {
        return a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true })
      })
      setRows(sortedData)
      setSelectedStudents(new Set())
      setIsDeleteMode(false)
      showSuccessMessage(`Successfully deleted ${studentIds.length} student(s)`)
      setShowAdminVerificationModal(false)
      setAdminCredentials({ username: '', password: '' })
    } catch (error) {
      console.error('Failed to delete students:', error)
      showErrorMessage('Failed to delete students. Please check credentials and try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false)
    setShowAdminVerificationModal(false)
    setAdminCredentials({ username: '', password: '' })
    setIsDeleteMode(false)
    setSelectedStudents(new Set())
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
  
  // Use filtered results if filters are applied, otherwise use original rows
  const dataToSearch = isFiltered ? filteredRows : rows
  const searchFilteredRows = qNorm
    ? dataToSearch.filter(s => {
        const name = normalized(s.name)
        const reg = normalized(s.registerNumber)
        return name.includes(qNorm) || reg.includes(qNorm)
      })
    : dataToSearch

  return (
    <>
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
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

        {/* Search and Filter */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#93c5fd" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span className="font-semibold text-neutral-200">Search Students</span>
          </div>
          
          {/* Search Input - Full Width on Mobile */}
          <div className="mb-3">
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

          {/* Action Buttons - Single Row Layout */}
          <div className="flex flex-wrap gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-purple-700 text-purple-200 bg-transparent hover:bg-purple-900/30 hover:text-purple-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#111]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
              </svg>
              Filter
            </button>
            
            {/* Clear Button */}
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-red-700 text-red-200 bg-transparent hover:bg-red-900/30 hover:text-red-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear
              </button>
            )}
            
            {/* Delete Mode Buttons */}
            {!isDeleteMode ? (
              <button
                onClick={handleEnterDeleteMode}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-red-700 text-red-200 bg-transparent hover:bg-red-900/30 hover:text-red-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                </svg>
                Delete Students
              </button>
            ) : (
              <div className="flex gap-2">
                {selectedStudents.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-red-700 text-red-200 bg-red-900/20 hover:bg-red-900/40 hover:text-red-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    </svg>
                    <span className="hidden xs:inline">Delete Selected ({selectedStudents.size})</span>
                    <span className="xs:hidden">Delete ({selectedStudents.size})</span>
                  </button>
                )}
                <button
                  onClick={handleExitDeleteMode}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-gray-700 text-gray-200 bg-transparent hover:bg-gray-900/30 hover:text-gray-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#111]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Mode Message - Above Table */}
      {isDeleteMode && (
        <div className="mb-4 p-3 rounded-lg border border-blue-800 bg-blue-900/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-300">Select students to delete</span>
          </div>
        </div>
      )}

      <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
        {/* Desktop Table Header */}
        <div className={`hidden sm:grid p-4 border-b border-neutral-800 text-sm font-medium text-neutral-300 bg-neutral-800 ${isDeleteMode ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <div>Register Number</div>
          <div>Student Name</div>
          <div>Actions</div>
          {isDeleteMode && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedStudents.size > 0 && selectedStudents.size === searchFilteredRows.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span>Select All</span>
            </div>
          )}
        </div>

        {/* Mobile Delete Mode Header */}
        {isDeleteMode && (
          <div className="sm:hidden p-4 border-b border-neutral-800 bg-neutral-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size > 0 && selectedStudents.size === searchFilteredRows.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-base font-medium text-neutral-300">Select All Students</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-400">
                    {selectedStudents.size} of {searchFilteredRows.length}
                  </div>
                  <div className="text-xs text-neutral-400">selected</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {searchFilteredRows.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-neutral-400">
            <div className="text-base sm:text-lg mb-2">No students found</div>
            <div className="text-xs sm:text-sm">Try clearing the search or check different filters</div>
          </div>
        ) : (
          searchFilteredRows.map((s, index) => (
            <div key={s._id}>
              {/* Desktop Layout */}
              <div className={`hidden sm:grid p-4 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0 ${isDeleteMode ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
                  {!isDeleteMode && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteStudent(s._id, s.name)
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {isDeleteMode && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(s._id)}
                      onChange={(e) => handleSelectStudent(s._id, e.target.checked)}
                      className="rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                )}
              </div>

              {/* Mobile Layout */}
              <div className="sm:hidden p-4 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0">
                <div className="space-y-3">
                  {/* Student Info */}
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
                        className="text-white text-base font-medium hover:text-neutral-300 block truncate"
                      >
                        {s.name}
                      </Link>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isDeleteMode ? (
                        <div className="flex gap-1">
                          <Link
                            to={`/admin/students/${s._id}`}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium text-center min-w-[55px]"
                          >
                            View
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteStudent(s._id, s.name)
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium min-w-[45px]"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/students/${s._id}`}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium text-center min-w-[45px]"
                          >
                            View
                          </Link>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(s._id)}
                              onChange={(e) => handleSelectStudent(s._id, e.target.checked)}
                              className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-xs text-neutral-400">Select</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Line separator between students (except for the last one) */}
              {index < searchFilteredRows.length - 1 && (
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

        </div>
      </div>
      <Footer />
      <LogoutSuccessPopup show={showLogoutPopup} onClose={handleCloseLogoutPopup} />
      <FilterSuccessPopup show={showFilterSuccessPopup} onClose={handleCloseFilterSuccessPopup} />
      <SuccessPopup show={showSuccessPopup} onClose={handleCloseSuccessPopup} message={popupMessage} />
      <ErrorPopup show={showErrorPopup} onClose={handleCloseErrorPopup} message={popupMessage} />
      
            {/* Filter Modal */}
            {showFilterModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[95vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Filter Students</h3>
                    <button
                      onClick={() => setShowFilterModal(false)}
                      className="text-neutral-400 hover:text-white text-xl sm:text-2xl"
                    >
                      ×
                    </button>
                  </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Placement Willingness */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Placement Willingness</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="willingToPlace"
                      checked={filters.willingToPlace.includes('true')}
                      onClick={() => {
                        if (filters.willingToPlace.includes('true')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, willingToPlace: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, willingToPlace: ['true'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Willing to Place</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="willingToPlace"
                      checked={filters.willingToPlace.includes('false')}
                      onClick={() => {
                        if (filters.willingToPlace.includes('false')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, willingToPlace: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, willingToPlace: ['false'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Not Willing to Place</span>
                  </label>
                </div>
              </div>

              {/* History of Arrears */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">History of Arrears</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="historyOfArrears"
                      checked={filters.historyOfArrears.includes('none')}
                      onClick={() => {
                        if (filters.historyOfArrears.includes('none')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, historyOfArrears: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, historyOfArrears: ['none'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Arrears</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="historyOfArrears"
                      checked={filters.historyOfArrears.includes('has')}
                      onClick={() => {
                        if (filters.historyOfArrears.includes('has')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, historyOfArrears: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, historyOfArrears: ['has'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Arrears</span>
                  </label>
                </div>
              </div>

              {/* Current Arrears */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Current Arrears</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="currentArrears"
                      checked={filters.currentArrears.includes('none')}
                      onClick={() => {
                        if (filters.currentArrears.includes('none')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, currentArrears: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, currentArrears: ['none'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Current Arrears</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="currentArrears"
                      checked={filters.currentArrears.includes('has')}
                      onClick={() => {
                        if (filters.currentArrears.includes('has')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, currentArrears: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, currentArrears: ['has'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Current Arrears</span>
                  </label>
                </div>
              </div>

              {/* CGPA Range */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">CGPA Range</label>
                <select
                  value={filters.cgpaRange}
                  onChange={(e) => setFilters({ ...filters, cgpaRange: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select CGPA Range</option>
                  <option value="9.0+">9.0 and above</option>
                  <option value="8.5+">8.5 and above</option>
                  <option value="8.0+">8.0 and above</option>
                  <option value="7.5+">7.5 and above</option>
                  <option value="7.0+">7.0 and above</option>
                  <option value="6.5+">6.5 and above</option>
                  <option value="6.0+">6.0 and above</option>
                  <option value="5.5+">5.5 and above</option>
                  <option value="5.0+">5.0 and above</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Technical Skills */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Technical Skills</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempSkill.technical}
                      onChange={(e) => setTempSkill({ ...tempSkill, technical: e.target.value })}
                      placeholder="Add technical skill"
                      className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill('technical')
                        }
                      }}
                    />
                    <button
                      onClick={() => addSkill('technical')}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs sm:text-sm whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.technicalSkills.map((skill, index) => (
                      <span key={index} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded">
                        {skill}
                        <button
                          onClick={() => removeSkill('technical', index)}
                          className="ml-1 text-blue-200 hover:text-white text-sm"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Soft Skills */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Soft Skills</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempSkill.soft}
                      onChange={(e) => setTempSkill({ ...tempSkill, soft: e.target.value })}
                      placeholder="Add soft skill"
                      className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill('soft')
                        }
                      }}
                    />
                    <button
                      onClick={() => addSkill('soft')}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs sm:text-sm whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.softSkills.map((skill, index) => (
                      <span key={index} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs sm:text-sm rounded">
                        {skill}
                        <button
                          onClick={() => removeSkill('soft', index)}
                          className="ml-1 text-green-200 hover:text-white text-sm"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* HSC Percentage */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">HSC Percentage</label>
                <select
                  value={filters.hscPercentage}
                  onChange={(e) => setFilters({ ...filters, hscPercentage: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select HSC Percentage</option>
                  <option value="95+">95% and above</option>
                  <option value="90+">90% and above</option>
                  <option value="85+">85% and above</option>
                  <option value="80+">80% and above</option>
                  <option value="75+">75% and above</option>
                  <option value="70+">70% and above</option>
                  <option value="65+">65% and above</option>
                  <option value="60+">60% and above</option>
                </select>
              </div>

              {/* SSLC Percentage */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">SSLC Percentage</label>
                <select
                  value={filters.sslcPercentage}
                  onChange={(e) => setFilters({ ...filters, sslcPercentage: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select SSLC Percentage</option>
                  <option value="95+">95% and above</option>
                  <option value="90+">90% and above</option>
                  <option value="85+">85% and above</option>
                  <option value="80+">80% and above</option>
                  <option value="75+">75% and above</option>
                  <option value="70+">70% and above</option>
                  <option value="65+">65% and above</option>
                  <option value="60+">60% and above</option>
                </select>
              </div>

              {/* Has Internship */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Internship Experience</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasInternship"
                      checked={filters.hasInternship.includes('yes')}
                      onClick={() => {
                        if (filters.hasInternship.includes('yes')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasInternship: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasInternship: ['yes'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Internship</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasInternship"
                      checked={filters.hasInternship.includes('no')}
                      onClick={() => {
                        if (filters.hasInternship.includes('no')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasInternship: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasInternship: ['no'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Internship</span>
                  </label>
                </div>
              </div>

              {/* Has Projects */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Projects</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasProjects"
                      checked={filters.hasProjects.includes('yes')}
                      onClick={() => {
                        if (filters.hasProjects.includes('yes')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasProjects: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasProjects: ['yes'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Projects</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasProjects"
                      checked={filters.hasProjects.includes('no')}
                      onClick={() => {
                        if (filters.hasProjects.includes('no')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasProjects: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasProjects: ['no'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Projects</span>
                  </label>
                </div>
              </div>

              {/* Has Certifications */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Certifications</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCertifications"
                      checked={filters.hasCertifications.includes('yes')}
                      onClick={() => {
                        if (filters.hasCertifications.includes('yes')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasCertifications: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasCertifications: ['yes'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Certifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCertifications"
                      checked={filters.hasCertifications.includes('no')}
                      onClick={() => {
                        if (filters.hasCertifications.includes('no')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasCertifications: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasCertifications: ['no'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Certifications</span>
                  </label>
                </div>
              </div>

              {/* Current Semester */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Current Semester</label>
                <select
                  value={filters.currentSemester}
                  onChange={(e) => setFilters({ ...filters, currentSemester: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 border-t border-neutral-700">
              <button
                onClick={applyFilters}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md text-sm font-medium"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Confirm Bulk Delete</h3>
            <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{selectedStudents.size} student(s)</span> from {department} Department, {year} Year? 
              This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={cancelBulkDelete}
                className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2"
              >
                Continue to Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Verification Modal */}
      {showAdminVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Admin Verification Required</h3>
            <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
              Please enter your admin credentials to confirm deletion of {selectedStudents.size} student(s).
            </p>
            
            <div className="space-y-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                  placeholder="Enter admin username"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                <PasswordInput
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={cancelBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={verifyAdminAndDelete}
                disabled={isDeleting || !adminCredentials.username || !adminCredentials.password}
                className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Delete Students'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}



