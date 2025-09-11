import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'

export default function Resume() {
  const navigate = useNavigate()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/students/me')
        setStudent(data)
      } catch (e: any) {
        if (e.response?.status === 401) navigate('/login')
        setError('Failed to load resume info')
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate])

  const resumeUrl = student?.links?.resume || ''

  if (loading) return <div className="max-w-7xl mx-auto p-4"><div className="text-center py-12">Loading...</div></div>
  if (error) return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="space-y-6 mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-4 sm:px-6 py-4 rounded-md gap-4">
          <div className="font-semibold">Resume</div>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-md w-full sm:w-auto">Logout</button>
        </div>
        <div className="bg-[#242424] rounded-md p-4 border border-neutral-800 text-center text-red-400">{error}</div>
      </div>
    </div>
  )

  const content = (
    <div className="space-y-6 mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-4 sm:px-6 py-4 rounded-md gap-4">
        <div className="font-semibold">Resume</div>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-md w-full sm:w-auto">Logout</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile">Profile</Link></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/semester">Semester</Link></li>
            <li><span className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600">Resume</span></li>
          </ul>
        </nav>

        <section className="flex-1 bg-[#181818] rounded-md p-4 sm:p-6">
          <div className="bg-[#242424] rounded-md p-4 border border-neutral-800">
            {!resumeUrl ? (
              <div className="text-center py-12 text-neutral-300">No resume link found. Add it in Edit Profile.</div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#1f1f1f] rounded-md">
                  <div className="text-sm text-neutral-400 break-all">{resumeUrl}</div>
                </div>
                <div className="flex gap-3">
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md">Open in New Tab</a>
                  <a href={resumeUrl} download className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">Download</a>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )

  return <div className="max-w-7xl mx-auto p-4">{content}</div>
}
