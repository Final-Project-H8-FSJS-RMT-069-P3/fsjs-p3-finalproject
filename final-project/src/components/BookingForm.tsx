'use client'

import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

interface Doctor {
  _id: string
  name: string
  email: string
  role: string
  phoneNumber: string
  address: string
}

interface BookingFormProps {
  staffId: string // default selected doctor ID
}

export default function BookingForm({ staffId }: BookingFormProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState(staffId)
  const [date, setDate] = useState('')
  const [sessionDuration, setSessionDuration] = useState('30')
  const [amount, setAmount] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()

  // Fetch doctors on mount
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch('/api/getdoctors')
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Failed to fetch doctors")
        setDoctors(data.data) // <-- use the `data` array
        if (!selectedDoctorId && data.data.length > 0) {
          setSelectedDoctorId(data.data[0]._id)
        }
      } catch (err: any) {
        setError(err.message)
      }
    }
    fetchDoctors()
  }, [])

  const selectedDoctor = doctors.find(d => d._id === selectedDoctorId)

  async function handleBooking(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          staffId: selectedDoctorId,
          date,
          sessionDuration,
          amount
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to create booking")

      setSuccess(`Booking created! Doctor: ${selectedDoctor?.name}`)
      setDate('')
    } catch (err: any) {
      if (err.message.includes("Unauthorized")) window.location.href = "/login"
      setError(err.message)
    } finally {
      setIsLoading(false)
      router.push('/')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Book a Session</h2>

      {selectedDoctor && (
        <div className="mb-4 p-3 bg-gray-100 rounded-md">
          <p className="font-medium">Selected Doctor: {selectedDoctor.name}</p>
          <p className="text-sm text-gray-600">{selectedDoctor.role}</p>
          <p className="text-sm text-gray-600">{selectedDoctor.email}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-1 text-sm font-medium text-gray-700">Change Doctor</label>
        <select
          value={selectedDoctorId}
          onChange={e => setSelectedDoctorId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {doctors.map(doc => (
            <option key={doc._id} value={doc._id}>{doc.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleBooking} className="space-y-4">
        <div className="flex flex-col">
          <label htmlFor="date" className="mb-1 text-sm font-medium text-gray-700">Date & Time</label>
          <input
            id="date"
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="duration" className="mb-1 text-sm font-medium text-gray-700">Duration (minutes)</label>
          <input
            id="duration"
            type="number"
            value={sessionDuration}
            onChange={e => setSessionDuration(e.target.value)}
            required
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="amount" className="mb-1 text-sm font-medium text-gray-700">Amount ($)</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">{success}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Processing...' : 'Submit Booking'}
        </button>
      </form>
    </div>
  )
}