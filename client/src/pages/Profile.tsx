import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

type Student = any

export default function Profile() {
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/students/me')
        setStudent(data)
        setError(null)
      } catch (e: any) {
        const status = e.response?.status
        console.error('Profile fetch error:', e)
        
        if (status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('role')
          navigate('/login', { replace: true })
          return
        }
        
        setError('Failed to load profile')
      }
    })()
  }, [navigate])

  const content = (
    <div className="space-y-6 pt-4 sm:pt-6 mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-4 sm:px-6 py-4 rounded-md gap-4">
        <div className="font-semibold">Placement App</div>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-md w-full sm:w-auto">Logout</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li><Link className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600" to="/profile">Profile</Link></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/semester">Semester</Link></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/resume">Resume</Link></li>
          </ul>
        </nav>

        <section className="flex-1 bg-[#181818] rounded-md p-4 mt-auto sm:p-6">
          <div className="bg-[#242424] rounded-md p-4 border border-neutral-800">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <img className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-sky-500" src={student?.profilePhoto || 'https://via.placeholder.com/128'} alt="Student image" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{error ? 'Failed to load profile' : (student?.name || 'Loading...')}</h1>
                  <div className="text-lg text-neutral-400 mb-2">{student?.registerNumber} • {student?.department} • {student?.year}</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      student?.placement?.willingToPlace 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {student?.placement?.willingToPlace ? '✓ Willing to Place' : '✗ Not Willing to Place'}
                    </span>
                    {student?.placement?.placementPreference && (
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                        {student.placement.placementPreference}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link to="/edit" className="px-6 py-3 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium w-full sm:w-auto text-center">EDIT PROFILE</Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <div className="bg-[#1f1f1f] rounded-md p-4">
                <h2 className="font-semibold mb-2">Personal details</h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                  <p><strong>Name:</strong> {student?.name ?? '-'}</p>
                  <p><strong>Register Number:</strong> {student?.registerNumber ?? '-'}</p>
                  <p><strong>College:</strong> {student?.collegeName ?? '-'}</p>
                  <p><strong>Department:</strong> {student?.department ?? '-'}</p>
                  <p><strong>Year:</strong> {student?.year ?? '-'}</p>
                  <p><strong>Current Semester:</strong> {student?.academic?.currentSemester ?? '-'}</p>
                  <p><strong>Email:</strong> {student?.email ?? '-'}</p>
                  <p><strong>Phone:</strong> {student?.phone ?? '-'}</p>
                  <p><strong>Gender:</strong> {student?.gender ?? '-'}</p>
                  <p><strong>Birth Date:</strong> {student?.dob ? (() => { const dt = new Date(student.dob); if (isNaN(dt.getTime())) return '-'; const dd = String(dt.getDate()).padStart(2,'0'); const mm = String(dt.getMonth()+1).padStart(2,'0'); const yyyy = dt.getFullYear(); return `${dd}-${mm}-${yyyy}` })() : '-'}</p>
                  <p className="sm:col-span-2"><strong>Address:</strong> {student?.address ?? '-'}</p>
                </div>
              </div>

              <div className="bg-[#1f1f1f] rounded-md p-4">
                <h2 className="font-semibold mb-2">Academic details</h2>
                <p><strong>CGPA:</strong> {student?.academic?.cgpa ?? '-'}</p>
                <p><strong>HSC %:</strong> {student?.academic?.hscPercentage ?? '-'}</p>
                <p><strong>SSLC %:</strong> {student?.academic?.sslcPercentage ?? '-'}</p>
                <p><strong>History of Arrears:</strong> {student?.academic?.historyOfArrears ?? '-'}</p>
                <p><strong>Current Arrears:</strong> {student?.academic?.currentArrears ?? '-'}</p>
              </div>
            </div>

            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Placement Details</h2>
              <p><strong>Internships:</strong> {student?.placement?.internships ?? '-'}</p>
              <p><strong>Status:</strong> {student?.placement?.willingToPlace ? 'Willing to Place' : 'Not Willing to Place'}</p>
            </div>

            {/* Highlights as bulleted lists */}
            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-4">Highlights</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Achievements */}
                <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
                  <div className="font-medium mb-2">Achievements</div>
                  {(() => {
                    const items = (student?.placement?.achievements || '')
                      .toString()
                      .split(/\n|,|;|\u2022/) // handle newlines, commas, semicolons, bullet char
                      .map((t: string) => t.trim())
                      .filter(Boolean)
                  return items.length ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
                      {items.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                    </ul>
                  ) : (
                    <div className="text-sm text-neutral-400">No achievements added</div>
                  )
                  })()}
                </div>

                {/* Certifications */}
                <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
                  <div className="font-medium mb-2">Certifications</div>
                  {(() => {
                    const items = (student?.placement?.certifications || '')
                      .toString()
                      .split(/\n|,|;|\u2022/)
                      .map((t: string) => t.trim())
                      .filter(Boolean)
                  return items.length ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
                      {items.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                    </ul>
                  ) : (
                    <div className="text-sm text-neutral-400">No certifications added</div>
                  )
                  })()}
                </div>

                {/* Projects */}
                <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
                  <div className="font-medium mb-2">Projects</div>
                  {(() => {
                    const items = (student?.placement?.projects || '')
                      .toString()
                      .split(/\n|,|;|\u2022/)
                      .map((t: string) => t.trim())
                      .filter(Boolean)
                  return items.length ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
                      {items.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                    </ul>
                  ) : (
                    <div className="text-sm text-neutral-400">No work experience added</div>
                  )
                  })()}
                </div>
              </div>

              {/* Internships list */}
              <div className="bg-[#191919] rounded-md p-3 border border-neutral-800 mt-4">
                <div className="font-medium mb-2">Internships</div>
                {(() => {
                  const items = (student?.placement?.internships || '')
                    .toString()
                    .split(/\n|,|;|\u2022/)
                    .map((t: string) => t.trim())
                    .filter(Boolean)
                  return items.length ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
                      {items.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                    </ul>
                  ) : (
                    <div className="text-sm text-neutral-400">No internships added</div>
                  )
                })()}
              </div>
            </div>

            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Skills</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {student?.placement?.technicalSkills?.length > 0 ? (
                      student.placement.technicalSkills.map((skill: string, index: number) => (
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
                    {student?.placement?.logicalSkills?.length > 0 ? (
                      student.placement.logicalSkills.map((skill: string, index: number) => (
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

            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Links</h2>
              <ul className="text-sm space-y-1">
                {student?.links?.resume && <li><a className="text-sky-400" href={student.links.resume} target="_blank">Resume</a></li>}
                {student?.links?.portfolio && <li><a className="text-sky-400" href={student.links.portfolio} target="_blank">Portfolio</a></li>}
                {student?.links?.linkedin && <li><a className="text-sky-400" href={student.links.linkedin} target="_blank">LinkedIn</a></li>}
                {student?.links?.github && <li><a className="text-sky-400" href={student.links.github} target="_blank">GitHub</a></li>}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  return <div className="max-w-6xl mx-auto p-4 pt-6 sm:pt-8 pb-10">{content}</div>
}


