import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import SuccessPopup from '../../components/SuccessPopup'
import ErrorPopup from '../../components/ErrorPopup'
import PasswordInput from '../../components/PasswordInput'
import api from '../../lib/api'
import { departmentsStore, type DepartmentOption } from '../../lib/departments'

interface Staff {
  username: string
  name?: string | null
  email?: string | null
  role: 'staff'
}

export default function StaffPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [search, setSearch] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [message, setMessage] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', department: '' })
  const [creating, setCreating] = useState(false)

  // Admin verification state (like Student/Reps pages)
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' })
  const [showCreateVerification, setShowCreateVerification] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeleteVerification, setShowDeleteVerification] = useState(false)
  const [deletingUsername, setDeletingUsername] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function showSuccessMessage(m: string) { setMessage(m); setShowSuccess(true) }
  function showErrorMessage(m: string) { setMessage(m); setShowError(true) }

  const load = async () => {
    try {
      setLoading(true)
      const staffRes = await api.get<Staff[]>('/admin/staff')
      setStaff(staffRes.data)
    } catch (e: any) {
      showErrorMessage(e?.response?.data?.error || 'Failed to load staff admins')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    departmentsStore.load()
    const unsub = departmentsStore.subscribe((list) => setDepartments(list))
    return () => { unsub() }
  }, [])

  // Create flow: proceed to verification
  const proceedCreate = () => {
    if (!form.username || !form.password) { showErrorMessage('Username and password are required'); return }
    if (!form.department) { showErrorMessage('Department is required'); return }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { showErrorMessage('Invalid email'); return }
    setCreateOpen(false)
    setShowCreateVerification(true)
  }

  const cancelCreateVerification = () => {
    setShowCreateVerification(false)
    setAdminCredentials({ username: '', password: '' })
  }

  const verifyAndCreateStaff = async () => {
    if (!adminCredentials.username || !adminCredentials.password) { showErrorMessage('Please enter both username and password'); return }
    try {
      setCreating(true)
      const verify = await api.post('/admin/verify', adminCredentials)
      if (!verify.data?.valid) { showErrorMessage('Invalid admin credentials'); setCreating(false); return }
      await api.post('/admin/staff', {
        username: form.username.trim(),
        password: form.password,
        name: form.name?.trim() || undefined,
        email: form.email?.trim().toLowerCase() || undefined,
        department: form.department?.trim() || undefined,
      })
      setShowCreateVerification(false)
      setAdminCredentials({ username: '', password: '' })
      setForm({ username: '', password: '', name: '', email: '', department: '' })
      showSuccessMessage('Staff admin created')
      load()
    } catch (e: any) {
      showErrorMessage(e?.response?.data?.error || 'Failed to create staff admin')
    } finally { setCreating(false) }
  }

  // Delete flow with verification
  const openDeleteModal = (username: string) => { setDeletingUsername(username); setShowDeleteModal(true) }
  const closeDeleteModal = () => { setShowDeleteModal(false); setDeletingUsername(null) }
  const proceedDelete = () => { setShowDeleteModal(false); setShowDeleteVerification(true) }
  const cancelDeleteVerification = () => { setShowDeleteVerification(false); setAdminCredentials({ username: '', password: '' }) }

  const verifyAndDeleteStaff = async () => {
    if (!deletingUsername) return
    if (!adminCredentials.username || !adminCredentials.password) { showErrorMessage('Please enter both username and password'); return }
    try {
      setDeleting(true)
      const verify = await api.post('/admin/verify', adminCredentials)
      if (!verify.data?.valid) { showErrorMessage('Invalid admin credentials'); setDeleting(false); return }
      await api.delete(`/admin/staff/${encodeURIComponent(deletingUsername)}`)
      setShowDeleteVerification(false)
      setAdminCredentials({ username: '', password: '' })
      setStaff(prev => prev.filter(s => s.username !== deletingUsername))
      setDeletingUsername(null)
      showSuccessMessage('Staff admin deleted')
    } catch (e: any) {
      showErrorMessage(e?.response?.data?.error || 'Failed to delete staff admin')
    } finally { setDeleting(false) }
  }

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    return staff
      .filter(s => !selectedDept || (s as any).department === selectedDept)
      .filter(s => !q || s.username.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q))
      .sort((a, b) => a.username.localeCompare(b.username))
  }, [staff, search, selectedDept])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-6xl w-full mx-auto p-3 sm:p-6 flex-1">
        <div className="mb-3 sm:mb-4">
          <button onClick={()=>navigate(-1)} className="px-3 py-2 border border-sky-700 text-sky-200 rounded hover:bg-sky-900/30 text-sm">← Back</button>
        </div>
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-neutral-800 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-between sticky top-0 z-10 bg-neutral-900/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/80">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">Manage Staff Admins</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select value={selectedDept} onChange={e=>setSelectedDept(e.target.value)} className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 appearance-none bg-no-repeat bg-right pr-8 w-full" style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 8px center', backgroundSize: '16px'}}>
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.name} value={d.name}>{d.name} - {d.fullName}</option>
                  ))}
                </select>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search username, name or email" className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-sky-600" />
              </div>
              <button onClick={()=>setCreateOpen(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm w-full sm:w-auto">+ Add Staff</button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-neutral-400">Loading...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">No staff admins found</div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
                {filteredStaff.map(s => (
                  <div key={s.username} className="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700 hover:border-neutral-600 transition-colors shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-700 text-sky-300 font-mono text-xs">{s.username}</span>
                        </div>
                        <div className="text-white text-sm font-semibold truncate">{s.name || '-'}</div>
                        <div className="text-neutral-300 text-[13px] break-all">{s.email || '-'}</div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-700/60 border border-neutral-600">Dept: {(s as any).department || '-'}</span>
                        </div>
                      </div>
                      <button onClick={()=>openDeleteModal(s.username)} className="h-9 px-3 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs active:scale-[0.98]">Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-neutral-800 text-neutral-300">
                      <th className="py-3 px-2">Username</th>
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Department</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map(s => (
                      <tr key={s.username} className="border-b border-neutral-900 hover:bg-neutral-800/40">
                        <td className="py-3 px-2 font-mono text-sky-300">{s.username}</td>
                        <td className="py-3 px-2">{s.name || '-'}</td>
                        <td className="py-3 px-2 break-all">{s.email || '-'}</td>
                        <td className="py-3 px-2">{(s as any).department || '-'}</td>
                        <td className="py-3 px-2 text-right">
                          <button onClick={()=>openDeleteModal(s.username)} className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      <SuccessPopup show={showSuccess} onClose={()=>setShowSuccess(false)} message={message} />
      <ErrorPopup show={showError} onClose={()=>setShowError(false)} message={message} />

      {createOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Add Staff Admin</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Username *</label>
                <input value={form.username} onChange={e=>setForm({...form, username: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Password *</label>
                <PasswordInput value={form.password} onChange={e=>setForm({...form, password: (e as any).target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
                <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Email</label>
                <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Department *</label>
                <select value={form.department} onChange={e=>setForm({...form, department: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600">
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d.name} value={d.name}>{d.name} - {d.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setCreateOpen(false)} className="px-3 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-sm">Cancel</button>
              <button disabled={creating} onClick={proceedCreate} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-sm">Continue to Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Verification Modal */}
      {showCreateVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Admin Verification Required</h3>
            <p className="text-sm text-neutral-300 mb-4">Please enter your admin credentials to create the staff admin.</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input value={adminCredentials.username} onChange={e=>setAdminCredentials({...adminCredentials, username: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                <PasswordInput value={adminCredentials.password} onChange={e=>setAdminCredentials({...adminCredentials, password: (e as any).target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelCreateVerification} disabled={creating} className="px-3 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-sm disabled:opacity-50">Cancel</button>
              <button onClick={verifyAndCreateStaff} disabled={creating || !adminCredentials.username || !adminCredentials.password} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-sm">{creating ? 'Creating...' : 'Create Staff'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && deletingUsername && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Staff Admin</h3>
            <p className="text-sm text-neutral-300 mb-4">Are you sure you want to delete <span className="font-semibold text-white">{deletingUsername}</span>? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={closeDeleteModal} className="px-3 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-sm">Cancel</button>
              <button onClick={proceedDelete} className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm">Continue to Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Verification Modal */}
      {showDeleteVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Admin Verification Required</h3>
            <p className="text-sm text-neutral-300 mb-4">Please enter your admin credentials to delete this staff admin.</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input value={adminCredentials.username} onChange={e=>setAdminCredentials({...adminCredentials, username: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                <PasswordInput value={adminCredentials.password} onChange={e=>setAdminCredentials({...adminCredentials, password: (e as any).target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDeleteVerification} disabled={deleting} className="px-3 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded text-sm disabled:opacity-50">Cancel</button>
              <button onClick={verifyAndDeleteStaff} disabled={deleting || !adminCredentials.username || !adminCredentials.password} className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded text-sm">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


