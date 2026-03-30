"use client";

import Navbar from "@/components/navbar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StartSessionButton } from "./StartSessionButton";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Booking = {
  _id: string;
  userId: string;
  staffId: string;
  date: string;
  sessionDuration: number;
  amount: number;
  isPaid: boolean;
  isDone: boolean;
  createdAt: string;
  userName: string;
  staffName: string;
};

type BookingApiResponse = {
  message: string;
  role?: "USER" | "DOCTOR";
  data?: Booking[];
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function BookingListPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [role, setRole] = useState<"USER" | "DOCTOR" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const sessionRole = String(session?.user?.role || "").toLowerCase();
  const isPsychiatrist =
    sessionRole === "doctor" || sessionRole === "psychiatrist";

  useEffect(() => {
    let isMounted = true;

    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/getbookings", { cache: "no-store" });
        const payload = (await response.json()) as BookingApiResponse;

        if (!response.ok) {
          throw new Error(payload.message || "Failed to fetch bookings");
        }

        if (isMounted) {
          setBookings(payload.data || []);
          setRole(payload.role || null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Unexpected error happened";
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  const pageTitle = useMemo(() => {
    return role === "DOCTOR" ? "Daftar Booking Pasien" : "Daftar Booking Saya";
  }, [role]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 pb-12 pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Booking List
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              {pageTitle}
            </h1>
          </div>

          {loading && (
            <div className="bg-white p-8 rounded-2xl shadow-sm">Loading...</div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* ===== DESKTOP: tabel (md ke atas) ===== */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Durasi</th>
                      <th className="px-4 py-3">Jumlah</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Session</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className={`hover:bg-slate-50 ${
                          isPsychiatrist ? "cursor-pointer" : ""
                        }`}
                        onClick={() => {
                          if (!isPsychiatrist) return;
                          if (!booking.userId) return;
                          router.push(`/formbrief/${booking.userId}`);
                        }}
                      >
                        <td className="px-4 py-3">
                          {formatDateTime(booking.date)}
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {role === "DOCTOR"
                            ? booking.userName
                            : booking.staffName}
                        </td>

                        <td className="px-4 py-3">
                          {booking.sessionDuration} min
                        </td>

                        <td className="px-4 py-3">
                          {formatAmount(booking.amount)}
                        </td>

                        <td className="px-4 py-3">
                          {booking.isPaid ? (
                            <span className="text-green-600">Paid</span>
                          ) : isPsychiatrist ? (
                            <span>Unpaid</span>
                          ) : (
                            <Link
                              href={`/payment?bookingId=${booking._id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Pay
                            </Link>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {booking.isDone ? "Done" : "Upcoming"}
                        </td>

                        <td className="px-4 py-3">
                          {booking.isPaid && !booking.isDone && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <StartSessionButton bookingId={booking._id} />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ini MOBILE: card layout (di bawah md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className={`p-4 space-y-2 ${
                      isPsychiatrist ? "cursor-pointer active:bg-slate-50" : ""
                    }`}
                    onClick={() => {
                      if (!isPsychiatrist || !booking.userId) return;
                      router.push(`/formbrief/${booking.userId}`);
                    }}
                  >
                    {/* Baris atas: nama + badge status */}
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-900">
                        {role === "DOCTOR"
                          ? booking.userName
                          : booking.staffName}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          booking.isDone
                            ? "bg-slate-100 text-slate-500"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {booking.isDone ? "Done" : "Upcoming"}
                      </span>
                    </div>

                    {/* Info tanggal & durasi */}
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>📅 {formatDateTime(booking.date)}</p>
                      <p>
                        ⏱ {booking.sessionDuration} min &nbsp;·&nbsp;{" "}
                        {formatAmount(booking.amount)}
                      </p>
                    </div>

                    {/* Baris bawah: payment + tombol video call */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {booking.isPaid ? (
                          <span className="text-green-600 text-xs font-medium">
                            ✓ Paid
                          </span>
                        ) : isPsychiatrist ? (
                          <span className="text-xs text-slate-400">Unpaid</span>
                        ) : (
                          <Link
                            href={`/payment?bookingId=${booking._id}`}
                            className="text-xs text-blue-600 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Pay Now
                          </Link>
                        )}
                      </div>

                      {/* Tombol video call */}
                      {booking.isPaid && !booking.isDone && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <StartSessionButton bookingId={booking._id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-slate-500 text-center">
              Tidak ada booking.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
