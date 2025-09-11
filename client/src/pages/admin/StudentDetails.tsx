import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'

export default function StudentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [s, setS] = useState<any | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/admin/login', { replace: true })
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

  const content = (
    <div className="space-y-6 pt-6 sm:pt-8 mt-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-4 sm:px-6 py-4 rounded-md gap-4">
        <div className="font-semibold">Placement App</div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="px-3 py-1 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md w-full sm:w-auto"
          >
            ← Back
          </button>
          <button 
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li><span className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600">Profile</span></li>
            <li><span className="block px-3 py-2 text-neutral-300">Semesters</span></li>
            <li><span className="block px-3 py-2 text-neutral-300">Resume</span></li>
          </ul>
        </nav>

        <section className="flex-1 bg-[#181818] rounded-md p-4 sm:p-6">
          <div className="bg-[#242424] rounded-md p-4 border border-neutral-800">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <img className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-sky-500" src={s?.profilePhoto || 'https://via.placeholder.com/128'} alt="Student image" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{s?.name || 'Loading...'}</h1>
                  <div className="text-lg text-neutral-400 mb-2">{s?.registerNumber} • {s?.department} • {s?.year}</div>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <div className="bg-[#1f1f1f] rounded-md p-4">
                <h2 className="font-semibold mb-2">Personal details</h2>
                <p><strong>Email:</strong> {s?.email ?? '-'}</p>
                <p><strong>Phone:</strong> {s?.phone ?? '-'}</p>
                <p><strong>Gender:</strong> {s?.gender ?? '-'}</p>
                <p><strong>Birth Date:</strong> {s?.dob ? new Date(s.dob).toLocaleDateString() : '-'}</p>
                <p><strong>Address:</strong> {s?.address ?? '-'}</p>
                <p><strong>College:</strong> {s?.collegeName ?? '-'}</p>
              </div>

              <div className="bg-[#1f1f1f] rounded-md p-4">
                <h2 className="font-semibold mb-2">Academic details</h2>
                <p><strong>CGPA:</strong> {s?.academic?.cgpa ?? '-'}</p>
                <p><strong>SGPA:</strong> {s?.academic?.sgpa?.join(', ') ?? '-'}</p>
                <p><strong>HSC %:</strong> {s?.academic?.hscPercentage ?? '-'}</p>
                <p><strong>SSLC %:</strong> {s?.academic?.sslcPercentage ?? '-'}</p>
                <p><strong>History of Arrears:</strong> {s?.academic?.historyOfArrears ?? '-'}</p>
                <p><strong>Current Arrears:</strong> {s?.academic?.currentArrears ?? '-'}</p>
                <p><strong>Status:</strong> {s?.academic?.status ?? '-'}</p>
                <p><strong>Date of Entry:</strong> {s?.academic?.dateOfEntry ? new Date(s.academic.dateOfEntry).toLocaleDateString() : '-'}</p>
              </div>
            </div>

            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Placement Details</h2>
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-4">
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
              <p><strong>Achievements:</strong> {s?.placement?.achievements ?? '-'}</p>
              <p><strong>Internships:</strong> {s?.placement?.internships ?? '-'}</p>
              <p><strong>Work Experience:</strong> {s?.placement?.workExperience ?? '-'}</p>
              <p><strong>Certifications:</strong> {s?.placement?.certifications ?? '-'}</p>
            </div>

            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Skills</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Technical Skills</h3>
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
                <div>
                  <h3 className="font-medium mb-2">Logical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {s?.placement?.logicalSkills?.length > 0 ? (
                      s.placement.logicalSkills.map((skill: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-green-600 text-white text-sm rounded-md">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-400">No logical skills added</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Read-only Semesters summary */}
            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Semesters</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {[1,2,3,4,5,6,7,8].map(sem => {
                  const semData = s?.academic?.semesters?.find((x:any) => x.semesterNumber === sem)
                  const has = !!semData && (semData.subjects?.length || 0) > 0
                  return (
                    <div key={sem} className={`p-3 rounded border h-20 flex flex-col justify-center ${has ? 'border-sky-600 bg-sky-600/10' : 'border-neutral-700 bg-neutral-800'}`}>
                      <div className="text-sm font-semibold">Sem {sem}</div>
                      <div className="text-xs text-neutral-400">{has ? `${semData.sgpa?.toFixed?.(2) ?? '-' } SGPA` : 'No data'}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Read-only Resume actions */}
            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Resume</h2>
              {!s?.links?.resume ? (
                <div className="text-neutral-400 text-sm">No resume uploaded</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm break-all text-neutral-300">{s.links.resume}</div>
                  <div className="flex gap-3">
                    <a href={s.links.resume} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md">Open in New Tab</a>
                    <a href={s.links.resume} download className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">Download</a>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Links</h2>
              <ul className="text-sm space-y-1">
                {s?.links?.resume && <li><a className="text-sky-400" href={s.links.resume} target="_blank" rel="noopener noreferrer">Resume</a></li>}
                {s?.links?.portfolio && <li><a className="text-sky-400" href={s.links.portfolio} target="_blank" rel="noopener noreferrer">Portfolio</a></li>}
                {s?.links?.linkedin && <li><a className="text-sky-400" href={s.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>}
                {s?.links?.github && <li><a className="text-sky-400" href={s.links.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  return <div className="max-w-6xl mx-auto p-4 pt-6 sm:pt-8 pb-10">{content}</div>
}



