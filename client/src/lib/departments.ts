import api from './api'

export type DepartmentOption = { name: string; fullName: string }

type Listener = (depts: DepartmentOption[]) => void

class DepartmentsStore {
  private listeners: Set<Listener> = new Set()
  private cache: DepartmentOption[] | null = null
  private loading = false
  private listeningStorage = false

  getCached(): DepartmentOption[] | null { return this.cache }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    if (this.cache) listener(this.cache)
    if (!this.listeningStorage && typeof window !== 'undefined') {
      this.listeningStorage = true
      window.addEventListener('storage', (e) => {
        if (e.key === 'departments_version') {
          this.refresh()
        }
      })
    }
    return () => { this.listeners.delete(listener); return undefined as unknown as void }
  }

  private emit() {
    if (!this.cache) return
    for (const l of this.listeners) l(this.cache)
  }

  async load(force = false) {
    if (this.loading) return
    if (this.cache && !force) return
    this.loading = true
    try {
      const { data } = await api.get('/public/departments')
      const defaults: DepartmentOption[] = [
        { name: 'CSE', fullName: 'Computer Science & Engineering' },
        { name: 'AI&DS', fullName: 'Artificial Intelligence & Data Science' },
        { name: 'Mech', fullName: 'Mechanical Engineering' },
        { name: 'ECE', fullName: 'Electronics & Communication Engineering' },
        { name: 'EEE', fullName: 'Electrical & Electronics Engineering' },
        { name: 'VLSI', fullName: 'VLSI Design' },
      ]
      const fromApi: DepartmentOption[] = Array.isArray(data) ? data : []
      // Merge like delete modal: combine with defaults, de-duplicate by case-insensitive name, sort by name
      const seen = new Set<string>()
      const merged: DepartmentOption[] = []
      ;[...fromApi, ...defaults].forEach(d => {
        const key = String(d.name || '').trim().toLowerCase()
        if (!key) return
        if (seen.has(key)) return
        seen.add(key)
        merged.push({ name: d.name, fullName: d.fullName || d.name })
      })
      const options: DepartmentOption[] = merged.sort((a, b) => a.name.localeCompare(b.name))
      this.cache = options
      try { localStorage.setItem('departments', JSON.stringify(options)) } catch {}
      try { localStorage.setItem('departments_version', String(Date.now())) } catch {}
      this.emit()
    } catch {
      // Try localStorage cache
      try {
        const raw = localStorage.getItem('departments')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cache = parsed
            this.emit()
          }
        }
      } catch {}
    } finally {
      this.loading = false
    }
  }

  async refresh() {
    this.cache = null
    await this.load(true)
  }
}

export const departmentsStore = new DepartmentsStore()


