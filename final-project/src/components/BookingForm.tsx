'use client'

import { FormEvent, useState } from "react"

interface BookingFormProps {
  staffId: string;
}

export default function BookingForm({ staffId }: BookingFormProps) {
  const [date, setDate] = useState('')
  const [sessionDuration, setSessionDuration] = useState('30')
  const [amount, setAmount] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleBooking(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // "credentials: 'include'" ensures the NextAuth session cookie is sent automatically
        credentials: 'include', 
        body: JSON.stringify({
          staffId,
          date,
          sessionDuration,
          amount
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create booking")
      }

      setSuccess(`Booking created! Room: ${data.roomName}`)
      setDate('')
      
    } catch (err: any) {
      if (err.message.includes("Unauthorized")) {
        window.location.href = "/login"; 
      }
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Book a Session</h2>
      
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