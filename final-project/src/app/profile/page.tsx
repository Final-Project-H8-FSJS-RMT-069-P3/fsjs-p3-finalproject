'use client'

import { useEffect, useState } from 'react'

type PsychiatristInfo = {
  certificate?: string
  experience?: number
  about?: string
  price?: number
  mode?: string
  speciality?: string[]
}

export default function ProfilePage () {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // id not used client-side; we keep only server-side id if needed
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'psychiatrist'>('user')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [psychiatristInfo, setPsychiatristInfo] = useState<PsychiatristInfo>({})

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to fetch profile')
        const d = data.data
        // id available as d.id if needed
        setName(d.name || '')
        setEmail(d.email || '')
        setRole(d.role || 'user')
        setPhoneNumber(d.phoneNumber || '')
        setAddress(d.address || '')
        setPsychiatristInfo(d.psychiatristInfo || {})
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/auth/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phoneNumber, address, psychiatristInfo })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update')
      setSuccess('Profile updated')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded mb-4">{success}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input value={email} disabled className="mt-1 block w-full p-2 border rounded bg-gray-100" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="mt-1 block w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full p-2 border rounded" />
        </div>

        {role === 'psychiatrist' && (
          <div className="p-4 border rounded space-y-3">
            <h2 className="font-semibold">Psychiatrist Info</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">About</label>
              <textarea value={psychiatristInfo.about || ''} onChange={e => setPsychiatristInfo(prev => ({ ...prev, about: e.target.value }))} className="mt-1 block w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
              <input type="number" value={psychiatristInfo.experience || ''} onChange={e => setPsychiatristInfo(prev => ({ ...prev, experience: Number(e.target.value) }))} className="mt-1 block w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (Rp)</label>
              <input type="number" value={psychiatristInfo.price || ''} onChange={e => setPsychiatristInfo(prev => ({ ...prev, price: Number(e.target.value) }))} className="mt-1 block w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mode</label>
              <input value={psychiatristInfo.mode || ''} onChange={e => setPsychiatristInfo(prev => ({ ...prev, mode: e.target.value }))} className="mt-1 block w-full p-2 border rounded" />
            </div>
          </div>
        )}

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
      </form>
    </div>
  )
}