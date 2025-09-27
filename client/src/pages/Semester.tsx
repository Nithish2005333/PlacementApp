import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Footer from '../components/Footer'
import LogoutSuccessPopup from '../components/LogoutSuccessPopup'
import api from '../lib/api'

type Subject = {
  subjectName: string
  subjectCode: string
  credits: number
  grade: string
}

type Semester = {
  semesterNumber: number
  subjects: Subject[]
  sgpa: number
  totalCredits: number
}

export default function Semester() {
  const navigate = useNavigate()
  const [student, setStudent] = useState<any>(null)
  const [selectedSemester, setSelectedSemester] = useState<number>(1)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showLogoutPopup, setShowLogoutPopup] = useState(false)

  const allowedGrades: string[] = ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA']

  // Grade points mapping (Anna University CBCS system)
  const gradePoints: { [key: string]: number } = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'RA': 0
  }

  // Calculate SGPA based on subjects
  const calculateSGPA = (subjects: Subject[]): number => {
    if (!subjects || subjects.length === 0) return 0
    
    let totalGradePoints = 0
    let totalCredits = 0
    
    subjects.forEach(subject => {
      const credits = Number(subject.credits) || 0
      const grade = subject.grade
      
      if (credits > 0 && grade && gradePoints[grade] !== undefined) {
        totalGradePoints += gradePoints[grade] * credits
        totalCredits += credits
      }
    })
    
    return totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0
  }

  const fetchStudentData = async () => {
    try {
      console.log('Fetching student data...')
      const { data } = await api.get('/students/me')
      console.log('Student data fetched:', data)
      setStudent(data)
    } catch (e: any) {
      console.error('Error fetching student data:', e)
      if (e.response?.status === 401) navigate('/login')
    }
  }

  useEffect(() => {
    fetchStudentData()
  }, [navigate])

  const getCurrentSemester = (): Semester => {
    if (!student?.academic?.semesters) {
      return {
        semesterNumber: selectedSemester,
        subjects: [],
        sgpa: 0,
        totalCredits: 0
      }
    }
    
    const existing = student.academic.semesters.find((s: Semester) => s.semesterNumber === selectedSemester)
    if (existing) return existing

    return {
      semesterNumber: selectedSemester,
      subjects: [],
      sgpa: 0,
      totalCredits: 0
    }
  }

  const addSubject = () => {
    const currentSemester = getCurrentSemester()
    const newSubject: Subject = {
      subjectName: '',
      subjectCode: '',
      credits: 0,
      grade: ''
    }

    const updatedSemesters = [...(student.academic.semesters || [])]
    const semesterIndex = updatedSemesters.findIndex(s => s.semesterNumber === selectedSemester)
    
    if (semesterIndex >= 0) {
      updatedSemesters[semesterIndex].subjects.push(newSubject)
    } else {
      updatedSemesters.push({
        ...currentSemester,
        subjects: [...currentSemester.subjects, newSubject]
      })
    }

    setStudent({
      ...student,
      academic: {
        ...student.academic,
        semesters: updatedSemesters
      }
    })
  }

  const updateSubject = (subjectIndex: number, field: keyof Subject, value: any) => {
    const updatedSemesters = [...(student.academic.semesters || [])]
    const semesterIndex = updatedSemesters.findIndex(s => s.semesterNumber === selectedSemester)
    
    if (semesterIndex >= 0) {
      updatedSemesters[semesterIndex].subjects[subjectIndex] = {
        ...updatedSemesters[semesterIndex].subjects[subjectIndex],
        [field]: value
      }
      
      // Recalculate total credits and SGPA
      const semester = updatedSemesters[semesterIndex]
      const totalCredits = semester.subjects.reduce((sum: number, sub: Subject) => sum + (Number(sub.credits) || 0), 0)
      const sgpa = calculateSGPA(semester.subjects)
      
      updatedSemesters[semesterIndex] = { 
        ...semester, 
        totalCredits,
        sgpa
      }
    }

    setStudent({
      ...student,
      academic: {
        ...student.academic,
        semesters: updatedSemesters
      }
    })
  }

  const removeSubject = (subjectIndex: number) => {
    const updatedSemesters = [...(student.academic.semesters || [])]
    const semesterIndex = updatedSemesters.findIndex(s => s.semesterNumber === selectedSemester)
    
    if (semesterIndex >= 0) {
      updatedSemesters[semesterIndex].subjects.splice(subjectIndex, 1)
      
      // Recalculate total credits and SGPA
      const semester = updatedSemesters[semesterIndex]
      const totalCredits = semester.subjects.reduce((sum: number, sub: Subject) => sum + (Number(sub.credits) || 0), 0)
      const sgpa = calculateSGPA(semester.subjects)
      
      updatedSemesters[semesterIndex] = { 
        ...semester, 
        totalCredits,
        sgpa
      }
    }

    setStudent({
      ...student,
      academic: {
        ...student.academic,
        semesters: updatedSemesters
      }
    })
  }

  const saveSemester = async () => {
    setSaving(true)
    setError(null)
    try {
      // Build minimal, sanitized payload: only semesters under academic
      // Normalize semesters and compute totalCredits per semester
      const semesters = (student?.academic?.semesters || []).map((sem: any) => {
        const subjects = (sem.subjects || []).map((sub: any) => ({
          subjectName: String(sub.subjectName || ''),
          subjectCode: String(sub.subjectCode || ''),
          credits: Number(sub.credits || 0),
          grade: String(sub.grade || '')
        }))
        const totalCredits = subjects.reduce((sum: number, s: any) => sum + (Number(s.credits) || 0), 0)
        return {
          semesterNumber: Number(sem.semesterNumber),
          subjects,
          sgpa: Number(sem.sgpa || 0),
          totalCredits: Number(totalCredits || 0)
        }
      })
      // Compute CGPA (credit-weighted mean of SGPA where credits > 0)
      const cgpaDen = semesters.reduce((sum: number, sem: any) => sum + (sem.totalCredits || 0), 0)
      const cgpaNum = semesters.reduce((sum: number, sem: any) => sum + ((sem.sgpa || 0) * (sem.totalCredits || 0)), 0)
      const cgpa = cgpaDen > 0 ? Number((cgpaNum / cgpaDen).toFixed(2)) : 0

      const { data } = await api.put('/students/me', { academic: { semesters } })
      setStudent(data)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
    } catch (e: any) {
      setError('Failed to save semester data')
    } finally {
      setSaving(false)
    }
  }

  const currentSemester = getCurrentSemester()


  const content = (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 pt-1 sm:pt-2 px-4 sm:px-6">
      {saved && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pointer-events-none">
          <div className="mt-6 px-4 sm:px-6">
            <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-emerald-600/95 shadow-lg ring-1 ring-emerald-400/40 px-4 py-3 text-white animate-[fadein_.15s_ease-out]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.69a.75.75 0 0 0-1.22-.86l-3.82 5.43-1.77-1.77a.75.75 0 1 0-1.06 1.06l2.4 2.4c.33.33.87.29 1.14-.08l5.39-6.18Z" clipRule="evenodd"/></svg>
              <div className="text-sm font-medium">Semester saved</div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white py-4 rounded-md gap-4">
        <div className="font-bold text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Placement App</div>
        <button onClick={() => { localStorage.removeItem('token'); setShowLogoutPopup(true) }} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-md sm:ml-auto">Logout</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 flex-1 min-h-0">
        <nav className="w-full lg:w-64 bg-[#202020] rounded-none p-2 sticky top-0 self-start z-10 overflow-y-auto max-h-screen">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile">Profile</Link></li>
            <li><span className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600">Semester</span></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/resume">Resume</Link></li>
          </ul>
        </nav>

        <section className="flex-1 lg:ml-2 bg-[#181818] rounded-md p-3 mt-auto sm:p-4">
          <div className="bg-[#242424] rounded-md p-3 border border-neutral-800">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <img className="w-24 h-32 sm:w-32 sm:h-44 rounded-full object-cover border-4 border-sky-500" src={student?.profilePhoto || 'https://via.placeholder.com/160x120'} alt="Student image" />
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold">{student?.name || 'Loading...'}</h1>
                  <div className="text-sm sm:text-lg text-neutral-400 mb-2">
                    <span className="inline-block">{student?.registerNumber} • </span>
                    <span className="inline-block whitespace-nowrap">{student?.department} • {(() => { const y = (student?.year || '').toString(); return y.toLowerCase() === 'fourth' ? 'Final Year' : y; })()}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${student?.placement?.willingToPlace ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                      {student?.placement?.willingToPlace ? '✓ Willing to Place' : '✗ Not Willing to Place'}
                    </span>
                    {student?.placement?.placementPreference && (
                      <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-600 text-white">
                        {student.placement.placementPreference}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Semester Management</h2>
                  <p className="text-neutral-400">Select a semester to manage your academic records</p>
                </div>
                <button
                  onClick={fetchStudentData}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Semester Cards Grid */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mb-8">
              {[1,2,3,4,5,6,7,8].map(sem => {
                const semesterData = student?.academic?.semesters?.find((s: Semester) => s.semesterNumber === sem)
                const isSelected = selectedSemester === sem
                const hasData = semesterData && semesterData.subjects.length > 0
                
                return (
                  <div
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 h-24 sm:h-28 flex items-center justify-center ${
                      isSelected 
                        ? 'border-sky-500 bg-sky-500/10' 
                        : 'border-neutral-600 bg-neutral-800 hover:border-sky-400 hover:bg-neutral-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-1 ${
                        isSelected ? 'text-sky-400' : 'text-white'
                      }`}>
                        Sem {sem}
                      </div>
                      {hasData && (
                        <div className="text-xs text-green-400">
                          SGPA: {semesterData.sgpa.toFixed(2)}
                        </div>
                      )}
                      {hasData && (
                        <div className="text-xs text-neutral-400">
                          {semesterData.subjects.length} subjects
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Semester Details */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Semester {selectedSemester} Details</h2>
                  <p className="text-neutral-400">Manage subjects and grades for this semester</p>
                </div>
                {!editing && (
                  <button 
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-sky-500 text-sky-300 hover:text-white bg-transparent hover:bg-sky-600/20 text-sm sm:text-base font-medium transition-colors text-center">✎ Edit Semester
                  </button>
                )}
              </div>

              <div className="p-4 bg-[#1f1f1f] rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-sky-400">{(currentSemester.sgpa || 0).toFixed(2)}</div>
                    <div className="text-sm text-neutral-400">SGPA (Auto-calculated)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{currentSemester.totalCredits || 0}</div>
                    <div className="text-sm text-neutral-400">Total Credits</div>
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="text-red-400 text-sm mb-4 p-2 bg-red-900/20 rounded">{error}</div>}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Subjects</h2>
                {editing && (
                  <button 
                    onClick={addSubject}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm"
                  >
                    + Add Subject
                  </button>
                )}
              </div>

              {currentSemester.subjects.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <div className="text-lg mb-2">No subjects added</div>
                  <div className="text-sm">Click "Add Subject" to start adding subjects for this semester</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSemester.subjects.map((subject, index) => (
                    <div key={index} className="bg-[#1f1f1f] rounded-md p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div>
                          <label className="text-sm text-neutral-400">Subject Name</label>
                          {editing ? (
                            <input 
                              type="text"
                              value={subject.subjectName}
                              onChange={(e) => updateSubject(index, 'subjectName', e.target.value)}
                              className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                              placeholder="Enter subject name"
                            />
                          ) : (
                            <div className="text-white">{subject.subjectName || '-'}</div>
                          )}
                        </div>
                        <div>
                          <label className="text-sm text-neutral-400">Subject Code</label>
                          {editing ? (
                            <input 
                              type="text"
                              value={subject.subjectCode}
                              onChange={(e) => updateSubject(index, 'subjectCode', e.target.value)}
                              className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                              placeholder="Enter subject code"
                            />
                          ) : (
                            <div className="text-white font-mono">{subject.subjectCode || '-'}</div>
                          )}
                        </div>
                        <div>
                          <label className="text-sm text-neutral-400">Credits</label>
                          {editing ? (
                            <select 
                              value={String(subject.credits)}
                              onChange={(e) => updateSubject(index, 'credits', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                            >
                              {Array.from({ length: 21 }, (_, i) => i / 2).map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-white">{subject.credits || '-'}</div>
                          )}
                        </div>
                        <div>
                          <label className="text-sm text-neutral-400">Grade</label>
                          {editing ? (
                            <select 
                              value={subject.grade}
                              onChange={(e) => updateSubject(index, 'grade', e.target.value)}
                              className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                            >
                              <option value="">Select Grade</option>
                              {allowedGrades.map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-white font-bold">{subject.grade || '-'}</div>
                          )}
                        </div>
                        <div className="flex items-end">
                          {editing ? (
                            <button 
                              onClick={() => removeSubject(index)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                            >
                              Remove
                            </button>
                          ) : (
                            <div className="text-sm text-neutral-400">&nbsp;</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editing && (
                <div className="flex gap-3 pt-4 border-t border-neutral-700">
                  <button 
                    onClick={saveSemester}
                    disabled={saving}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-md"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  const handleCloseLogoutPopup = () => {
    setShowLogoutPopup(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {content}
      <Footer />
      <LogoutSuccessPopup show={showLogoutPopup} onClose={handleCloseLogoutPopup} />
    </div>
  )
}
