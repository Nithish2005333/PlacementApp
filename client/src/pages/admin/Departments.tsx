import { Link, useLocation } from 'react-router-dom'

const depts = ['CSE','AI&DS','Mech','ECE','EEE','VLSI']

export default function Departments() {
  const q = new URLSearchParams(useLocation().search)
  const year = q.get('year') || ''
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Select Department</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {depts.map(d => (
          <Link key={d} to={`/admin/students?year=${year}&department=${encodeURIComponent(d)}`} className="p-6 text-center rounded-lg bg-neutral-900 border border-neutral-800 hover:border-sky-600">
            {d}
          </Link>
        ))}
      </div>
    </div>
  )
}



