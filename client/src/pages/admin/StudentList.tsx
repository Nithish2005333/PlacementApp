import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../lib/api'

export default function StudentList() {
  const q = new URLSearchParams(useLocation().search)
  const year = q.get('year') || ''
  const department = q.get('department') || ''
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/students', { params: { year, department } })
      setRows(data)
    })()
  }, [year, department])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">{year} • {department}</h1>
      <div className="bg-neutral-900 rounded-lg border border-neutral-800">
        <div className="grid grid-cols-2 p-3 border-b border-neutral-800 text-sm text-neutral-400">
          <div>Register Number</div>
          <div>Name</div>
        </div>
        {rows.map(s => (
          <Link to={`/admin/students/${s._id}`} key={s._id} className="grid grid-cols-2 p-3 hover:bg-neutral-800">
            <div>{s.registerNumber}</div>
            <div>{s.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}



