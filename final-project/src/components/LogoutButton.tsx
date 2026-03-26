'use client'

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      router.push('/login');
    } catch (error) {
      Swal.fire({ 
        icon: 'error',
        title: 'Logout Failed',
        text: 'An error occurred while logging out. Please try again.',
      })
    }
  }

  return (
    <button type="button" onClick={handleLogout}>
      Logout
    </button>
  );
}
