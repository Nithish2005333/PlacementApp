import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Footer from '../../components/Footer'
import LogoutSuccessPopup from '../../components/LogoutSuccessPopup'
import SuccessPopup from '../../components/SuccessPopup'
import ErrorPopup from '../../components/ErrorPopup'

export default function StudentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [s, setS] = useState<any | null>(null)
  const [activeSection, setActiveSection] = useState<'profile' | 'semester' | 'resume'>('profile')
  const [selectedSemester, setSelectedSemester] = useState<number>(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [showLogoutPopup, setShowLogoutPopup] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Consistent styling for header action buttons
  const headerButtonBase = 'inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md border border-white/10 shadow-sm transition-colors active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111]';

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

  const handleDeleteStudent = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!s || !id) return

    try {
      await api.delete(`/admin/students/${id}`)
      showSuccessMessage('Student deleted successfully')
      setShowDeleteModal(false)

      // Navigate back after showing success message
      setTimeout(() => {
        navigate(-1)
      }, 1500)
    } catch (error) {
      console.error('Failed to delete student:', error)
      showErrorMessage('Failed to delete student')
      setShowDeleteModal(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
  }

  const copyToClipboard = async (text: string, linkType: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(linkType)
      setTimeout(() => setCopiedLink(null), 2000) // Clear after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedLink(linkType)
        setTimeout(() => setCopiedLink(null), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
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
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">College</td><td className="py-1 text-neutral-200 break-words">{s?.collegeName || 'Anna University regional campus, Coimbatore'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Department</td><td className="py-1 text-neutral-200 break-words break-all">{s?.department ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Year</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const y = (s?.year || '').toString(); return y.toLowerCase() === 'fourth' ? 'Final Year' : y; })()}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Current Semester</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const cs = (s?.academic?.currentSemester ?? s?.currentSemester); return (cs === undefined || cs === null || cs === 0 || cs === '') ? '-' : cs; })()}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Email</td><td className="py-1 text-neutral-200 break-words break-all">{s?.email ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Phone</td><td className="py-1 text-neutral-200 break-words break-all">{s?.phone ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Gender</td><td className="py-1 text-neutral-200 break-words break-all">{s?.gender ?? '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Birth Date</td><td className="py-1 text-neutral-200 break-words break-all">{s?.dob ? (() => { const dt = new Date(s.dob); if (isNaN(dt.getTime())) return '-'; const dd = String(dt.getDate()).padStart(2, '0'); const mm = String(dt.getMonth() + 1).padStart(2, '0'); const yyyy = dt.getFullYear(); return `${dd}-${mm}-${yyyy}` })() : '-'}</td></tr>
              <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Address</td><td className="py-1 text-neutral-200 break-words">{s?.address ?? '-'}</td></tr>
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
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white border border-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto text-center min-w-[140px]"
              href={s.links.resume}
              target="_blank"
              style={{ backgroundColor: '#0F766E' }} // teal-600
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')} // teal-700
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
            >
              {/* Resume Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-white"
              >
                <path d="M6 2a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 
               2 0 0 0 2-2V8l-6-6H6zm7 7V3.5L18.5 
               9H13zM8 13h8v2H8v-2zm0 4h5v2H8v-2z"/>
              </svg>
              <span className="font-medium">Resume</span>
            </a>
          )}

          {s?.links?.portfolio && (
            <a
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white border border-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto text-center min-w-[140px]"
              href={s.links.portfolio}
              target="_blank"
              style={{ backgroundColor: '#3730A3' }} // indigo-600
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4F46E5')} // indigo-700
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3730A3')}
            >
              {/* Portfolio Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-white"
              >
                <path d="M10 2h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 
               2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 
               2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm0 
               4h4V4h-4v2z"/>
              </svg>
              <span className="font-medium">Portfolio</span>
            </a>
          )}

          {s?.links?.linkedin && (
            <a
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white border border-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto text-center min-w-[140px]"
              href={s.links.linkedin}
              target="_blank"
              style={{ backgroundColor: '#004182' }} // LinkedIn blue
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0A66C2')} // darker LinkedIn blue
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#004182')}
            >
              {/* LinkedIn Icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
                fill="currentColor"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.039-1.852-3.039-1.853 
               0-2.136 1.447-2.136 2.944v5.664H9.352V9h3.414v1.561h.049c.476-.9 
               1.637-1.852 3.368-1.852 3.602 0 4.268 2.37 
               4.268 5.455v6.288zM5.337 7.433a2.062 2.062 
               0 1 1 0-4.124 2.062 2.062 0 0 1 0 
               4.124zM7.119 20.452H3.554V9h3.565v11.452z"/>
              </svg>
              <span className="font-medium">LinkedIn</span>
            </a>
          )}

          {s?.links?.github && (
            <a
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white border border-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto text-center min-w-[140px]"
              href={s.links.github}
              target="_blank"
              style={{ backgroundColor: '#181717' }} // GitHub black
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#24292e')} // GitHub hover
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#181717')}
            >
              {/* GitHub Icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
                fill="currentColor"
              >
                <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.24c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.23 1.83 1.23 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.51.12-3.15 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.29-1.23 3.29-1.23.66 1.64.25 2.85.12 3.15.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .5z" />
              </svg>
              <span className="font-medium">GitHub</span>
            </a>
          )}

        </div>

        {/* Link URLs with Copy Functionality */}
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-neutral-200 mb-3">Link URLs</h3>
          
          {s?.links?.resume && (
            <div className="bg-[#191919] rounded-md p-3 border border-neutral-700">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cyan-400 mb-1">Resume</div>
                  <div className="text-neutral-300 text-sm break-all font-mono bg-neutral-800 px-2 py-1 rounded border">
                    {s.links.resume}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(s.links.resume, 'resume')}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md text-sm transition-colors w-full sm:w-auto min-w-[100px]"
                >
                  {copiedLink === 'resume' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {s?.links?.portfolio && (
            <div className="bg-[#191919] rounded-md p-3 border border-neutral-700">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cyan-400 mb-1">Portfolio</div>
                  <div className="text-neutral-300 text-sm break-all font-mono bg-neutral-800 px-2 py-1 rounded border">
                    {s.links.portfolio}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(s.links.portfolio, 'portfolio')}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md text-sm transition-colors w-full sm:w-auto min-w-[100px]"
                >
                  {copiedLink === 'portfolio' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {s?.links?.linkedin && (
            <div className="bg-[#191919] rounded-md p-3 border border-neutral-700">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cyan-400 mb-1">LinkedIn</div>
                  <div className="text-neutral-300 text-sm break-all font-mono bg-neutral-800 px-2 py-1 rounded border">
                    {s.links.linkedin}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(s.links.linkedin, 'linkedin')}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md text-sm transition-colors w-full sm:w-auto min-w-[100px]"
                >
                  {copiedLink === 'linkedin' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {s?.links?.github && (
            <div className="bg-[#191919] rounded-md p-3 border border-neutral-700">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cyan-400 mb-1">GitHub</div>
                  <div className="text-neutral-300 text-sm break-all font-mono bg-neutral-800 px-2 py-1 rounded border">
                    {s.links.github}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(s.links.github, 'github')}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md text-sm transition-colors w-full sm:w-auto min-w-[100px]"
                >
                  {copiedLink === 'github' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {!s?.links?.resume && !s?.links?.portfolio && !s?.links?.linkedin && !s?.links?.github && (
            <div className="text-center py-6 text-neutral-400">
              No links available
            </div>
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
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
            const semesterData = s?.academic?.semesters?.find((x: any) => x.semesterNumber === sem)
            const isSelected = selectedSemester === sem
            const hasData = semesterData && semesterData.subjects?.length > 0

            return (
              <div
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 h-24 sm:h-28 flex items-center justify-center ${isSelected
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-neutral-600 bg-neutral-800 hover:border-sky-400 hover:bg-neutral-700'
                  }`}
              >
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${isSelected ? 'text-sky-400' : 'text-white'
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

  // Infer a filename from a URL or fallback to a sensible default
  const inferFilename = (url: string, fallbackBase: string = 'resume') => {
    try {
      const u = new URL(url)
      // Try common query param keys
      const nameParams = ['filename', 'file', 'name', 'download']
      for (const key of nameParams) {
        const val = u.searchParams.get(key)
        if (val) return decodeURIComponent(val)
      }
      // Fallback to last path segment
      const lastSeg = u.pathname.split('/').filter(Boolean).pop() || ''
      if (lastSeg) return decodeURIComponent(lastSeg)
    } catch { }
    return `${fallbackBase}`
  }

  // Handle download with proper filename and CORS-safe fallback
  const handleDownload = async (url: string) => {
    if (!url) return

    // Prefer Google Drive direct download when applicable
    const isDrive = isGoogleDriveUrl(url)
    const downloadUrl = isDrive ? getDriveDownloadUrl(url) : url

    // Try to infer a better filename
    const studentName = (s?.name || 'resume').toString().trim().replace(/\s+/g, '_')
    let filename = inferFilename(url, `${studentName}_Resume`)
    // Ensure an extension if none present
    if (!/\.[a-zA-Z0-9]{2,8}$/.test(filename)) {
      const extFromUrl = (url.split('?')[0].split('#')[0].split('.').pop() || '').toLowerCase()
      const ext = ['pdf', 'doc', 'docx', 'txt'].includes(extFromUrl) ? extFromUrl : 'pdf'
      filename = `${filename}.${ext}`
    }

    try {
      // Attempt fetch -> blob -> objectURL for a smooth download
      const response = await fetch(downloadUrl, { mode: 'cors' })
      if (!response.ok) throw new Error('Failed to fetch file')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
      return
    } catch (e) {
      // If fetch fails (CORS or Drive auth), fall back to opening direct download URL
      const a = document.createElement('a')
      a.href = downloadUrl
      a.setAttribute('target', '_blank')
      // download attribute typically ignored cross-origin, but try anyway
      a.setAttribute('download', filename)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
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
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md w-full sm:w-auto text-center"
            >
              Open in New Tab
            </a>
            <button
              onClick={() => handleDownload(s.links.resume)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md w-full sm:w-auto"
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
                    className="w-full h-[65vh] sm:h-[80vh] bg-white"
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="profile-full-width pt-4 sm:pt-6 pb-20">
      <div className="space-y-3 pt-1 sm:pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-4 sm:px-6 py-4 rounded-md gap-3 sm:gap-4">
          <div className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Placement App</div>
          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => navigate(-1)}
              className={`${headerButtonBase} flex-1 sm:flex-none bg-transparent border-sky-700 text-sky-200 hover:bg-sky-900/30 hover:text-sky-100 focus:ring-sky-500`}
            >
              ← Back
            </button>
            <button
              onClick={handleDeleteStudent}
              className={`${headerButtonBase} flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 text-xs sm:text-sm border-red-700/70`}
            >
              Delete Student
            </button>
            <button
              onClick={handleLogout}
              className={`${headerButtonBase} flex-1 sm:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-transparent focus:ring-purple-500`}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2 sticky top-2 self-start lg:max-h-[calc(100vh-1rem)] lg:overflow-y-auto overflow-visible z-10">
            <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-visible overscroll-x-contain snap-x snap-mandatory -mx-2 px-2 -mb-2 pb-2">
              <li>
                <button
                  onClick={() => setActiveSection('profile')}
                  className={`block px-3 py-2 rounded w-full text-left whitespace-nowrap snap-start ${activeSection === 'profile'
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
                  className={`block px-3 py-2 rounded w-full text-left whitespace-nowrap snap-start ${activeSection === 'semester'
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
                  className={`block px-3 py-2 rounded w-full text-left whitespace-nowrap snap-start ${activeSection === 'resume'
                      ? 'bg-[#333] text-white border-l-4 border-sky-600'
                      : 'text-neutral-300 hover:text-white hover:bg-[#333]'
                    }`}
                >
                  Resume
                </button>
              </li>
            </ul>
          </nav>

          <section className="flex-1 min-w-0 bg-[#181818] rounded-md p-2 sm:p-4">
            <div className="bg-[#242424] rounded-md p-2 sm:p-3 border border-neutral-800">
              <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  <img className="w-24 h-32 sm:w-32 sm:h-44 rounded-full object-cover border-4 border-sky-500" src={s?.profilePhoto || 'https://via.placeholder.com/160x120'} alt="Student image" />
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-bold">{s?.name || 'Loading...'}</h1>
                    <div className="text-sm sm:text-lg text-neutral-400 mb-2">
                      <span className="inline-block">{s?.registerNumber} • </span>
                      <span className="inline-block whitespace-nowrap">{s?.department} • {(() => { const y = (s?.year || '').toString(); return y.toLowerCase() === 'fourth' ? 'Final Year' : y; })()}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${s?.placement?.willingToPlace ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {s?.placement?.willingToPlace ? '✓ Willing to Place' : '✗ Not Willing to Place'}
                      </span>
                      {s?.placement?.placementPreference && (
                        <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-600 text-white">
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


      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1f1f1f] rounded-md p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="text-neutral-300 mb-6">Are you sure you want to delete this student? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md"
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
    </div>
  )

  return (
    <>
      {content}
      <LogoutSuccessPopup show={showLogoutPopup} onClose={handleCloseLogoutPopup} />
      <SuccessPopup show={showSuccessPopup} onClose={handleCloseSuccessPopup} message={popupMessage} />
      <ErrorPopup show={showErrorPopup} onClose={handleCloseErrorPopup} message={popupMessage} />
    </>
  )
}