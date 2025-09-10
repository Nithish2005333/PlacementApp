import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import '../styles/legacy-login.css'

type Student = any

export default function Profile() {
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retried, setRetried] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/students/me')
        setStudent(data)
      } catch (e: any) {
        const status = e.response?.status
        setError(status === 401 ? 'Unauthorized' : 'Failed to load profile')
        if (status === 401) {
          const token = localStorage.getItem('token')
          // If we have a token, retry once before forcing login
          if (token && !retried) {
            setRetried(true)
            setTimeout(() => {
              setError(null)
              setStudent(null)
            }, 150)
            return
          }
          if (!token) navigate('/login')
        }
      }
    })()
  }, [navigate, retried])

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-[#111] text-white px-6 py-4 rounded-md">
        <div className="font-semibold">Placement App</div>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-md">Logout</button>
      </div>

      <div className="flex gap-4">
        <nav className="w-56 bg-[#202020] rounded-md p-2">
          <ul className="space-y-1">
            <li><a className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600" href="#">Profile</a></li>
            <li><a className="block px-3 py-2 text-neutral-300" href="#">Semester</a></li>
            <li><a className="block px-3 py-2 text-neutral-300" href="#">Resume</a></li>
          </ul>
        </nav>

        <section className="flex-1 bg-[#181818] rounded-md p-6">
          <div className="bg-[#242424] rounded-md p-4 border border-neutral-800">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img className="w-20 h-20 rounded-full object-cover" src={student?.profilePhoto || 'https://via.placeholder.com/80'} alt="Student image" />
                <h1 className="text-xl font-semibold">{error ? 'Failed to load profile' : (student?.name || 'Loading...')}</h1>
              </div>
              <Link to="/edit" className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500">EDIT PROFILE</Link>
            </header>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#1f1f1f] rounded-md p-4">
                <h2 className="font-semibold mb-2">Personal details</h2>
                <p><strong>Gender:</strong> {student?.gender ?? '-'}</p>
                <p><strong>Birth Date:</strong> {student?.dob ? new Date(student.dob).toLocaleDateString() : '-'}</p>
                <p><strong>Address:</strong> {student?.address ?? '-'}</p>
              </div>

              <div className="bg-[#1f1f1f] rounded-md p-4">
                <h2 className="font-semibold mb-2">Academic details</h2>
                <p><strong>CGPA:</strong> {student?.academic?.cgpa ?? '-'}</p>
                <p><strong>SGPA:</strong> {student?.academic?.sgpa?.join(', ') ?? '-'}</p>
                <p><strong>Status:</strong> {student?.academic?.status ?? '-'}</p>
              </div>
            </div>

            <div className="bg-[#1f1f1f] rounded-md p-4 mt-4">
              <h2 className="font-semibold mb-2">Placement Details</h2>
              <p><strong>Achievements:</strong> {student?.placement?.achievements ?? '-'}</p>
              <p><strong>Internships:</strong> {student?.placement?.internships ?? '-'}</p>
              <p><strong>Work Experience:</strong> {student?.placement?.workExperience ?? '-'}</p>
              <p><strong>Certifications:</strong> {student?.placement?.certifications ?? '-'}</p>
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

  return <div className="max-w-6xl mx-auto p-4">{content}</div>
}


