import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../lib/api'

export default function StudentDetails() {
  const { id } = useParams()
  const [s, setS] = useState<any | null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/students/${id}`)
      setS(data)
    })()
  }, [id])

  if (!s) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{s.name}</h1>
      <div className="text-neutral-400">{s.registerNumber} • {s.department} • {s.year}</div>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
          <h2 className="font-semibold mb-2">Personal</h2>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify({ email: s.email, phone: s.phone, address: s.address }, null, 2)}</pre>
        </section>
        <section className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
          <h2 className="font-semibold mb-2">Academic</h2>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(s.academic, null, 2)}</pre>
        </section>
      </div>
      <section className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
        <h2 className="font-semibold mb-2">Placement</h2>
        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(s.placement, null, 2)}</pre>
      </section>
      <section className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
        <h2 className="font-semibold mb-2">Links</h2>
        <ul className="text-sm space-y-1">
          {s.links?.resume && <li><a className="text-sky-400" target="_blank" href={s.links.resume}>Resume</a></li>}
          {s.links?.portfolio && <li><a className="text-sky-400" target="_blank" href={s.links.portfolio}>Portfolio</a></li>}
          {s.links?.linkedin && <li><a className="text-sky-400" target="_blank" href={s.links.linkedin}>LinkedIn</a></li>}
          {s.links?.github && <li><a className="text-sky-400" target="_blank" href={s.links.github}>GitHub</a></li>}
        </ul>
      </section>
    </div>
  )
}



