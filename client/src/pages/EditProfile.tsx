import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function EditProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'placement' | 'skills' | 'other' | 'links'>('personal')
  const navListRef = useRef<HTMLUListElement | null>(null)

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
      } catch (e: any) {
        if (e.response?.status === 401) navigate('/login')
      }
    })()
  }, [navigate])

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
    try {
      const combinedName = [form.name, form.lastName].filter(Boolean).join(' ').trim()
      const payload: any = {
        name: combinedName,
        registerNumber: form.registerNumber,
        email: form.email,
        department: form.department,
        year: form.year,
        profilePhoto: form.profilePhoto,
        dob: form.dob,
        address: form.address,
        phone: form.phone,
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
    const currentSkills = form.placement?.[`${type}Skills`] || []
    if (!currentSkills.includes(skill.trim())) {
      setForm({
        ...form,
        placement: {
          ...form.placement,
          [`${type}Skills`]: [...currentSkills, skill.trim()]
        }
      })
    }
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

  return (
    <div className="max-w-7xl mx-auto p-4 pt-2 sm:pt-4">
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111] text-white px-4 sm:px-6 py-4 rounded-md gap-4">
          <div className="font-bold text-3xl bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Edit Profile</div>
          <button 
            onClick={() => navigate('/profile')} 
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md w-full sm:w-auto"
          >
            ← Back to Profile
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <nav className="w-full lg:w-56 bg-[#202020] rounded-md p-2 lg:sticky lg:top-4 lg:max-h-[80vh] lg:overflow-y-auto sticky top-0 z-20 bg-[#202020]/95 backdrop-blur supports-[backdrop-filter]:bg-[#202020]/80">
            <ul ref={navListRef} className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-y-auto overscroll-x-contain snap-x snap-mandatory">
              <li>
                <a
                  href="#personal"
                  onClick={(e) => { e.preventDefault(); setActiveTab('personal'); document.getElementById('personal')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={activeTab === 'personal' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Personal
                </a>
              </li>
              <li>
                <a
                  href="#academic"
                  onClick={(e) => { e.preventDefault(); setActiveTab('academic'); document.getElementById('academic')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={activeTab === 'academic' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Academic
                </a>
              </li>
              <li>
                <a
                  href="#placement"
                  onClick={(e) => { e.preventDefault(); setActiveTab('placement'); document.getElementById('placement')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={activeTab === 'placement' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Placement
                </a>
              </li>
              <li>
                <a
                  href="#skills"
                  onClick={(e) => { e.preventDefault(); setActiveTab('skills'); document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={activeTab === 'skills' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Skills
                </a>
              </li>
              <li>
                <a
                  href="#other"
                  onClick={(e) => { e.preventDefault(); setActiveTab('other'); document.getElementById('other')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={activeTab === 'other' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Highlights
                </a>
              </li>
              <li>
                <a
                  href="#links"
                  onClick={(e) => { e.preventDefault(); setActiveTab('links'); document.getElementById('links')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={activeTab === 'links' ? 'block px-3 py-2 bg-[#333] text-white rounded border-l-4 border-sky-600 whitespace-nowrap text-sm lg:text-base snap-start' : 'block px-3 py-2 text-neutral-300 hover:text-white hover:bg-[#333] rounded whitespace-nowrap text-sm lg:text-base snap-start'}
                >
                  Links
                </a>
              </li>
            </ul>
          </nav>

          <section className="flex-1 bg-[#181818] rounded-md p-4 sm:p-6 fade-in">
            <div className="bg-[#242424] rounded-md p-4 border border-neutral-800 space-y-8">
              {error && <div className="text-red-400 text-sm mb-4 p-2 bg-red-900/20 rounded">{error}</div>}
              
              <form onSubmit={submit} className="space-y-6">
                {/* Personal Information */}
                <div id="personal" className="scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-sky-600">Personal Information</h2>
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
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.registerNumber || ''} 
                        onChange={(e) => setForm({ ...form, registerNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Email *</label>
                      <input 
                        type="email"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.email || ''} 
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Phone</label>
                      <input 
                        type="tel"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.phone || ''} 
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                          <option value="CSE">Computer Science & Engineering (CSE)</option>
                          <option value="AI&DS">Artificial Intelligence & Data Science (AI&DS)</option>
                          <option value="Mech">Mechanical Engineering (Mech)</option>
                          <option value="ECE">Electronics & Communication Engineering (ECE)</option>
                          <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
                          <option value="VLSI">VLSI Design (VLSI)</option>
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
                          <option value="Fourth">Final Year</option>
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
        <div className="space-y-1">
                      <label className="text-sm font-medium">Profile Photo URL</label>
                      <input 
                        type="url"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.profilePhoto || ''} 
                        onChange={(e) => setForm({ ...form, profilePhoto: e.target.value })}
                      />
        </div>
        <div className="space-y-1">
                      <label className="text-sm font-medium">College Name</label>
                      <input 
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.collegeName || ''} 
                        onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                      />
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
                <div id="academic" className="scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-emerald-600">Academic Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
                      <label className="text-sm font-medium">CGPA</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="10"
                        className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                        value={form.academic?.cgpa || ''} 
                        onChange={(e) => setForm({ ...form, academic: { ...(form.academic || {}), cgpa: Number(e.target.value) } })}
                      />
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
                <div id="placement" className="scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
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
                <div id="skills" className="scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 pl-3 border-l-4 border-violet-600">Skills</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Technical Skills</h3>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text"
                            className="flex-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-sky-500" 
                            placeholder="Add technical skill (e.g., JavaScript, Python, React)"
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
                            placeholder="Add logical skill (e.g., Problem Solving, Critical Thinking)"
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
                <div id="other" className="scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
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
                <div id="links" className="scroll-mt-24 bg-[#1f1f1f] p-4 rounded-md border border-neutral-800">
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
    </div>
  )
}



