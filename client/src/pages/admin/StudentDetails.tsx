import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'

export default function StudentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [s, setS] = useState<any | null>(null)
  const [activeSection, setActiveSection] = useState<'profile' | 'semester' | 'resume'>('profile')
  const [selectedSemester, setSelectedSemester] = useState<number>(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMessage, setShowMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/admin/login', { replace: true })
  }

  const handleDeleteStudent = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!s || !id) return

    try {
      await api.delete(`/admin/students/${id}`)
      setShowMessage({ type: 'success', text: 'Student deleted successfully' })
      setShowDeleteModal(false)
      
      // Navigate back after showing success message
      setTimeout(() => {
        navigate(-1)
      }, 1500)
    } catch (error) {
      console.error('Failed to delete student:', error)
      setShowMessage({ type: 'error', text: 'Failed to delete student' })
      setShowDeleteModal(false)
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => setShowMessage(null), 5000)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/students/${id}`)
        setS(data)
      } catch (error) {
        console.error('Failed to fetch student details:', error)
        // Could add error state here if needed
      }
    })()
  }, [id])

  if (!s) return <div className="p-6">Loading...</div>

  const renderProfileSection = () => (
    <div className="space-y-3">
      <div className="bg-[#1f1f1f] rounded-md p-3">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 pl-3 border-l-4 border-sky-600">Personal details</h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-sm">
            <colgroup>
              <col className="w-32 sm:w-44" />
              <col />
            </colgroup>
            <tbody className="divide-y divide-neutral-800">
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Name</td><td className="py-1 text-neutral-200 break-words break-all">{s?.name ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Register Number</td><td className="py-1 text-neutral-200 break-words break-all">{s?.registerNumber ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">College</td><td className="py-1 text-neutral-200 break-words break-all">{s?.collegeName || 'Anna University regional campus, Coimbatore'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Department</td><td className="py-1 text-neutral-200 break-words break-all">{s?.department ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Year</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const y=(s?.year||'').toString(); return y.toLowerCase()==='fourth' ? 'Final Year' : y; })()}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Current Semester</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const cs = (s?.academic?.currentSemester ?? s?.currentSemester); return (cs === undefined || cs === null || cs === 0 || cs === '') ? '-' : cs; })()}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Email</td><td className="py-1 text-neutral-200 break-words break-all">{s?.email ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Phone</td><td className="py-1 text-neutral-200 break-words break-all">{s?.phone ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Gender</td><td className="py-1 text-neutral-200 break-words break-all">{s?.gender ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Birth Date</td><td className="py-1 text-neutral-200 break-words break-all">{s?.dob ? (() => { const dt = new Date(s.dob); if (isNaN(dt.getTime())) return '-'; const dd = String(dt.getDate()).padStart(2,'0'); const mm = String(dt.getMonth()+1).padStart(2,'0'); const yyyy = dt.getFullYear(); return `${dd}-${mm}-${yyyy}` })() : '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Address</td><td className="py-1 text-neutral-200 break-words break-all">{s?.address ?? '-'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#1f1f1f] rounded-md p-3">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 pl-3 border-l-4 border-emerald-600">Academic details</h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-sm">
            <colgroup>
              <col className="w-32 sm:w-44" />
              <col />
            </colgroup>
            <tbody className="divide-y divide-neutral-800">
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">CGPA</td><td className="py-1 text-neutral-200 break-words break-all">{s?.academic?.cgpa ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">HSC %</td><td className="py-1 text-neutral-200 break-words break-all">{s?.academic?.hscPercentage ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">SSLC %</td><td className="py-1 text-neutral-200 break-words break-all">{s?.academic?.sslcPercentage ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">History of Arrears</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const v = s?.academic?.historyOfArrears; if (v === null || v === undefined || v === '') return '-'; const str = String(v).toLowerCase(); return (str === '0' || str === 'none') ? 'None' : v; })()}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Current Arrears</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const v = s?.academic?.currentArrears; if (v === null || v === undefined || v === '') return '-'; const str = String(v).toLowerCase(); return (str === '0' || str === 'none') ? 'None' : v; })()}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#1f1f1f] rounded-md p-3">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 pl-3 border-l-4 border-rose-600">Placement Details</h2>
        <p className="text-neutral-200"><span className="text-neutral-400 mr-2">Status</span>{s?.placement?.willingToPlace ? 'Willing to Place' : 'Not Willing to Place'}</p>
      </div>

      <div className="bg-[#1f1f1f] rounded-md p-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 pl-3 border-l-4 border-sky-600">Skills</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
            <div className="text-sm font-semibold mb-2 border-b border-blue-600 text-blue-400">Technical Skills</div>
            <div className="flex flex-wrap gap-2">
              {s?.placement?.technicalSkills?.length > 0 ? (
                s.placement.technicalSkills.map((skill: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-600 text-white text-sm rounded-md">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-neutral-400">No technical skills added</span>
              )}
            </div>
          </div>
          <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
            <div className="text-sm font-semibold mb-2 border-b border-green-600 text-green-400">Soft Skills</div>
            <div className="flex flex-wrap gap-2">
              {s?.placement?.logicalSkills?.length > 0 ? (
                s.placement.logicalSkills.map((skill: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-green-600 text-white text-sm rounded-md">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-neutral-400">No soft skills added</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1f1f1f] rounded-md p-3">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 pl-3 border-l-4 border-amber-500">Highlights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
            <div className="text-sm font-semibold mb-2 border-b border-violet-600 text-violet-400">Certificates</div>
            {(() => {
              const raw = (s?.placement?.certifications || '').toString();
              const parts = raw
                .split(/\r?\n|\u2022/)
                .map((t: string) => t.replace(/^\s*[-*•]\s+/, '').trim())
                .filter(Boolean);
              if (!parts.length) return <div className="text-sm text-neutral-400">No certificates added</div>;
              return (
                <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-300 break-words leading-relaxed marker:font-extrabold ">
                  {parts.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                </ol>
              );
            })()}
          </div>

          <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
            <div className="text-sm font-semibold mb-2 border-b border-sky-600 text-sky-400">Projects</div>
            {(() => {
              const raw = (s?.placement?.workExperience || s?.placement?.projects || '').toString();
              const parts = raw
                .split(/\r?\n|\u2022/)
                .map((t: string) => t.replace(/^\s*[-*•]\s+/, '').trim())
                .filter(Boolean);
              if (!parts.length) return <div className="text-sm text-neutral-400">No projects added</div>;
              return (
                <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-300 break-words leading-relaxed marker:font-semibold">
                  {parts.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                </ol>
              );
            })()}
          </div>

          <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
            <div className="text-sm font-semibold mb-2 border-b border-amber-500 text-amber-400">Achievements</div>
            {(() => {
              const raw = (s?.placement?.achievements || '').toString();
              const parts = raw
                .split(/\r?\n|\u2022/)
                .map((t: string) => t.replace(/^\s*[-*•]\s+/, '').trim())
                .filter(Boolean);
              if (!parts.length) return <div className="text-sm text-neutral-400">No achievements added</div>;
              return (
                <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-300 break-words leading-relaxed marker:font-semibold">
                  {parts.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                </ol>
              );
            })()}
          </div>
        </div>

        <div className="bg-[#191919] rounded-md p-3 border border-neutral-800 mt-3">
          <div className="text-sm font-semibold mb-2 border-b border-teal-600 text-teal-400">Internships</div>
          {(() => {
            const raw = (s?.placement?.internships || '').toString();
            const parts = raw
              .split(/\r?\n|\u2022/)
              .map((t: string) => t.replace(/^\s*[-*•]\s+/, '').trim())
              .filter(Boolean);
            if (!parts.length) return <div className="text-sm text-neutral-400">No internships added</div>;
            return (
              <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-300 break-words leading-relaxed marker:font-semibold">
                {parts.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
              </ol>
            );
          })()}
        </div>
      </div>

      <div className="bg-[#1f1f1f] rounded-md p-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 pl-3 border-l-4 border-cyan-500">Links</h2>
        <div className="flex flex-wrap gap-3">
          {s?.links?.resume && (
            <a
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0b3b4b] hover:bg-[#0e4a5e] text-sky-200 transition-colors"
              href={s.links.resume}
              target="_blank"
            >
              <span>📄</span>
              <span className="font-medium">Resume</span>
            </a>
          )}
          {s?.links?.portfolio && (
            <a
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#12324b] hover:bg-[#174162] text-sky-200 transition-colors"
              href={s.links.portfolio}
              target="_blank"
            >
              <span>🗂️</span>
              <span className="font-medium">Portfolio</span>
            </a>
          )}
          {s?.links?.linkedin && (
            <a
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0a2a3d] hover:bg-[#0d364c] text-sky-200 transition-colors"
              href={s.links.linkedin}
              target="_blank"
            >
              <span>🔗</span>
              <span className="font-medium">LinkedIn</span>
            </a>
          )}
          {s?.links?.github && (
            <a
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0b1f2e] hover:bg-[#0f293b] text-sky-200 transition-colors"
              href={s.links.github}
              target="_blank"
            >
              <span>🐙</span>
              <span className="font-medium">GitHub</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )

  const getCurrentSemester = () => {
    if (!s?.academic?.semesters) {
      return {
        semesterNumber: selectedSemester,
        subjects: [],
        sgpa: 0,
        totalCredits: 0
      }
    }
    
    const semester = s.academic.semesters.find((sem: any) => sem.semesterNumber === selectedSemester)
    return semester || {
      semesterNumber: selectedSemester,
      subjects: [],
      sgpa: 0,
      totalCredits: 0
    }
  }

  const renderSemesterSection = () => {
    const currentSemester = getCurrentSemester()
    
    return (
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Semester Management</h1>
        <p className="text-neutral-400">Select a semester to view academic records</p>

        {/* Semester Cards Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mb-8">
          {[1,2,3,4,5,6,7,8].map(sem => {
            const semesterData = s?.academic?.semesters?.find((x: any) => x.semesterNumber === sem)
            const isSelected = selectedSemester === sem
            const hasData = semesterData && semesterData.subjects?.length > 0
            
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
                      SGPA: {semesterData.sgpa?.toFixed(2) || '-'}
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
              <p className="text-neutral-400">View subjects and grades for this semester</p>
            </div>
          </div>

          <div className="p-4 bg-[#1f1f1f] rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-sky-400">{(currentSemester.sgpa || 0).toFixed(2)}</div>
                <div className="text-sm text-neutral-400">SGPA</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{currentSemester.totalCredits || 0}</div>
                <div className="text-sm text-neutral-400">Total Credits</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Subjects</h2>
          </div>

          {currentSemester.subjects.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              No subjects added for this semester
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentSemester.subjects.map((subject: any, index: number) => (
                <div key={index} className="p-3 bg-[#1f1f1f] rounded-md border border-neutral-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-white">{subject.subjectName || subject.name}</div>
                      <div className="text-sm text-neutral-400">{subject.subjectCode || subject.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-sky-400">{subject.grade}</div>
                      <div className="text-xs text-neutral-400">{subject.credits} credits</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Check if the resume URL can be previewed (PDF or common document formats)
  const canPreview = (url: string) => {
    if (!url) return false
    const extension = url.split('.').pop()?.toLowerCase()
    return ['pdf', 'doc', 'docx', 'txt'].includes(extension || '')
  }

  // Convert Google Drive URL to embeddable preview URL
  const getDrivePreviewUrl = (url: string) => {
    if (!url) return ''
    
    // Handle different Google Drive URL formats
    let fileId = ''
    
    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
    if (match1) {
      fileId = match1[1]
    }
    
    // Format 2: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/)
    if (match2) {
      fileId = match2[1]
    }
    
    // Format 3: https://docs.google.com/document/d/FILE_ID/edit
    const match3 = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    if (match3) {
      fileId = match3[1]
    }
    
    if (fileId) {
      // Return Google Drive embed URL
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
    
    return url
  }

  // Check if URL is from Google Drive
  const isGoogleDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com')
  }

  // Get download URL for Google Drive files
  const getDriveDownloadUrl = (url: string) => {
    if (!url) return ''
    
    let fileId = ''
    
    // Extract file ID from various Google Drive URL formats
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
    if (match1) {
      fileId = match1[1]
    }
    
    const match2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/)
    if (match2) {
      fileId = match2[1]
    }
    
    const match3 = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    if (match3) {
      fileId = match3[1]
    }
    
    if (fileId) {
      // Return Google Drive direct download URL
      return `https://drive.google.com/uc?export=download&id=${fileId}`
    }
    
    return url
  }

  // Handle download with proper filename
  const handleDownload = (url: string) => {
    const downloadUrl = isGoogleDriveUrl(url) ? getDriveDownloadUrl(url) : url
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'resume' // Default filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderResumeSection = () => (
    <div>
      {!s?.links?.resume ? (
        <div className="text-center py-12 text-neutral-300">No resume link found.</div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-[#1f1f1f] rounded-md">
            <div className="text-sm text-neutral-400 break-all">{s.links.resume}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a 
              href={s.links.resume} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md"
            >
              Open in New Tab
            </a>
            <button 
              onClick={() => handleDownload(s.links.resume)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md"
            >
              Download
            </button>
          </div>
          
          {/* Resume Preview */}
          {(canPreview(s.links.resume) || isGoogleDriveUrl(s.links.resume)) && (
            <div className="mt-4">
              <div className="bg-[#1f1f1f] rounded-md p-4">
                <h3 className="text-lg font-semibold mb-3 text-white">Resume Preview</h3>
                <div className="border border-neutral-700 rounded-md overflow-hidden">
                  <iframe
                    src={isGoogleDriveUrl(s.links.resume) ? getDrivePreviewUrl(s.links.resume) : s.links.resume}
                    className="w-full h-96 bg-white"
                    title="Resume Preview"
                    onError={() => {
                      console.error('Failed to load resume preview')
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  {isGoogleDriveUrl(s.links.resume) 
                    ? "Google Drive preview - make sure the file is set to 'Anyone with the link can view' for best results."
                    : "Note: Preview may not work for all file types or external URLs due to CORS restrictions."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const content = (
    <div className="space-y-3 pt-1 sm:pt-2 m-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-3 sm:px-4 py-4 rounded-md gap-4">
        <div className="font-bold text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Placement App</div>
        <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base"
          >
            ← Back
          </button>
          <button 
            onClick={handleDeleteStudent}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base"
          >
            Delete Student
          </button>
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm sm:text-base"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2 sticky top-2 self-start max-h-[calc(100vh-1rem)] overflow-auto z-10">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li>
              <button 
                onClick={() => setActiveSection('profile')}
                className={`block px-3 py-2 rounded w-full text-left ${
                  activeSection === 'profile' 
                    ? 'bg-[#333] text-white border-l-4 border-sky-600' 
                    : 'text-neutral-300 hover:text-white hover:bg-[#333]'
                }`}
              >
                Profile
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('semester')}
                className={`block px-3 py-2 rounded w-full text-left ${
                  activeSection === 'semester' 
                    ? 'bg-[#333] text-white border-l-4 border-sky-600' 
                    : 'text-neutral-300 hover:text-white hover:bg-[#333]'
                }`}
              >
                Semester
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('resume')}
                className={`block px-3 py-2 rounded w-full text-left ${
                  activeSection === 'resume' 
                    ? 'bg-[#333] text-white border-l-4 border-sky-600' 
                    : 'text-neutral-300 hover:text-white hover:bg-[#333]'
                }`}
              >
                Resume
              </button>
            </li>
          </ul>
        </nav>

        <section className="flex-1 bg-[#181818] rounded-md p-3 mt-auto sm:p-4">
          <div className="bg-[#242424] rounded-md p-3 border border-neutral-800">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-6">
                <img className="w-28 h-36 sm:w-32 sm:h-44 rounded-full object-cover border-4 border-sky-500" src={s?.profilePhoto || 'https://via.placeholder.com/160x120'} alt="Student image" />
                <div>
                  <h1 className="text-lg sm:text-3xl font-bold">{s?.name || 'Loading...'}</h1>
                  <div className="text-sm sm:text-lg text-neutral-400 mb-2">{s?.registerNumber} • {s?.department} • {(() => { const y=(s?.year||'').toString(); return y.toLowerCase()==='fourth' ? 'Final Year' : y; })()}</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      s?.placement?.willingToPlace 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {s?.placement?.willingToPlace ? '✓ Willing to Place' : '✗ Not Willing to Place'}
                    </span>
                    {s?.placement?.placementPreference && (
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                        {s.placement.placementPreference}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {activeSection === 'profile' && renderProfileSection()}
            {activeSection === 'semester' && renderSemesterSection()}
            {activeSection === 'resume' && renderResumeSection()}
          </div>
        </section>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-3 pt-4 sm:pt-6 pb-8">
      {content}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Confirm Delete</h3>
            <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{s?.name}</span> 
              ({s?.registerNumber})? This action cannot be undone.
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
  )
}



