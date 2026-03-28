"use client";

import Navbar from "@/components/navbar";
import { useEffect, useMemo, useState } from "react";
import { StartSessionButton } from "./StartSessionButton";

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

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [role, setRole] = useState<"USER" | "DOCTOR" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const pageTitle = useMemo(() => {
    if (role === "DOCTOR") {
      return "Daftar Booking Pasien";
    }

    return "Daftar Booking Saya";
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
            <p className="mt-2 text-sm text-slate-600">
              Menampilkan seluruh booking kamu.
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl bg-white p-8 text-sm text-slate-600 shadow-sm">
              Memuat data booking...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-sm text-slate-600 shadow-sm">
              Belum ada booking ditemukan.
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Tanggal Sesi</th>
                      <th className="px-4 py-3 font-semibold">
                        {role === "DOCTOR" ? "Nama Pasien" : "Nama Dokter"}
                      </th>
                      <th className="px-4 py-3 font-semibold">Durasi</th>
                      <th className="px-4 py-3 font-semibold">Jumlah</th>
                      <th className="px-4 py-3 font-semibold">Pembayaran</th>
                      <th className="px-4 py-3 font-semibold">Status Sesi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">
                          {formatDateTime(booking.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {role === "DOCTOR"
                            ? booking.userName
                            : booking.staffName}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {booking.sessionDuration} menit
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatAmount(booking.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              booking.isPaid
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {booking.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              booking.isDone
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {booking.isDone ? "Done" : "Upcoming"}
                          </span>
                          {booking.isPaid && !booking.isDone && (
                            <StartSessionButton
                              bookingId={booking._id.toString()}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
