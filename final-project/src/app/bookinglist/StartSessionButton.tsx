// SNIPPET: Tambahkan ini ke src/app/bookinglist/page.tsx
//
// Tombol "Mulai Sesi" yang membuat room lalu redirect ke /videocall?channel=xxx
// Taruh di dalam card booking yang sudah isPaid: true

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Tempel fungsi ini di dalam komponen BookingList Anda
function StartSessionButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStartSession() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/video/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-room", bookingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal memulai sesi");
        return;
      }

      // Redirect ke halaman video call dengan channelName sebagai query param
      router.push(`/videocall?channel=${data.roomName}`);
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleStartSession}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {loading ? "Memuat..." : "🎥 Mulai Sesi Video"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Contoh penggunaan di dalam render booking list:
//
// {booking.isPaid && !booking.isDone && (
//   <StartSessionButton bookingId={booking._id.toString()} />
// )}

export { StartSessionButton };
