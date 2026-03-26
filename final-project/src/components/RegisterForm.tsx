'use client'

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import Swal from "sweetalert2"

export default function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAdress] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  const router = useRouter();

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        address,
        phoneNumber: phone,
        password,
      }),
    })
    if (!response.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: 'Please check your input and try again.',
      })
      return
    }
    Swal.fire({
      icon: 'success',
      title: 'Registration Successful',
      text: 'Your account has been created. You will be redirected to the homepage.',
    }).then(() => {
      router.push('/')
    })
  }

  return (
    <div className="">
      <form 
        className="flex flex-col justify-center w-1/3 h-1/2 mx-auto mt-10 gap-3 border p-12 rounded-lg"
        onSubmit={handleRegister}
      >
        <h1 className="text-3xl text-center mb-10 font-bold">Register</h1>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="border p-2 rounded-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="border p-2 rounded-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="address">Address:</label>
        <input
          type="text"
          id="address"
          name="address"
          required
          className="border p-2 rounded-sm"
          value={address}
          onChange={(e) => setAdress(e.target.value)}
        />
        <label htmlFor="phone">Phone Number:</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          className="border p-2 rounded-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autoComplete="off"
          className="border p-2 rounded-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button
          type="submit"
          className="border bg-blue w-20 p-2 self-center bg-white text-blue-700 border-blue-700 rounded-lg hover:bg-blue-700 hover:text-white hover:border-white transition-all font-bold"
        >
          Sign up
        </button>
      </form>
    </div>
  )
}
