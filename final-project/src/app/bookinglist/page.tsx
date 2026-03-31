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
  type: "videocall" | "chat-only" | "offline";
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

const formatSessionType = (type?: string) => {
  switch (type) {
    case "videocall":
      return "Video";
    case "chat-only":
      return "Chat";
    case "offline":
      return "Offline";
    default:
      return "Unknown";
  }
};

export default function BookingListPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [role, setRole] = useState<"USER" | "DOCTOR" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "UNPAID">(
    "ALL"
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DONE" | "UPCOMING">(
    "ALL"
  );

  const router = useRouter();
  const sessionRole = String(session?.user?.role || "").toLowerCase();
  const isPsychiatrist =
    sessionRole === "doctor" || sessionRole === "psychiatrist";
  const isDoctor = role === "DOCTOR";

  useEffect(() => {
    let isMounted = true;
    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/getbookings", { cache: "no-store" });
        const payload = (await response.json()) as BookingApiResponse;
        if (!response.ok)
          throw new Error(payload.message || "Failed to fetch bookings");
        if (isMounted) {
          setBookings(payload.data || []);
          setRole(payload.role || null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Unexpected error happened"
          );
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

  const totalIncome = useMemo(() => {
    if (!isDoctor) return 0;
    return bookings.reduce((acc, b) => acc + (b.isPaid ? b.amount : 0), 0);
  }, [bookings, isDoctor]);

  const totalPatientsServed = useMemo(() => {
    if (!isDoctor) return 0;
    return bookings.reduce((acc, b) => acc + (b.isDone ? 1 : 0), 0);
  }, [bookings, isDoctor]);

  const getDisplayName = (booking: Booking) => {
    if (role === "DOCTOR") return booking.userName || "";
    if (role === "USER") return booking.staffName || "";
    return `${booking.userName || ""} ${booking.staffName || ""}`.trim();
  };

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const name = getDisplayName(b).toLowerCase();
      if (q && !name.includes(q)) return false;
      if (paymentFilter === "PAID" && !b.isPaid) return false;
      if (paymentFilter === "UNPAID" && b.isPaid) return false;
      if (statusFilter === "DONE" && !b.isDone) return false;
      if (statusFilter === "UPCOMING" && b.isDone) return false;
      return true;
    });
  }, [bookings, searchQuery, paymentFilter, statusFilter, role]);

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

            {isDoctor && (
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
            )}

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  aria-label="Search nama"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Payment</span>
                  <div className="flex gap-2">
                    {(["ALL", "PAID", "UNPAID"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setPaymentFilter(f)}
                        className={`text-xs px-2 py-1 rounded ${
                          paymentFilter === f
                            ? f === "PAID"
                              ? "bg-green-600 text-white"
                              : f === "UNPAID"
                              ? "bg-amber-600 text-white"
                              : "bg-blue-600 text-white"
                            : "bg-slate-100"
                        }`}
                      >
                        {f === "ALL" ? "All" : f === "PAID" ? "Paid" : "Unpaid"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Status</span>
                  <div className="flex gap-2">
                    {(["ALL", "DONE", "UPCOMING"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`text-xs px-2 py-1 rounded ${
                          statusFilter === f
                            ? f === "DONE"
                              ? "bg-green-600 text-white"
                              : f === "UPCOMING"
                              ? "bg-amber-600 text-white"
                              : "bg-blue-600 text-white"
                            : "bg-slate-100"
                        }`}
                      >
                        {f === "ALL"
                          ? "All"
                          : f === "DONE"
                          ? "Done"
                          : "Upcoming"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
            <>
              {/* ── DESKTOP TABLE ─────────────────────────── */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Tipe Sesi</th>
                      <th className="px-4 py-3">Jumlah</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Sesion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          No bookings found.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking) => (
                        <tr
                          key={booking._id}
                          className="hover:bg-slate-50 border-t border-slate-50"
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
                            {formatSessionType(booking.type)}
                          </td>
                          <td className="px-4 py-3">
                            {formatAmount(booking.amount)}
                          </td>
                          <td className="px-4 py-3">
                            {booking.isPaid ? (
                              <span className="text-green-600 font-semibold">
                                Paid
                              </span>
                            ) : (
                              <span className="text-amber-600 font-semibold">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-full ${
                                booking.isDone
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {booking.isDone ? "Done" : "Upcoming"}
                            </span>
                          </td>
                          {/* ── Action column: sama untuk user & dokter ── */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {/* Pay Now — hanya untuk user yang belum bayar */}
                              {!isPsychiatrist && !booking.isPaid && (
                                <Link
                                  href={`/payment?bookingId=${booking._id}`}
                                  className="text-xs px-3 py-1.5 bg-orange-50 text-orange-600 font-semibold rounded-lg hover:bg-orange-100 transition-colors whitespace-nowrap border border-orange-200"
                                >
                                  Pay Now
                                </Link>
                              )}
                              {/* Start Session — sudah bayar, belum selesai */}

                              {/* Brief — hanya dokter */}
                              {isPsychiatrist && booking.userId && (
                                <button
                                  onClick={() =>
                                    router.push(`/formbrief/${booking.userId}`)
                                  }
                                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap border border-blue-100"
                                >
                                  Brief
                                </button>
                              )}
                            </div>
                          </td>
                          <div className="px-4 py-3">
                            {booking.isPaid && !booking.isDone && (
                              <StartSessionButton
                                bookingId={booking._id}
                                type={booking.type}
                              />
                            )}
                          </div>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE CARDS ──────────────────────────── */}
              <div className="md:hidden space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl text-slate-400 text-center shadow-sm">
                    No data found.
                  </div>
                ) : (
                  filteredBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                            {role === "DOCTOR" ? "Patient" : "Staff"}
                          </span>
                          <span className="font-extrabold text-slate-900 text-lg leading-tight">
                            {role === "DOCTOR"
                              ? booking.userName
                              : booking.staffName}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                            booking.isDone
                              ? "bg-slate-100 text-slate-400"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {booking.isDone ? "Done" : "Upcoming"}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-y-4 border-y border-slate-50 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                            Waktu Sesi
                          </span>
                          <span className="text-sm text-slate-700 font-bold">
                            {formatDateTime(booking.date)}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                            Tipe Sesi
                          </span>
                          <span className="text-sm text-slate-700 font-bold">
                            {formatSessionType(booking.type)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                            Total Bayar
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {formatAmount(booking.amount)}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                            Pembayaran
                          </span>
                          {booking.isPaid ? (
                            <span className="text-sm text-green-600 font-black">
                              Lunas
                            </span>
                          ) : (
                            <span className="text-sm text-amber-600 font-black">
                              Belum Lunas
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons — berdampingan */}
                      <div className="flex items-center gap-2">
                        {/* Pay Now — user yang belum bayar */}
                        {!isPsychiatrist && !booking.isPaid && (
                          <Link
                            href={`/payment?bookingId=${booking._id}`}
                            className="flex-1 text-center text-xs px-4 py-3 bg-orange-50 text-orange-600 font-black rounded-xl border border-orange-200 hover:bg-orange-100 transition-all active:scale-95"
                          >
                            Pay Now
                          </Link>
                        )}
                        {/* Start Session */}
                        {booking.isPaid && !booking.isDone && (
                          <div className="flex-1">
                            <StartSessionButton
                              bookingId={booking._id}
                              type={booking.type}
                            />
                          </div>
                        )}
                        {/* Brief — dokter */}
                        {isPsychiatrist && booking.userId && (
                          <button
                            onClick={() =>
                              router.push(`/formbrief/${booking.userId}`)
                            }
                            className="flex-1 text-xs px-4 py-3 bg-blue-50 text-blue-700 font-black rounded-xl border border-blue-100 hover:bg-blue-100 transition-all active:scale-95"
                          >
                            Lihat Brief
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
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
