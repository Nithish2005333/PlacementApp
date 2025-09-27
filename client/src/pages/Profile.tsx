import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import api from '../lib/api'
import LogoutSuccessPopup from '../components/LogoutSuccessPopup'

type Student = any

export default function Profile() {
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showLogoutPopup, setShowLogoutPopup] = useState(false)

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
    <div className="w-full max-w-full overflow-x-hidden overflow-y-hidden space-y-3 pt-1 sm:pt-2 px-4 sm:px-6">
      <style>{`
        /* From Uiverse.io by SelfMadeSystem */
        .button-container {
          position: relative;
          margin: 0 2em;
        }

        .button-border {
          padding: 3px;
          inset: 0;
          background: linear-gradient(45deg, #0ea5e9, #06b6d4);
          border-radius: inherit;
          clip-path: path(
            "M 90 0 C 121 0 126 5 126 33 C 126 61 121 66 90 66 L 33 66 C 5 66 0 61 0 33 C 0 5 5 0 33 0 Z"
          );
        }

        .button {
          justify-content: center;
          align-items: center;
          border: none;
          border-radius: 0.875em;
          clip-path: path(
            "M 90 0 C 115 0 120 5 120 30 C 120 55 115 60 90 60 L 30 60 C 5 60 0 55 0 30 C 0 5 5 0 30 0 Z"
          );
          width: 120px;
          height: 60px;
          background: #111215;
          display: flex;
          flex-direction: column;
          color: #fff;
          overflow: hidden;
        }

        .real-button {
          position: absolute;
          width: 120px;
          height: 60px;
          z-index: 1;
          outline: none;
          border: none;
          border-radius: 17px;
          cursor: pointer;
          opacity: 0;
        }

        .backdrop {
          position: absolute;
          inset: -9900%;
          background: radial-gradient(
            circle at 50% 50%,
            #0000 0,
            #0000 20%,
            #111111aa 50%
          );
          background-size: 3px 3px;
          z-index: -1;
        }

        .spin {
          position: absolute;
          inset: 0;
          z-index: -2;
          opacity: 0.5;
          overflow: hidden;
          transition: 0.3s;
        }

        .real-button:active ~ div .spin {
          opacity: 1;
        }

        .real-button:hover ~ div .spin {
          opacity: 1;
        }

        .button:hover {
          transform: scale(1.05);
          transition: transform 0.3s ease;
        }

        .button:active {
          transform: scale(0.95);
        }

        .spin-blur {
          filter: blur(2em) url(#unopaq);
        }

        .spin-intense {
          inset: -0.125em;
          filter: blur(0.25em) url(#unopaq2);
          border-radius: 0.75em;
        }

        .spin-inside {
          inset: -2px;
          border-radius: inherit;
          filter: blur(2px) url(#unopaq3);
          z-index: 0;
        }

        .spin::before {
          content: "";
          position: absolute;
          inset: -150%;
          animation:
            speen 8s cubic-bezier(0.56, 0.15, 0.28, 0.86) infinite,
            woah 4s infinite;
          animation-play-state: running;
        }

        .spin-blur::before {
          background: linear-gradient(90deg, #0ea5e9 30%, #0000 50%, #06b6d4 70%);
        }

        .spin-intense::before {
          background: linear-gradient(90deg, #38bdf8 20%, #0000 45% 55%, #22d3ee 80%);
        }

        .spin-inside::before {
          background: linear-gradient(90deg, #7dd3fc 30%, #0000 45% 55%, #67e8f9 70%);
        }

        @keyframes speen {
          0% {
            rotate: 10deg;
          }
          50% {
            rotate: 190deg;
          }
          to {
            rotate: 370deg;
          }
        }

        @keyframes woah {
          0%, to {
            scale: 1;
          }
          50% {
            scale: 0.75;
          }
        }

        /* Mobile responsive adjustments */
        @media (max-width: 640px) {
          .button-container {
            margin: 0;
            flex: 0 0 auto;
            width: 80%;
            max-width: 200px;
          }
          
          .button {
            width: 100%;
            height: 40px;
            border-radius: 0.5em;
            clip-path: none;
          }
          
          .button-border {
            clip-path: none;
            border-radius: 0.5em;
          }
          
          .real-button {
            width: 100%;
            height: 40px;
            border-radius: 0.5em;
          }
        }

        /* Hide scrollbars but maintain functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar { 
          display: none;  /* Safari and Chrome */
        }
        
        /* Enhanced button hover effects */
        .button-container:hover .button {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 
            0 0 30px rgba(14, 165, 233, 0.8),
            0 0 60px rgba(14, 165, 233, 0.4),
            0 15px 35px rgba(14, 165, 233, 0.4), 
            0 5px 15px rgba(14, 165, 233, 0.2);
          background: linear-gradient(135deg, #1e293b, #0f172a);
        }
        
        .button-container:hover .button-border {
          background: linear-gradient(45deg, #0ea5e9, #3b82f6, #8b5cf6);
          box-shadow: 
            0 0 25px rgba(14, 165, 233, 0.8),
            0 0 50px rgba(14, 165, 233, 0.4),
            0 0 75px rgba(14, 165, 233, 0.2);
          animation: pulseGlow 2s ease-in-out infinite alternate;
        }
        
        @keyframes pulseGlow {
          0% {
            box-shadow: 
              0 0 25px rgba(14, 165, 233, 0.8),
              0 0 50px rgba(14, 165, 233, 0.4),
              0 0 75px rgba(14, 165, 233, 0.2);
          }
          100% {
            box-shadow: 
              0 0 35px rgba(14, 165, 233, 1),
              0 0 70px rgba(14, 165, 233, 0.6),
              0 0 100px rgba(14, 165, 233, 0.3);
          }
        }
        
        .button-container:hover .real-button {
          opacity: 0.1;
        }
        
        .button-container:hover .spin::before {
          animation-duration: 2s, 1s;
        }
        
        
        .button-container:hover .button div {
          color: #f0f9ff;
          text-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
        }
        
        .button-container:active .button {
          transform: scale(0.98) translateY(1px);
          box-shadow: 0 5px 15px rgba(14, 165, 233, 0.3);
        }
        
        .button-container:active .button-border {
          background: linear-gradient(45deg, #0284c7, #2563eb, #7c3aed);
          box-shadow: 0 0 15px rgba(2, 132, 199, 0.8);
        }

      `}</style>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white py-4 rounded-md gap-4">
        <div className="font-bold text-4xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Placement App</div>
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('role'); setShowLogoutPopup(true) }} className="bg-rose-600 hover:bg-rose-500 hover:scale-110 active:scale-95 text-white px-3 py-3 sm:px-4 sm:py-2 rounded-md text-xs sm:text-base w-20 sm:w-auto transition-all duration-300 shadow-lg hover:shadow-rose-500/50 hover:shadow-xl hover:-translate-y-1">Logout</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
        <nav className="w-full lg:w-64 bg-[#202020] rounded-none p-2 sticky top-0 self-start z-10">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li><span className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600">Profile</span></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/semester">Semester</Link></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/resume">Resume</Link></li>
          </ul>
        </nav>

        <section className="flex-1 lg:ml-2 bg-[#181818] rounded-md p-3 sm:p-4">
          <div className="bg-[#242424] rounded-md p-3 border border-neutral-800">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-1">
                <img className="w-28 h-36 sm:w-32 sm:h-44 rounded-full object-cover border-4 border-sky-500" src={student?.profilePhoto || 'https://via.placeholder.com/160x120'} alt="Student image" />
                <div className="flex-1">
                  <h1 className="text-lg sm:text-3xl font-bold">{error ? 'Failed to load profile' : (student?.name || 'Loading...')}</h1>
                  <div className="text-sm sm:text-lg text-neutral-400 mb-2">
                    <span className="inline-block">{student?.registerNumber} • </span>
                    <span className="inline-block whitespace-nowrap">{student?.department} • {(() => { const y = (student?.year || '').toString(); return y.toLowerCase() === 'fourth' ? 'Final Year' : y; })()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${student?.placement?.willingToPlace
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
              {/* Edit Profile Button - Desktop only */}
              <div className="hidden sm:block">
                <div className="button-container">
                  <div className="button-border">
                    <div className="button">
                      <Link to="/edit" className="real-button"></Link>
                      <div className="backdrop"></div>
                      <div className="spin spin-blur"></div>
                      <div className="spin spin-intense"></div>
                      <div className="spin spin-inside"></div>
                      <div className="flex items-center justify-center h-full text-sm font-medium">
                        ✎ Edit Profile
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Edit Profile Button - Mobile only */}
            <div className="sm:hidden mt-4 mb-2 flex justify-center">
              <div className="button-container">
                <div className="button-border">
                  <div className="button">
                    <Link to="/edit" className="real-button"></Link>
                    <div className="backdrop"></div>
                    <div className="spin spin-blur"></div>
                    <div className="spin spin-intense"></div>
                    <div className="spin spin-inside"></div>
                    <div className="flex items-center justify-center h-full text-sm font-medium">
                      ✎ Edit Profile
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">College</td><td className="py-1 text-neutral-200 break-words">{student?.collegeName || 'Anna University regional campus, Coimbatore'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Department</td><td className="py-1 text-neutral-200 break-words break-all">{student?.department ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Year</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const y = (student?.year || '').toString(); return y.toLowerCase() === 'fourth' ? 'Final Year' : y; })()}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Current Semester</td><td className="py-1 text-neutral-200 break-words break-all">{(() => { const cs = (student?.academic?.currentSemester ?? student?.currentSemester); return (cs === undefined || cs === null || cs === 0 || cs === '') ? '-' : cs; })()}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Email</td><td className="py-1 text-neutral-200 break-words break-all">{student?.email ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Phone</td><td className="py-1 text-neutral-200 break-words break-all">{student?.phone ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Gender</td><td className="py-1 text-neutral-200 break-words break-all">{student?.gender ?? '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Birth Date</td><td className="py-1 text-neutral-200 break-words break-all">{student?.dob ? (() => { const dt = new Date(student.dob); if (isNaN(dt.getTime())) return '-'; const dd = String(dt.getDate()).padStart(2, '0'); const mm = String(dt.getMonth() + 1).padStart(2, '0'); const yyyy = dt.getFullYear(); return `${dd}-${mm}-${yyyy}` })() : '-'}</td></tr>
                      <tr><td className="py-1 pr-2 text-neutral-400 whitespace-nowrap">Address</td><td className="py-1 text-neutral-200 break-words">{student?.address ?? '-'}</td></tr>
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
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white border border-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto text-center min-w-[140px]"
                    href={student.links.resume}
                    target="_blank"
                    style={{ backgroundColor: '#0D9488' }} // teal-600
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
                    <span className="font-medium leading-none">Resume</span>
                  </a>
                )}

                {student?.links?.portfolio && (
                  <a
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white border border-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto text-center min-w-[140px]"
                    href={student.links.portfolio}
                    target="_blank"
                    style={{ backgroundColor: '#4F46E5' }} // indigo-600
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
                    <span className="font-medium leading-none">Portfolio</span>
                  </a>
                )}

                {student?.links?.linkedin && (
                  <a
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white border border-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto text-center min-w-[140px]"
                    href={student.links.linkedin}
                    target="_blank"
                    style={{ backgroundColor: '#0A66C2' }} // LinkedIn blue
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
                    <span className="font-medium leading-none">LinkedIn</span>
                  </a>
                )}

                {student?.links?.github && (
                  <a
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white border border-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto text-center min-w-[140px]"
                    href={student.links.github}
                    target="_blank"
                    style={{ backgroundColor: '#181717' }} // GitHub black
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#24292e')} // GitHub gray/hover
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
                    <span className="font-medium leading-none">GitHub</span>
                  </a>
                )}


              </div>
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


