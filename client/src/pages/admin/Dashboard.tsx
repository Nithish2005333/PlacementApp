import { Link } from 'react-router-dom'

const years = ['First','Second','Third','Fourth']

export default function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Select Year</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {years.map(y => (
          <Link key={y} to={`/admin/departments?year=${y}`} className="p-6 text-center rounded-lg bg-neutral-900 border border-neutral-800 hover:border-sky-600">
            {y}
          </Link>
        ))}
      </div>
    </div>
  )
}



