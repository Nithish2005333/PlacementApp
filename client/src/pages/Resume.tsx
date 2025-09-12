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

  if (loading) return <div className="max-w-7xl mx-auto p-4 text-white bg-[#0a0a0a] min-h-screen"><div className="text-center py-12">Loading...</div></div>
  if (error) return (
    <div className="max-w-7xl mx-auto p-4 text-white bg-[#0a0a0a] min-h-screen">
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
    <div className="space-y-3 pt-1 sm:pt-2 m-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-3 sm:px-4 py-4 rounded-md gap-4">
        <div className="font-bold text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Placement App</div>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-md sm:ml-auto">Logout</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2 sticky top-2 self-start max-h-[calc(100vh-1rem)] overflow-auto z-10">
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile">Profile</Link></li>
            <li><Link className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded" to="/profile/semester">Semester</Link></li>
            <li><span className="block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600">Resume</span></li>
          </ul>
        </nav>

        <section className="flex-1 bg-[#181818] rounded-md p-3 mt-auto sm:p-4">
          <div className="bg-[#242424] rounded-md p-3 border border-neutral-800">
            {!resumeUrl ? (
              <div className="text-center py-12 text-neutral-300">No resume link found. Add it in Edit Profile.</div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#1f1f1f] rounded-md">
                  <div className="text-sm text-neutral-400 break-all">{resumeUrl}</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md">Open in New Tab</a>
                  <button 
                    onClick={() => handleDownload(resumeUrl)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md"
                  >
                    Download
                  </button>
                </div>
                
                {(canPreview(resumeUrl) || isGoogleDriveUrl(resumeUrl)) && (
                  <div className="mt-4">
                    <div className="bg-[#1f1f1f] rounded-md p-4">
                      <h3 className="text-lg font-semibold mb-3 text-white">Resume Preview</h3>
                      <div className="border border-neutral-700 rounded-md overflow-hidden">
                        <iframe
                          src={isGoogleDriveUrl(resumeUrl) ? getDrivePreviewUrl(resumeUrl) : resumeUrl}
                          className="w-full h-96 bg-white"
                          title="Resume Preview"
                          onError={() => {
                            console.error('Failed to load resume preview')
                          }}
                        />
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">
                        {isGoogleDriveUrl(resumeUrl) 
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
        </section>
      </div>
    </div>
  )

  return <div className="max-w-7xl mx-auto px-2 sm:px-3 pt-4 sm:pt-6 pb-8 text-white bg-[#0a0a0a] min-h-screen">{content}</div>
}
