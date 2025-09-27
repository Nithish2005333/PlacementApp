import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import OTPInput from '../components/OTPInput'
import { departmentsStore } from '../lib/departments'
import Footer from '../components/Footer'
import EmailSpamPopup from '../components/EmailSpamPopup'

export default function EditProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState<any>({})
  const [deptOptions, setDeptOptions] = useState<Array<{ name: string; fullName: string }>>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'placement' | 'skills' | 'other' | 'links'>('personal')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const navListRef = useRef<HTMLUListElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [originalEmail, setOriginalEmail] = useState<string>('')
  const [otpSending, setOtpSending] = useState<boolean>(false)
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpCode, setOtpCode] = useState<string>('')
  const [otpVerifying, setOtpVerifying] = useState<boolean>(false)
  const [otpVerified, setOtpVerified] = useState<boolean>(false)
  const [showEmailSpamPopup, setShowEmailSpamPopup] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/students/me')
        // Derive lastName from full name for editing convenience
        if (data?.name && typeof data.name === 'string') {
          const parts = data.name.trim().split(/\s+/)
          const firstName = parts.shift() || ''
          const lastName = parts.join(' ')
          setForm({ ...data, name: firstName, lastName })
        } else {
          setForm(data)
        }
        setOriginalEmail((data?.email || '').toString())
      } catch (e: any) {
        if (e.response?.status === 401) navigate('/login')
      }
    })()
  }, [navigate])

  useEffect(() => {
    const cached = departmentsStore.getCached()
    if (cached) setDeptOptions(cached)
    const unsub = departmentsStore.subscribe((depts) => { setDeptOptions(depts) })
    departmentsStore.refresh()
    return () => { unsub(); }
  }, [])

  // Hard fallback: also fetch directly once
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/public/departments')
        if (Array.isArray(data) && data.length > 0) setDeptOptions(data)
      } catch {}
    })()
  }, [])

  // Highlight active section in sidebar as user scrolls
  useEffect(() => {
    const sectionIds: Array<'personal' | 'academic' | 'placement' | 'skills' | 'other' | 'links'> = ['personal','academic','placement','skills','other','links']
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top))

        const topMost = visible[0]
        if (topMost?.target?.id) {
          const id = topMost.target.id as typeof activeTab
          setActiveTab(id)
        }
      },
      {
        root: null,
        rootMargin: '-30% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    )

    sections.forEach(sec => observer.observe(sec))
    return () => observer.disconnect()
  }, [])

  // Keep the active nav link visible in nav (horizontal on mobile, vertical on desktop)
  useEffect(() => {
    const list = navListRef.current
    if (!list) return
    const selector = `a[href="#${activeTab}"]`
    const el = list.querySelector(selector) as HTMLElement | null
    if (!el) return
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (isDesktop) {
      // center vertically within the list
      const targetTop = el.offsetTop - (list.clientHeight / 2) + (el.clientHeight / 2)
      list.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    } else {
      // center horizontally within the list
      const targetLeft = el.offsetLeft - (list.clientWidth / 2) + (el.clientWidth / 2)
      list.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    }
  }, [activeTab])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const emailChanged = (form.email || '').toString().trim().toLowerCase() !== (originalEmail || '').toString().trim().toLowerCase()
    if (emailChanged && !otpVerified) {
      setSaving(false)
      setError('Please verify the new email address via OTP before saving')
      return
    }
    try {
      const combinedName = [form.name, form.lastName].filter(Boolean).join(' ').trim()
      const phoneDigits = (form.phone || '').toString().replace(/\D/g,'').slice(0,10)
      const phoneToSave = phoneDigits ? `91${phoneDigits}` : undefined
      const payload: any = {
        name: combinedName,
        registerNumber: form.registerNumber,
        email: form.email,
        department: form.department,
        year: form.year,
        profilePhoto: form.profilePhoto,
        dob: form.dob,
        address: form.address,
        phone: phoneToSave,
        gender: form.gender,
        // duplicate current semester at root for compatibility with existing readers
        currentSemester: (Number.isFinite(Number(form.academic?.currentSemester)) && Number(form.academic?.currentSemester) >= 1 && Number(form.academic?.currentSemester) <= 8)
          ? Number(form.academic?.currentSemester)
          : undefined
      }
      if (form.academic) {
        const cs = Number(form.academic.currentSemester)
        payload.academic = {
          cgpa: form.academic.cgpa,
          hscPercentage: form.academic.hscPercentage,
          sslcPercentage: form.academic.sslcPercentage,
          historyOfArrears: form.academic.historyOfArrears,
          currentArrears: form.academic.currentArrears,
          ...(Number.isFinite(cs) && cs >= 1 && cs <= 8 ? { currentSemester: cs } : {})
        }
      }
      if (form.placement) {
        payload.placement = {
          willingToPlace: form.placement.willingToPlace,
          achievements: form.placement.achievements,
          internships: form.placement.internships,
          certifications: form.placement.certifications,
          technicalSkills: form.placement.technicalSkills,
          logicalSkills: form.placement.logicalSkills,
          // write experience to workExperience; keep projects if present
          workExperience: form.placement.workExperience ?? form.placement.projects,
          projects: form.placement.projects
        }
      }
      if (form.links) {
        payload.links = {
          resume: form.links.resume,
          portfolio: form.links.portfolio,
          linkedin: form.links.linkedin,
          github: form.links.github
        }
      }
      await api.put('/students/me', payload)
      setSaved(true)
      setTimeout(() => navigate('/profile'), 1200)
    } catch (e: any) {
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = (type: 'technical' | 'logical', skill: string) => {
    if (!skill.trim()) return
    
    // Split by comma and clean up each skill
    const skillsToAdd = skill.split(',').map(s => s.trim()).filter(s => s.length > 0)
    
    if (skillsToAdd.length === 0) return
    
    const currentSkills = form.placement?.[`${type}Skills`] || []
    const newSkills = [...currentSkills]
    
    // Add each skill if it doesn't already exist
    skillsToAdd.forEach(skillToAdd => {
      if (!newSkills.includes(skillToAdd)) {
        newSkills.push(skillToAdd)
      }
    })
    
    setForm({
      ...form,
      placement: {
        ...form.placement,
        [`${type}Skills`]: newSkills
      }
    })
  }

  const removeSkill = (type: 'technical' | 'logical', index: number) => {
    const currentSkills = form.placement?.[`${type}Skills`] || []
    setForm({
      ...form,
      placement: {
        ...form.placement,
        [`${type}Skills`]: currentSkills.filter((_: any, i: number) => i !== index)
      }
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('profilePhoto', file)

      const { data } = await api.post('/upload/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setForm({ ...form, profilePhoto: data.profilePhoto })
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      setUploadError(error.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeProfilePhoto = async () => {
    try {
      await api.delete('/upload/profile-photo')
      setForm({ ...form, profilePhoto: '' })
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      setUploadError(error.response?.data?.error || 'Failed to remove photo')
    }
  }

  const content = (
    <div className="space-y-6 max-w-none min-h-screen px-0 mx-0">
      {saved && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pointer-events-none">
          <div className="mt-6 px-4 sm:px-6">
            <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-emerald-600/95 shadow-lg ring-1 ring-emerald-400/40 px-4 py-3 text-white animate-[fadein_.15s_ease-out]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.69a.75.75 0 0 0-1.22-.86l-3.82 5.43-1.77-1.77a.75.75 0 1 0-1.06 1.06l2.4 2.4c.33.33.87.29 1.14-.08l5.39-6.18Z" clipRule="evenodd"/></svg>
              <div className="text-sm font-medium">Profile updated successfully</div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-4 sm:px-6 py-4 rounded-none gap-4 w-full">
        <div className="font-bold text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Edit Profile</div>
        <button 
          onClick={() => navigate('/profile')} 
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md w-full sm:w-auto"
        >
          ← Back to Profile
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-2 flex-1 min-h-0">
        <nav className="w-full lg:w-64 bg-[#202020] rounded-none p-2 sticky top-0 self-start z-10 overflow-y-auto max-h-screen">
          <ul ref={navListRef} className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
              <li>
                <a
                  href="#personal"
                  onClick={(e) => { e.preventDefault(); setActiveTab('personal'); const el = document.getElementById('personal'); if (el) requestAnimationFrame(()=> el.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
                  className={activeTab === 'personal' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Personal
                </a>
              </li>
              <li>
                <a
                  href="#academic"
                  onClick={(e) => { e.preventDefault(); setActiveTab('academic'); const el = document.getElementById('academic'); if (el) requestAnimationFrame(()=> el.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
                  className={activeTab === 'academic' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Academic
                </a>
              </li>
              <li>
                <a
                  href="#placement"
                  onClick={(e) => { e.preventDefault(); setActiveTab('placement'); const el = document.getElementById('placement'); if (el) requestAnimationFrame(()=> el.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
                  className={activeTab === 'placement' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Placement
                </a>
              </li>
              <li>
                <a
                  href="#skills"
                  onClick={(e) => { e.preventDefault(); setActiveTab('skills'); const el = document.getElementById('skills'); if (el) requestAnimationFrame(()=> el.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
                  className={activeTab === 'skills' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Skills
                </a>
              </li>
              <li>
                <a
                  href="#other"
                  onClick={(e) => { e.preventDefault(); setActiveTab('other'); const el = document.getElementById('other'); if (el) requestAnimationFrame(()=> el.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
                  className={activeTab === 'other' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Highlights
                </a>
              </li>
              <li>
                <a
                  href="#links"
                  onClick={(e) => { e.preventDefault(); setActiveTab('links'); const el = document.getElementById('links'); if (el) requestAnimationFrame(()=> el.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
                  className={activeTab === 'links' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Links
                </a>
              </li>
            </ul>
          </nav>

          <section className="flex-1 lg:ml-2 bg-[#181818] rounded-none p-4 sm:p-6 fade-in min-h-0 overflow-hidden w-full">
            <div className="bg-[#242424] rounded-none p-4 border-0 space-y-6 h-full overflow-y-auto w-full">
              {error && <div className="text-red-400 text-sm mb-4 p-2 bg-red-900/20 rounded">{error}</div>}
              
              <form onSubmit={submit} className="space-y-6">
                {/* Personal Information */}
                <div id="personal" className="scroll-mt-28 sm:scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-sky-600">Personal Information</h2>
                  
                  {/* Profile Image Section */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-neutral-800/50 to-neutral-700/50 rounded-lg border border-neutral-600">
                    <h3 className="text-lg font-semibold text-neutral-300 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Photo
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Current photo preview */}
                      <div className="flex-shrink-0">
                        {form.profilePhoto ? (
                          <div className="relative group">
                            <img 
                              src={form.profilePhoto} 
                              alt="Profile preview" 
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-neutral-500 shadow-lg"
                            />
                            {form.profilePhoto && (
                              <button
                                type="button"
                                onClick={removeProfilePhoto}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-100 transition-opacity duration-200"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-700 border-3 border-dashed border-neutral-500 flex items-center justify-center">
                            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Upload controls */}
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading || !!form.profilePhoto}
                            className="hidden"
                            id="profile-photo-upload"
                          />
                          <label
                            htmlFor="profile-photo-upload"
                            className={`group relative flex items-center justify-center w-full px-4 py-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                              uploading || !!form.profilePhoto
                                ? 'border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-not-allowed' 
                                : 'border-neutral-500 bg-neutral-800/30 text-neutral-300 hover:border-neutral-400 hover:bg-neutral-700/40 hover:text-neutral-200 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <svg 
                                className={`w-5 h-5 transition-colors ${
                                  uploading || !!form.profilePhoto
                                    ? 'text-neutral-500' 
                                    : 'text-neutral-400 group-hover:text-neutral-300'
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                                />
                              </svg>
                              <span className="text-sm font-medium">
                                {uploading 
                                  ? 'Uploading...' 
                                  : form.profilePhoto 
                                    ? 'Remove current image to upload new one' 
                                    : 'Upload Photo'
                                }
                              </span>
                            </div>
                          </label>
                        </div>
                        
                        {/* Upload error */}
                        {uploadError && (
                          <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded">
                            {uploadError}
                          </div>
                        )}
                        
                        <div className="text-xs text-neutral-400 bg-neutral-800/30 rounded-md p-2 border border-neutral-700/50">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">First Name *</label>
                      <input 
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.name || ''} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Last Name</label>
                      <input 
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.lastName || ''} 
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Register Number *</label>
                      <input 
                        className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300" 
                        value={form.registerNumber || ''} 
                        readOnly
                        aria-readonly="true"
                      />
                      <div className="text-xs text-neutral-500">This cannot be changed.</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Email *</label>
                      <div className="space-y-2">
                        <input 
                          type="email"
                          className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                          value={form.email || ''} 
                          onChange={(e) => {
                            const val = e.target.value
                            setForm({ ...form, email: val })
                            const changed = val.trim().toLowerCase() !== (originalEmail || '').toString().trim().toLowerCase()
                            if (changed) {
                              setOtpVerified(false)
                            }
                          }}
                          required
                        />
                        {(() => {
                          const changed = (form.email || '').toString().trim().toLowerCase() !== (originalEmail || '').toString().trim().toLowerCase()
                          if (!changed) return null
                          return (
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <button
                                  type="button"
                                  disabled={otpSending || !form.email}
                                  onClick={async () => {
                                    setError(null)
                                    setOtpSending(true)
                                    try {
                                      await api.post('/auth/otp/send', { email: form.email, purpose: 'email_change' })
                                      setOtpSent(true)
                                      setShowEmailSpamPopup(true)
                                    } catch (err:any) {
                                      setError(err?.response?.data?.error || 'Failed to send OTP')
                                    } finally {
                                      setOtpSending(false)
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-md bg-purple-700 hover:bg-purple-600 text-white text-sm disabled:opacity-60 border border-purple-500 w-full sm:w-auto"
                                >{otpSending ? 'Sending...' : (otpSent ? 'Resend OTP' : 'Send OTP')}</button>
                                {otpVerified && <span className="text-emerald-400 text-sm">Verified ✓</span>}
                              </div>
                              {otpSent && !otpVerified && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <OTPInput value={otpCode} onChange={(next)=> setOtpCode(next.replace(/\s/g,''))} />
                                  <button
                                    type="button"
                                    disabled={otpVerifying || otpCode.length !== 6}
                                    onClick={async () => {
                                      setError(null)
                                      setOtpVerifying(true)
                                      try {
                                        await api.post('/auth/otp/verify', { email: form.email, purpose: 'email_change', code: otpCode })
                                        setOtpVerified(true)
                                      } catch (err:any) {
                                        setError(err?.response?.data?.error || 'OTP verification failed')
                                        setOtpVerified(false)
                                      } finally {
                                        setOtpVerifying(false)
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-sm disabled:opacity-60 w-full sm:w-auto"
                                  >{otpVerifying ? 'Verifying...' : 'Verify'}</button>
                                </div>
                              )}
                              <div className="text-[11px] text-neutral-400">Verify your new email address to save changes</div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Phone</label>
                      <input 
                        type="tel"
                        inputMode="numeric"
                        pattern="^[0-9]{10}$"
                        maxLength={10}
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={(form.phone || '').toString().replace(/\D/g,'').slice(0,10)} 
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setForm({ ...form, phone: digits })
                        }}
                        placeholder="Enter 10-digit mobile number"
                        title="Enter exactly 10 digits"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Date of Birth</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.dob ? new Date(form.dob).toISOString().substring(0,10) : ''} 
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Gender</label>
                      <select 
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.gender || ''} 
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Department *</label>
                      <div className="relative">
                        <select 
                          className="w-full px-4 py-3 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500 text-white appearance-none cursor-pointer text-base sm:text-sm" 
                          value={form.department || ''} 
                          onChange={(e) => setForm({ ...form, department: e.target.value })}
                          required
                        >
                          <option value="">Select Department</option>
                          {deptOptions.map(d => (
                            <option key={d.name} value={d.name}>{d.fullName || d.name} ({d.name})</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Year *</label>
                      <div className="relative">
                        <select 
                          className="w-full px-4 py-3 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500 text-white appearance-none cursor-pointer text-base sm:text-sm" 
                          value={form.year || ''} 
                          onChange={(e) => setForm({ ...form, year: e.target.value })}
                          required
                        >
                          <option value="">Select Year</option>
                          <option value="First">First Year</option>
                          <option value="Second">Second Year</option>
                          <option value="Third">Third Year</option>
                          <option value="Final">Final Year</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Current Semester placed after Year */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Current Semester</label>
                      <select 
                        className="w-full px-4 py-3 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500 text-white" 
                        value={form.academic?.currentSemester ?? ''}
                        onChange={(e) => setForm({ ...form, academic: { ...(form.academic || {}), currentSemester: Number(e.target.value) } })}
                      >
                        <option value="">Select Semester</option>
                        {[1,2,3,4,5,6,7,8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-sm font-medium">Address</label>
                      <textarea 
                        rows={3}
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.address || ''} 
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                      />
                    </div>
                  </div>
        </div>

                {/* Academic Information */}
                <div id="academic" className="scroll-mt-28 sm:scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-emerald-600">Academic Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
                      <label className="text-sm font-medium">CGPA <span className="text-xs text-neutral-400">(Auto-calculated)</span></label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="10"
                        className="w-full px-3 py-2 rounded-md bg-neutral-700 border border-neutral-600 text-neutral-400 cursor-not-allowed" 
                        value={form.academic?.cgpa || ''} 
                        readOnly
                        disabled
                      />
                      <p className="text-xs text-neutral-500">CGPA is automatically calculated from semester results</p>
          </div>
          <div className="space-y-1">
                      <label className="text-sm font-medium">HSC Percentage</label>
                      <input 
                        type="number" step="0.01" min="0" max="100"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.academic?.hscPercentage ?? ''} 
                        onChange={(e) => setForm({ ...form, academic: { ...(form.academic || {}), hscPercentage: Number(e.target.value) } })}
                        placeholder="e.g., 85.50"
                      />
          </div>
          <div className="space-y-1">
                      <label className="text-sm font-medium">SSLC Percentage</label>
                      <input 
                        type="number" step="0.01" min="0" max="100"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.academic?.sslcPercentage ?? ''} 
                        onChange={(e) => setForm({ ...form, academic: { ...(form.academic || {}), sslcPercentage: Number(e.target.value) } })}
                        placeholder="e.g., 92.00"
                      />
          </div>
          <div className="space-y-1">
                      <label className="text-sm font-medium">History of Arrears</label>
                      <select 
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500"
                        value={
                          form.academic?.historyOfArrears === 0 || form.academic?.historyOfArrears === undefined
                            ? 'none'
                            : String(form.academic?.historyOfArrears)
                        }
                        onChange={(e) => {
                          const val = e.target.value === 'none' ? 0 : Number(e.target.value)
                          setForm({ ...form, academic: { ...(form.academic || {}), historyOfArrears: val } })
                        }}
                      >
                        <option value="none">None</option>
                        {Array.from({ length: 60 }).map((_, i) => (
                          <option key={i+1} value={i+1}>{i+1}</option>
                        ))}
                      </select>
          </div>
          <div className="space-y-1">
                      <label className="text-sm font-medium">Current Arrears</label>
                      <select 
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500"
                        value={
                          form.academic?.currentArrears === 0 || form.academic?.currentArrears === undefined
                            ? 'none'
                            : String(form.academic?.currentArrears)
                        }
                        onChange={(e) => {
                          const val = e.target.value === 'none' ? 0 : Number(e.target.value)
                          setForm({ ...form, academic: { ...(form.academic || {}), currentArrears: val } })
                        }}
                      >
                        <option value="none">None</option>
                        {Array.from({ length: 60 }).map((_, i) => (
                          <option key={i+1} value={i+1}>{i+1}</option>
                        ))}
                      </select>
          </div>
          
          </div>
        </div>

                {/* Placement Information */}
                <div id="placement" className="scroll-mt-28 sm:scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-rose-600">Placement Information</h2>

                  {/* Placement Willingness */}
                  <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
                    <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-3 sm:mb-4">Placement Status</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="text-base sm:text-lg font-medium mb-2 sm:mb-3 block">Are you willing to participate in placement?</label>
                        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
                          <label className="flex items-center gap-2 cursor-pointer whitespace-normal break-words">
                            <input 
                              type="radio" 
                              name="willingToPlace" 
                              value="true"
                              checked={form.placement?.willingToPlace === true}
                              onChange={(e) => setForm({ 
                                ...form, 
                                placement: { 
                                  ...form.placement, 
                                  willingToPlace: e.target.value === 'true' 
                                } 
                              })}
                              className="w-5 h-5 text-green-500"
                            />
                            <span className="text-green-400 font-medium text-sm sm:text-base">Yes, I'm interested</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer whitespace-normal break-words">
                            <input 
                              type="radio" 
                              name="willingToPlace" 
                              value="false"
                              checked={form.placement?.willingToPlace === false}
                              onChange={(e) => setForm({ 
                                ...form, 
                                placement: { 
                                  ...form.placement, 
                                  willingToPlace: e.target.value === 'true' 
                                } 
                              })}
                              className="w-5 h-5 text-red-500"
                            />
                            <span className="text-red-400 font-medium text-sm sm:text-base">No, not interested</span>
                          </label>
                        </div>
                      </div>
                      {/* preference removed */}
                    </div>
                  </div>

                  {/* Removed old summary textareas in favor of chip-style editors below */}
                </div>

                {/* Skills */}
                <div id="skills" className="scroll-mt-28 sm:scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-violet-600">Skills</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Technical Skills</h3>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text"
                            className="flex-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                            placeholder="Add technical skills (e.g., JavaScript, Python, React or c,python,java)"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addSkill('technical', e.currentTarget.value)
                                e.currentTarget.value = ''
                              }
                            }}
                          />
                          <button 
                            type="button"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement
                              addSkill('technical', input.value)
                              input.value = ''
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md w-auto text-sm"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {form.placement?.technicalSkills?.map((skill: string, index: number) => (
                            <span key={index} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded-md">
                              {skill}
                              <button 
                                type="button"
                                onClick={() => removeSkill('technical', index)}
                                className="ml-1 text-blue-200 hover:text-white"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Soft Skills</h3>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text"
                            className="flex-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                            placeholder="Add soft skills (e.g., Problem Solving, Critical Thinking or communication,leadership)"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addSkill('logical', e.currentTarget.value)
                                e.currentTarget.value = ''
                              }
                            }}
                          />
                          <button 
                            type="button"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement
                              addSkill('logical', input.value)
                              input.value = ''
                            }}
                            className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md w-auto text-sm"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {form.placement?.logicalSkills?.map((skill: string, index: number) => (
                            <span key={index} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded-md">
                              {skill}
                              <button 
                                type="button"
                                onClick={() => removeSkill('logical', index)}
                                className="ml-1 text-green-200 hover:text-white"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
          </div>
        </div>

                {/* Highlights (Achievements, Projects, Internships, Certifications) */}
                <div id="other" className="scroll-mt-28 sm:scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-amber-500">Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Achievements */}
                    <div>
                      <h3 className="font-medium mb-2">Achievements</h3>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" className="flex-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" placeholder="Add an achievement" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); const val = (e.currentTarget as HTMLInputElement).value.trim(); if (!val) return; const items = (form.placement?.achievements || '').split('\n').filter(Boolean); items.push(val); setForm({ ...form, placement: { ...form.placement, achievements: items.join('\n') } }); (e.currentTarget as HTMLInputElement).value = ''; } }} />
                          <button type="button" onClick={(e) => { const input = (e.currentTarget.previousElementSibling as HTMLInputElement); const val = input.value.trim(); if (!val) return; const items = (form.placement?.achievements || '').split('\n').filter(Boolean); items.push(val); setForm({ ...form, placement: { ...form.placement, achievements: items.join('\n') } }); input.value=''; }} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md w-auto text-sm">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">{(form.placement?.achievements || '').split('\n').filter(Boolean).map((item: string, idx: number) => (<span key={idx} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded-md">{item}<button type="button" onClick={() => { const items = (form.placement?.achievements || '').split('\n').filter(Boolean); items.splice(idx,1); setForm({ ...form, placement: { ...form.placement, achievements: items.join('\n') } }); }} className="ml-1 text-blue-200 hover:text-white">×</button></span>))}</div>
                      </div>
                    </div>

                    {/* Projects */}
                    <div>
                      <h3 className="font-medium mb-2">Projects</h3>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" className="flex-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" placeholder="Add a project" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); const val = (e.currentTarget as HTMLInputElement).value.trim(); if (!val) return; const items = (form.placement?.workExperience || form.placement?.projects || '').split('\n').filter(Boolean); items.push(val); setForm({ ...form, placement: { ...form.placement, workExperience: items.join('\n') } }); (e.currentTarget as HTMLInputElement).value=''; } }} />
                          <button type="button" onClick={(e) => { const input = (e.currentTarget.previousElementSibling as HTMLInputElement); const val = input.value.trim(); if (!val) return; const items = (form.placement?.workExperience || form.placement?.projects || '').split('\n').filter(Boolean); items.push(val); setForm({ ...form, placement: { ...form.placement, workExperience: items.join('\n') } }); input.value=''; }} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md w-auto text-sm">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">{(form.placement?.workExperience || form.placement?.projects || '').split('\n').filter(Boolean).map((item: string, idx: number) => (<span key={idx} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded-md">{item}<button type="button" onClick={() => { const items = (form.placement?.workExperience || form.placement?.projects || '').split('\n').filter(Boolean); items.splice(idx,1); setForm({ ...form, placement: { ...form.placement, workExperience: items.join('\n') } }); }} className="ml-1 text-green-200 hover:text-white">×</button></span>))}</div>
                      </div>
                    </div>

                    {/* Internships */}
                    <div>
                      <h3 className="font-medium mb-2">Internships</h3>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" className="flex-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" placeholder="Add an internship (e.g., Company - Role)" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); const val = (e.currentTarget as HTMLInputElement).value.trim(); if (!val) return; const items = (form.placement?.internships || '').split('\n').filter(Boolean); items.push(val); setForm({ ...form, placement: { ...form.placement, internships: items.join('\n') } }); (e.currentTarget as HTMLInputElement).value=''; } }} />
                          <button type="button" onClick={(e) => { const input = (e.currentTarget.previousElementSibling as HTMLInputElement); const val = input.value.trim(); if (!val) return; const items = (form.placement?.internships || '').split('\n').filter(Boolean); items.push(val); setForm({ ...form, placement: { ...form.placement, internships: items.join('\n') } }); input.value=''; }} className="px-2.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md w-auto text-sm">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">{(form.placement?.internships || '').split('\n').filter(Boolean).map((item: string, idx: number) => (<span key={idx} className="flex items-center gap-1 px-2 py-1 bg-teal-600 text-white text-sm rounded-md">{item}<button type="button" onClick={() => { const items = (form.placement?.internships || '').split('\n').filter(Boolean); items.splice(idx,1); setForm({ ...form, placement: { ...form.placement, internships: items.join('\n') } }); }} className="ml-1 text-teal-200 hover:text-white">×</button></span>))}</div>
                      </div>
                    </div>

                    {/* Certifications */}
                    <div>
                      <h3 className="font-medium mb-2">Certifications</h3>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" className="flex-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" placeholder="Add a certification" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); const val = (e.currentTarget as HTMLInputElement).value.trim(); if (!val) return; const items = (form.placement?.certifications || '').split('\n').filter(Boolean); items.push(val); setForm({ ...form, placement: { ...form.placement, certifications: items.join('\n') } }); (e.currentTarget as HTMLInputElement).value=''; } }} />
                          <button type="button" onClick={(e) => { const input = (e.currentTarget.previousElementSibling as HTMLInputElement); const val = input.value.trim(); if (!val) return; const items = (form.placement?.certifications || '').split('\n').filter(Boolean); items.push(val); setForm({ ...form, placement: { ...form.placement, certifications: items.join('\n') } }); input.value=''; }} className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md w-auto text-sm">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">{(form.placement?.certifications || '').split('\n').filter(Boolean).map((item: string, idx: number) => (<span key={idx} className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-sm rounded-md">{item}<button type="button" onClick={() => { const items = (form.placement?.certifications || '').split('\n').filter(Boolean); items.splice(idx,1); setForm({ ...form, placement: { ...form.placement, certifications: items.join('\n') } }); }} className="ml-1 text-purple-200 hover:text-white">×</button></span>))}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div id="links" className="scroll-mt-28 sm:scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-cyan-500">Links</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
                      <label className="text-sm font-medium">Resume URL</label>
                      <input 
                        type="url"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.links?.resume || ''} 
                        onChange={(e) => setForm({ ...form, links: { ...form.links, resume: e.target.value } })}
                        placeholder="https://example.com/resume.pdf"
                      />
          </div>
          <div className="space-y-1">
                      <label className="text-sm font-medium">Portfolio URL</label>
                      <input 
                        type="url"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.links?.portfolio || ''} 
                        onChange={(e) => setForm({ ...form, links: { ...form.links, portfolio: e.target.value } })}
                        placeholder="https://example.com/portfolio"
                      />
          </div>
          <div className="space-y-1">
                      <label className="text-sm font-medium">LinkedIn URL</label>
                      <input 
                        type="url"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.links?.linkedin || ''} 
                        onChange={(e) => setForm({ ...form, links: { ...form.links, linkedin: e.target.value } })}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
          </div>
          <div className="space-y-1">
                      <label className="text-sm font-medium">GitHub URL</label>
                      <input 
                        type="url"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.links?.github || ''} 
                        onChange={(e) => setForm({ ...form, links: { ...form.links, github: e.target.value } })}
                        placeholder="https://github.com/yourusername"
                      />
                    </div>
          </div>
        </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-700">
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="px-6 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium w-full sm:w-auto"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="px-6 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600 text-white font-medium w-full sm:w-auto" 
                    onClick={() => navigate('/profile')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {content}
      <Footer />
      <EmailSpamPopup 
        show={showEmailSpamPopup} 
        onClose={() => setShowEmailSpamPopup(false)} 
        type="otp"
      />
    </div>
  )
}
