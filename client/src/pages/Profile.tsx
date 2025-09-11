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
    <div className="space-y-3 pt-1 sm:pt-2 m-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-3 sm:px-4 py-4 rounded-md gap-4">
        <div className="font-bold text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Placement App</div>
        <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-md">Logout</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2 sticky top-2 self-start max-h-[calc(100vh-1rem)] overflow-auto z-10">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li><Link className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600" to="/profile">Profile</Link></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/semester">Semester</Link></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/resume">Resume</Link></li>
          </ul>
        </nav>

        <section className="flex-1 bg-[#181818] rounded-md p-3 mt-auto sm:p-4">
          <div className="bg-[#242424] rounded-md p-3 border border-neutral-800">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <img className="w-28 h-36 sm:w-32 sm:h-44 rounded-full object-cover border-4 border-sky-500" src={student?.profilePhoto || 'https://via.placeholder.com/160x120'} alt="Student image" />
                <div>
                  <h1 className="text-lg sm:text-3xl font-bold">{error ? 'Failed to load profile' : (student?.name || 'Loading...')}</h1>
                  <div className="text-sm sm:text-lg text-neutral-400 mb-2">{student?.registerNumber} • {student?.department} • {(() => { const y=(student?.year||'').toString(); return y.toLowerCase()==='fourth' ? 'Final Year' : y; })()}</div>
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
              <Link to="/edit" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-sky-500 text-sky-300 hover:text-white bg-transparent hover:bg-sky-600/20 text-sm sm:text-base font-medium transition-colors text-center">✎ Edit Profile</Link>
            </header>

            <div className="grid grid-cols-1 gap-3 mt-3">
              <div className="bg-[#1f1f1f] rounded-md p-3">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 pl-3 border-l-4 border-sky-600">Personal details</h2>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-sm">
                    <colgroup>
                      <col className="w-32 sm:w-44" />
                      <col />
                    </colgroup>
                    <tbody className="divide-y divide-neutral-800">
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Name</td><td className="py-1 text-neutral-200 break-words break-all">{student?.name ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Register Number</td><td className="py-1 text-neutral-200 break-words break-all">{student?.registerNumber ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">College</td><td className="py-1 text-neutral-200 break-words break-all">{student?.collegeName ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Department</td><td className="py-1 text-neutral-200 break-words break-all">{student?.department ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Year</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const y=(student?.year||'').toString(); return y.toLowerCase()==='fourth' ? 'Final Year' : y; })()}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Current Semester</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const cs = (student?.academic?.currentSemester ?? student?.currentSemester); return (cs === undefined || cs === null || cs === 0 || cs === '') ? '-' : cs; })()}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Email</td><td className="py-1 text-neutral-200 break-words break-all">{student?.email ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Phone</td><td className="py-1 text-neutral-200 break-words break-all">{student?.phone ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Gender</td><td className="py-1 text-neutral-200 break-words break-all">{student?.gender ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Birth Date</td><td className="py-1 text-neutral-200 break-words break-all">{student?.dob ? (() => { const dt = new Date(student.dob); if (isNaN(dt.getTime())) return '-'; const dd = String(dt.getDate()).padStart(2,'0'); const mm = String(dt.getMonth()+1).padStart(2,'0'); const yyyy = dt.getFullYear(); return `${dd}-${mm}-${yyyy}` })() : '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Address</td><td className="py-1 text-neutral-200 break-words break-all">{student?.address ?? '-'}</td></tr>
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
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">CGPA</td><td className="py-1 text-neutral-200 break-words break-all">{student?.academic?.cgpa ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">HSC %</td><td className="py-1 text-neutral-200 break-words break-all">{student?.academic?.hscPercentage ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">SSLC %</td><td className="py-1 text-neutral-200 break-words break-all">{student?.academic?.sslcPercentage ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">History of Arrears</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const v = student?.academic?.historyOfArrears; if (v === null || v === undefined || v === '') return '-'; const s = String(v).toLowerCase(); return (s === '0' || s === 'none') ? 'None' : v; })()}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Current Arrears</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const v = student?.academic?.currentArrears; if (v === null || v === undefined || v === '') return '-'; const s = String(v).toLowerCase(); return (s === '0' || s === 'none') ? 'None' : v; })()}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-[#1f1f1f] rounded-md p-3 mt-3">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 pl-3 border-l-4 border-rose-600">Placement Details</h2>
              <p className="text-neutral-200"><span className="text-neutral-400 mr-2">Status</span>{student?.placement?.willingToPlace ? 'Willing to Place' : 'Not Willing to Place'}</p>
            </div>

            {/* Skills first */}
            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 pl-3 border-l-4 border-sky-600">Skills</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {/* Technical Skills card */}
                <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
                  <div className="text-sm font-semibold mb-2 border-b border-blue-600 text-blue-400">Technical Skills</div>
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
                {/* Soft Skills card */}
                <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
                  <div className="text-sm font-semibold mb-2 border-b border-green-600 text-green-400">Soft Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {student?.placement?.logicalSkills?.length > 0 ? (
                      student.placement.logicalSkills.map((skill: string, index: number) => (
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

            {/* Highlights below */}
            <div className="bg-[#1f1f1f] rounded-md p-3 mt-3">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 pl-3 border-l-4 border-amber-500">Highlights</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Certificates (first) */}
                <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
                  <div className="text-sm font-semibold mb-2 border-b border-violet-600 text-violet-400">Certificates</div>
                  {(() => {
                    const raw = (student?.placement?.certifications || '').toString();
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

                {/* Projects (second) */}
                <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
                  <div className="text-sm font-semibold mb-2 border-b border-sky-600 text-sky-400">Projects</div>
                  {(() => {
                    const raw = (student?.placement?.workExperience || student?.placement?.projects || '').toString();
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

                {/* Achievements (third) */}
                <div className="bg-[#191919] rounded-md p-3 border border-neutral-800">
                  <div className="text-sm font-semibold mb-2 border-b border-amber-500 text-amber-400">Achievements</div>
                  {(() => {
                    const raw = (student?.placement?.achievements || '').toString();
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

              {/* Internships list */}
              <div className="bg-[#191919] rounded-md p-3 border border-neutral-800 mt-3">
                <div className="text-sm font-semibold mb-2 border-b border-teal-600 text-teal-400">Internships</div>
                {(() => {
                  const raw = (student?.placement?.internships || '').toString();
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

            

            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 pl-3 border-l-4 border-cyan-500">Links</h2>
              <div className="flex flex-wrap gap-3">
                {student?.links?.resume && (
                  <a
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0b3b4b] hover:bg-[#0e4a5e] text-sky-200 transition-colors"
                    href={student.links.resume}
                    target="_blank"
                  >
                    <span>📄</span>
                    <span className="font-medium">Resume</span>
                  </a>
                )}
                {student?.links?.portfolio && (
                  <a
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#12324b] hover:bg-[#174162] text-sky-200 transition-colors"
                    href={student.links.portfolio}
                    target="_blank"
                  >
                    <span>🗂️</span>
                    <span className="font-medium">Portfolio</span>
                  </a>
                )}
                {student?.links?.linkedin && (
                  <a
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0a2a3d] hover:bg-[#0d364c] text-sky-200 transition-colors"
                    href={student.links.linkedin}
                    target="_blank"
                  >
                    <span>🔗</span>
                    <span className="font-medium">LinkedIn</span>
                  </a>
                )}
                {student?.links?.github && (
                  <a
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0b1f2e] hover:bg-[#0f293b] text-sky-200 transition-colors"
                    href={student.links.github}
                    target="_blank"
                  >
                    <span>🐙</span>
                    <span className="font-medium">GitHub</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  return <div className="max-w-7xl mx-auto px-2 sm:px-3 pt-4 sm:pt-6 pb-8">{content}</div>
}


