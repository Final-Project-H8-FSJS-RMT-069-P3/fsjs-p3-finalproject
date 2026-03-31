'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Swal from 'sweetalert2'

type PsychiatristInfo = {
  certificate?: string
  experience?: number
  about?: string
  price?: number
  mode?: string
  speciality?: string[]
  imageUrl?: string
  roleSpecialist?: string
  scheduleDays?: string[]
  scheduleTimes?: string[]
  paket?: { type: 'videocall' | 'chat-only' | 'offline'; price: number }[]
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
  const [newSpeciality, setNewSpeciality] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

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
      Swal.fire({
        title: 'Saving...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })
      const psychPayload = {
        ...psychiatristInfo,
        speciality: psychiatristInfo.speciality || [],
        scheduleDays: psychiatristInfo.scheduleDays || [],
        scheduleTimes: psychiatristInfo.scheduleTimes || [],
      }

      const res = await fetch('/api/auth/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phoneNumber, address, psychiatristInfo: psychPayload })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update')
      Swal.close()
      await Swal.fire({ icon: 'success', title: 'Information saved!' })
      setSuccess('Profile updated')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      Swal.close()
      await Swal.fire({ icon: 'error', title: 'Save failed', text: message })
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline">← Back to home</Link>
      </div>
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
              <label className="block text-sm font-medium text-gray-700">Certificate</label>
              <input value={psychiatristInfo.certificate || ''} onChange={e => setPsychiatristInfo(prev => ({ ...prev, certificate: e.target.value }))} className="mt-1 block w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role / Specialist</label>
              <input value={psychiatristInfo.roleSpecialist || ''} onChange={e => setPsychiatristInfo(prev => ({ ...prev, roleSpecialist: e.target.value }))} className="mt-1 block w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">About</label>
              <textarea value={psychiatristInfo.about || ''} onChange={e => setPsychiatristInfo(prev => ({ ...prev, about: e.target.value }))} className="mt-1 block w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Image URL</label>
              <input value={psychiatristInfo.imageUrl || ''} onChange={e => setPsychiatristInfo(prev => ({ ...prev, imageUrl: e.target.value }))} className="mt-1 block w-full p-2 border rounded" />
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Packages / Prices</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                <div>
                  <label className="block text-xs text-gray-600">Video Call (Rp)</label>
                  <input type="number" value={(psychiatristInfo.paket?.find(p => p.type === 'videocall')?.price ?? '') as any} onChange={e => {
                    const price = Number(e.target.value || 0)
                    setPsychiatristInfo(prev => {
                      const others = (prev.paket || []).filter(p => p.type !== 'videocall')
                      return { ...prev, paket: [...others, { type: 'videocall', price }] }
                    })
                  }} className="mt-1 block w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Chat Only (Rp)</label>
                  <input type="number" value={(psychiatristInfo.paket?.find(p => p.type === 'chat-only')?.price ?? '') as any} onChange={e => {
                    const price = Number(e.target.value || 0)
                    setPsychiatristInfo(prev => {
                      const others = (prev.paket || []).filter(p => p.type !== 'chat-only')
                      return { ...prev, paket: [...others, { type: 'chat-only', price }] }
                    })
                  }} className="mt-1 block w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Offline (Rp)</label>
                  <input type="number" value={(psychiatristInfo.paket?.find(p => p.type === 'offline')?.price ?? '') as any} onChange={e => {
                    const price = Number(e.target.value || 0)
                    setPsychiatristInfo(prev => {
                      const others = (prev.paket || []).filter(p => p.type !== 'offline')
                      return { ...prev, paket: [...others, { type: 'offline', price }] }
                    })
                  }} className="mt-1 block w-full p-2 border rounded" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Specialities</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  value={newSpeciality}
                  onChange={e => setNewSpeciality(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const val = newSpeciality.trim()
                      if (val) {
                        setPsychiatristInfo(prev => ({ ...prev, speciality: Array.from(new Set([...(prev.speciality || []), val])) }))
                        setNewSpeciality('')
                      }
                    }
                  }}
                  placeholder="Type and press Enter"
                  className="flex-1 p-2 border rounded"
                />
                <div className="flex flex-wrap gap-2">
                  {(psychiatristInfo.speciality || []).map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-200 rounded-full flex items-center gap-2">
                      <span>{tag}</span>
                      <button type="button" onClick={() => setPsychiatristInfo(prev => ({ ...prev, speciality: (prev.speciality || []).filter((_, idx) => idx !== i) }))} className="text-xs text-red-600">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Schedule Day</label>
              <div className="mt-1 grid grid-cols-3 grid-rows-2 gap-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                  const selected = (psychiatristInfo.scheduleDays || []).includes(day)
                  return (
                    <label key={day} className="relative">
                      <input
                        type="checkbox"
                        className="peer appearance-none absolute w-0 h-0 opacity-0"
                        checked={selected}
                        onChange={() => {
                          setPsychiatristInfo((prev) => {
                            const arr = new Set(prev.scheduleDays || [])
                            if (arr.has(day)) arr.delete(day)
                            else arr.add(day)
                            return { ...prev, scheduleDays: Array.from(arr) }
                          })
                        }}
                      />
                      <span
                        className={
                          `inline-block w-full text-center px-3 py-2 rounded-lg border border-blue-500 font-semibold cursor-pointer transition-colors text-base ` +
                          (selected ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 hover:bg-blue-100')
                        }
                      >
                        {day}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Schedule Time</label>
              <div className="mt-1 grid grid-cols-4 grid-rows-2 gap-2">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const hour = 9 + idx
                  const value = `${hour.toString().padStart(2, '0')}:00`
                  const display = `${value} - ${hour.toString().padStart(2, '0')}:50`
                  const selected = (psychiatristInfo.scheduleTimes || []).includes(value)
                  return (
                    <label key={value} className="relative">
                      <input
                        type="checkbox"
                        className="peer appearance-none absolute w-0 h-0 opacity-0"
                        checked={selected}
                        onChange={() => {
                          setPsychiatristInfo((prev) => {
                            const arr = new Set(prev.scheduleTimes || [])
                            if (arr.has(value)) arr.delete(value)
                            else arr.add(value)
                            return { ...prev, scheduleTimes: Array.from(arr) }
                          })
                        }}
                      />
                      <span
                        className={
                          `inline-block w-full text-center px-3 py-2 rounded-lg border border-blue-500 font-semibold cursor-pointer transition-colors text-sm ` +
                          (selected ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 hover:bg-blue-100')
                        }
                      >
                        {display}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Image</label>
              <div className="mt-1 flex items-center gap-4">
                {psychiatristInfo.imageUrl && (
                  <Image src={psychiatristInfo.imageUrl} alt="profile" width={80} height={80} className="object-cover rounded" />
                )}
                <div>
                  <input type="file" accept="image/*" onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadingImage(true)
                    try {
                      const reader = new FileReader()
                      const dataUrl: string = await new Promise((resolve, reject) => {
                        reader.onload = () => resolve(reader.result as string)
                        reader.onerror = () => reject(new Error('Failed to read file'))
                        reader.readAsDataURL(file)
                      })

                      const res = await fetch('/api/auth/upload-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: file.name, dataUrl })
                      })
                      const json = await res.json()
                      if (!res.ok) throw new Error(json.message || 'Upload failed')
                      setPsychiatristInfo(prev => ({ ...prev, imageUrl: json.url }))
                    } catch (err: unknown) {
                      const message = err instanceof Error ? err.message : 'Image upload failed'
                      setError(message)
                    } finally {
                      setUploadingImage(false)
                    }
                  }} />
                  {uploadingImage && <div className="text-sm text-gray-600">Uploading…</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
      </form>
    </div>
  )
}