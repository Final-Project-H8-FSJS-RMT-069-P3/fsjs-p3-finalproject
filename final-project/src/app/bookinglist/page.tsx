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
    return role === "DOCTOR"
      ? "Daftar Booking Pasien"
      : "Daftar Booking Saya";
  }, [role]);

  const totalIncome = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      return acc + (booking.isPaid ? booking.amount : 0);
    }, 0);
  }, [bookings]);

  const totalPatientsServed = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      return acc + (booking.isDone ? 1 : 0);
    }, 0);
  }, [bookings]);

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
            {/* Overview Section */}
            <div className="mt-4 flex gap-8">
              <div>
                <div className="text-xs text-slate-500">Total Income</div>
                <div className="text-xl font-bold text-green-700">
                  {formatAmount(totalIncome)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Patients Served</div>
                <div className="text-xl font-bold text-blue-700">
                  {totalPatientsServed}
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              Loading...
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
                          <Link href={`/payment?bookingId=${booking._id}`}>
                            Pay
                          </Link>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {booking.isDone ? "Done" : "Upcoming"}
                      </td>

                      <td className="px-4 py-3">
                        {booking.isPaid && !booking.isDone && (
                          <StartSessionButton bookingId={booking._id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}