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
  const [date, setDate] = useState('') // combined date+time for backend
  const [selectedDate, setSelectedDate] = useState('') // yyyy-mm-dd
  const [selectedTime, setSelectedTime] = useState('') // e.g. '09:00 - 09:50'
  const [sessionDuration, setSessionDuration] = useState('50')
  const [sessionType, setSessionType] = useState<'chat' | 'video' | 'offline'>('chat')
  const [amount, setAmount] = useState('120000')

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
        setDoctors(data.data)
        if (!selectedDoctorId && data.data.length > 0) {
          setSelectedDoctorId(data.data[0]._id)
        }
      } catch (err: any) {
        setError(err.message)
      }
    }
    fetchDoctors()
  }, [])

  // Update amount when sessionType changes
  useEffect(() => {
    if (sessionType === 'chat') setAmount('120000')
    else if (sessionType === 'video') setAmount('200000')
    else if (sessionType === 'offline') setAmount('350000')
  }, [sessionType])

  const selectedDoctor = doctors.find(d => d._id === selectedDoctorId)

  async function handleBooking(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Combine selectedDate and selectedTime into a single string for backend
    let combinedDate = ''
    if (selectedDate && selectedTime) {
      // Extract start time from selectedTime (e.g. '09:00 - 09:50' -> '09:00')
      const startTime = selectedTime.split(' - ')[0]
      combinedDate = new Date(`${selectedDate}T${startTime}:00`).toISOString()
    }
    setDate(combinedDate)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          staffId: selectedDoctorId,
          date: combinedDate,
          sessionDuration,
          amount
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to create booking")

      setSuccess(`Booking created! Doctor: ${selectedDoctor?.name}`)
      setSelectedDate('')
      setSelectedTime('')
      setDate('')
    } catch (err: any) {
      if (err.message.includes("Unauthorized")) window.location.href = "/login"
      setError(err.message)
    } finally {
      setIsLoading(false)
      router.push('/bookinglist')
    }
  }

  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100 mt-10">
      <h2 className="text-2xl font-black text-blue-900 mb-6 tracking-tight">Booking Sesi Konsultasi</h2>

      {selectedDoctor && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="font-bold text-blue-900">{selectedDoctor.name}</p>
          <p className="text-sm text-blue-700">{selectedDoctor.role}</p>
          <p className="text-xs text-blue-500">{selectedDoctor.email}</p>
        </div>
      )}

      <div className="mb-6">
        <label className="mb-1 text-sm font-semibold text-blue-900">Pilih Psikolog</label>
        <select
          value={selectedDoctorId}
          onChange={e => setSelectedDoctorId(e.target.value)}
          className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50 text-blue-900 font-medium"
        >
          {doctors.map(doc => (
            <option key={doc._id} value={doc._id}>{doc.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleBooking} className="space-y-6">
        <div className="flex flex-col">
          <label htmlFor="date" className="mb-1 text-sm font-semibold text-blue-900">Tanggal</label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            required
            className="p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50 text-blue-900 font-medium"
          />
        </div>
        <div className="flex flex-col">
          <span className="mb-1 text-sm font-semibold text-blue-900">Jam Sesi</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {[
              '09:00 - 09:50',
              '10:00 - 10:50',
              '11:00 - 11:50',
              '12:00 - 12:50',
              '13:00 - 13:50',
              '14:00 - 14:50',
              '15:00 - 15:50',
              '16:00 - 16:50',
            ].map(time => (
              <label key={time} className="relative">
                <input
                  type="radio"
                  name="sessionTime"
                  value={time}
                  checked={selectedTime === time}
                  onChange={() => setSelectedTime(time)}
                  required
                  className="peer appearance-none absolute w-0 h-0 opacity-0"
                />
                <span
                  className={
                    `inline-block px-5 py-2 rounded-lg border border-blue-500 font-semibold cursor-pointer transition-colors text-base ` +
                    (selectedTime === time
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-blue-600 hover:bg-blue-100')
                  }
                >
                  {time}
                </span>
              </label>
            ))}
          </div>
        </div>


        <div className="flex flex-col">
          <label htmlFor="duration" className="mb-1 text-sm font-semibold text-blue-900">Durasi Sesi (menit)</label>
          <input
            id="duration"
            type="number"
            value={sessionDuration}
            onChange={e => setSessionDuration(e.target.value)}
            required
            className="p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50 text-blue-900 font-medium"
          />
          <div className="mt-3">
            <span className="text-sm font-semibold text-blue-900">Tipe Sesi</span>
            <div className="flex gap-2 mt-2">
              {[
                { label: 'Chat', value: 'chat' },
                { label: 'Video', value: 'video' },
                { label: 'Offline', value: 'offline' },
              ].map(option => (
                <label key={option.value} className="relative">
                  <input
                    type="radio"
                    name="sessionType"
                    value={option.value}
                    checked={sessionType === option.value}
                    onChange={() => setSessionType(option.value as 'chat' | 'video' | 'offline')}
                    className="peer appearance-none absolute w-0 h-0 opacity-0"
                  />
                  <span
                    className={
                      `inline-block px-5 py-2 rounded-lg border border-orange-500 font-semibold cursor-pointer transition-colors text-base ` +
                      (sessionType === option.value
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-white text-orange-500 hover:bg-orange-100')
                    }
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>


        <div className="flex flex-col">
          <label htmlFor="amount" className="mb-1 text-sm font-semibold text-blue-900">Nominal (Rp)</label>
          <input
            id="amount"
            type="number"
            value={amount}
            readOnly
            required
            className="p-2 border border-blue-200 rounded-lg bg-blue-50 text-blue-900 font-semibold cursor-not-allowed outline-none"
          />
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">{success}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-xl text-white font-black text-lg transition-colors shadow-sm ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Memproses...' : 'Booking Sekarang'}
        </button>
      </form>
    </div>
  )
}