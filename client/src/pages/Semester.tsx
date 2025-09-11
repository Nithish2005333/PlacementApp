import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

  const allowedGrades: string[] = ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA']

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/students/me')
        setStudent(data)
      } catch (e: any) {
        if (e.response?.status === 401) navigate('/login')
      }
    })()
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
      // Only recalc total credits
      const semester = updatedSemesters[semesterIndex]
      const totalCredits = semester.subjects.reduce((sum: number, sub: Subject) => sum + (Number(sub.credits) || 0), 0)
      updatedSemesters[semesterIndex] = { ...semester, totalCredits }
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
      const semester = updatedSemesters[semesterIndex]
      const totalCredits = semester.subjects.reduce((sum: number, sub: Subject) => sum + (Number(sub.credits) || 0), 0)
      updatedSemesters[semesterIndex] = { ...semester, totalCredits }
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
      await api.put('/students/me', student)
      setEditing(false)
    } catch (e: any) {
      setError('Failed to save semester data')
    } finally {
      setSaving(false)
    }
  }

  const currentSemester = getCurrentSemester()

  const content = (
    <div className="space-y-6 mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-4 sm:px-6 py-4 rounded-md gap-4">
        <div className="font-semibold">Semester Management</div>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-md w-full sm:w-auto">Logout</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile">Profile</Link></li>
            <li><span className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600">Semester</span></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/resume">Resume</Link></li>
          </ul>
        </nav>

        <section className="flex-1 bg-[#181818] rounded-md p-4 sm:p-6">
          <div className="bg-[#242424] rounded-md p-4 border border-neutral-800">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Semester Management</h1>
              <p className="text-neutral-400">Select a semester to manage your academic records</p>
            </div>

            {/* Semester Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {[1,2,3,4,5,6,7,8].map(sem => {
                const semesterData = student?.academic?.semesters?.find((s: Semester) => s.semesterNumber === sem)
                const isSelected = selectedSemester === sem
                const hasData = semesterData && semesterData.subjects.length > 0
                
                return (
                  <div
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 h-28 flex items-center justify-center ${
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
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md mt-4 sm:mt-0"
                  >
                    Edit Semester
                  </button>
                )}
              </div>

              <div className="p-4 bg-[#1f1f1f] rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  <div>
                    {editing ? (
                      <div className="flex flex-col items-center gap-2">
                        <label className="text-sm text-neutral-400">SGPA</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={currentSemester.sgpa || 0}
                          onChange={(e) => {
                            const updatedSemesters = [...(student.academic.semesters || [])]
                            const semesterIndex = updatedSemesters.findIndex((s: Semester) => s.semesterNumber === selectedSemester)
                            if (semesterIndex >= 0) {
                              updatedSemesters[semesterIndex].sgpa = Number(e.target.value)
                            } else {
                              updatedSemesters.push({ ...currentSemester, sgpa: Number(e.target.value) })
                            }
                            setStudent({ ...student, academic: { ...student.academic, semesters: updatedSemesters } })
                          }}
                          className="w-40 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-center"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-sky-400">{(currentSemester.sgpa || 0).toFixed(2)}</div>
                        <div className="text-sm text-neutral-400">SGPA</div>
                      </>
                    )}
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
                            <input 
                              type="number"
                              value={subject.credits}
                              onChange={(e) => updateSubject(index, 'credits', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                              min="0"
                              step="0.5"
                            />
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

  return <div className="max-w-7xl mx-auto p-4">{content}</div>
}
