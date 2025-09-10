import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function EditProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/students/me')
        setForm(data)
      } catch (e: any) {
        if (e.response?.status === 401) navigate('/login')
      }
    })()
  }, [navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.put('/students/me', form)
      navigate('/profile')
    } catch (e: any) {
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Profile</h1>
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        {[{ k:'name', l:'Full Name' },{ k:'registerNumber', l:'Register Number' },{ k:'department', l:'Department' },{ k:'year', l:'Year' },{ k:'profilePhoto', l:'Profile Photo URL' },{ k:'email', l:'Email' },{ k:'phone', l:'Phone' },{ k:'collegeName', l:'College Name' },{ k:'collegeAddress', l:'College Address' },{ k:'address', l:'Student Address' }].map(({k,l}) => (
          <div key={k} className="space-y-1">
            <label className="text-sm">{l}</label>
            <input className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-sm">DOB</label>
          <input type="date" className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none" value={form.dob ? new Date(form.dob).toISOString().substring(0,10) : ''} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Gender</label>
          <input className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
        </div>

        <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm">CGPA</label>
            <input type="number" step="0.01" className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.academic?.cgpa || ''} onChange={(e) => setForm({ ...form, academic: { ...form.academic, cgpa: Number(e.target.value) } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">History of Arrears</label>
            <input type="number" className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.academic?.historyOfArrears || ''} onChange={(e) => setForm({ ...form, academic: { ...form.academic, historyOfArrears: Number(e.target.value) } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Current Arrears</label>
            <input type="number" className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.academic?.currentArrears || ''} onChange={(e) => setForm({ ...form, academic: { ...form.academic, currentArrears: Number(e.target.value) } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Status</label>
            <input className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.academic?.status || ''} onChange={(e) => setForm({ ...form, academic: { ...form.academic, status: e.target.value } })} />
          </div>
        </div>

        <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm">Achievements</label>
            <textarea className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.placement?.achievements || ''} onChange={(e) => setForm({ ...form, placement: { ...form.placement, achievements: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Internship Details</label>
            <textarea className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.placement?.internships || ''} onChange={(e) => setForm({ ...form, placement: { ...form.placement, internships: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Work Experience</label>
            <textarea className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.placement?.workExperience || ''} onChange={(e) => setForm({ ...form, placement: { ...form.placement, workExperience: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Certifications</label>
            <textarea className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.placement?.certifications || ''} onChange={(e) => setForm({ ...form, placement: { ...form.placement, certifications: e.target.value } })} />
          </div>
        </div>

        <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm">Resume URL</label>
            <input className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.links?.resume || ''} onChange={(e) => setForm({ ...form, links: { ...form.links, resume: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Portfolio URL</label>
            <input className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.links?.portfolio || ''} onChange={(e) => setForm({ ...form, links: { ...form.links, portfolio: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">LinkedIn URL</label>
            <input className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.links?.linkedin || ''} onChange={(e) => setForm({ ...form, links: { ...form.links, linkedin: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">GitHub URL</label>
            <input className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700" value={form.links?.github || ''} onChange={(e) => setForm({ ...form, links: { ...form.links, github: e.target.value } })} />
          </div>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button disabled={saving} className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" className="px-4 py-2 rounded-md bg-neutral-700" onClick={() => navigate('/profile')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}



