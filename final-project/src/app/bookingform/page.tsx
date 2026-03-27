'use client'

import { FormEvent, useState } from "react"

export default function BookingForm () {
  const [staffId, setStaffId] = useState('') //staffId from props
  const [sessionDuration, setSessionDuration] = useState('')
  const [amount, setAmount] = useState('')

  async function handleBooking(e: FormEvent) {
    e.preventDefault()
    let response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({staffId, sessionDuration, amount})
    })
  }
  return (
    <div>
      <form onSubmit={handleBooking}>
        <label htmlFor="">Durasi</label>
        <input type="number" value={sessionDuration} onChange={e => setSessionDuration(e.target.value)}/>
        <label htmlFor="">Amount</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

// const bookingData = {
//       userId: new ObjectId(session.user.id),
//       staffId: new ObjectId(staffId),
//       formBriefId: formBriefId ? new ObjectId(formBriefId) : null,
//       date: new Date(date),
//       sessionDuration: parseInt(sessionDuration) || 30,
//       amount: parseFloat(amount) || 0,
//       isPaid: false,
//       isDone: false,
//       createdAt: new Date(),
//     };