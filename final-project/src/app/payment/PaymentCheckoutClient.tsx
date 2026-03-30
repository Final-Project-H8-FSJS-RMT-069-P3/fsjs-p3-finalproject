"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PaymentCheckoutClientProps = {
  amount: number;
  itemId: string;
  itemName: string;
  orderId: string;
  bookingId?: string;
  drName?: string;
};

type PaymentItem = {
  id: string;
  price: number;
  quantity: number;
  name: string;
};

type PaymentRequestPayload = {
  orderId: string;
  bookingId?: string;
  grossAmount: number;
  items: PaymentItem[];
  customerDetails: {
    first_name: string;
    email: string;
  };
};

type PaymentApiResponse = {
  token: string;
  redirect_url: string;
};

type UserProfileResponse = {
  data?: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
};

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function PaymentCheckoutClient({
  amount,
  itemId,
  itemName,
  orderId,
  bookingId,
  drName,
}: PaymentCheckoutClientProps) {
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload: PaymentRequestPayload = useMemo(
    () => ({
      orderId,
      bookingId,
      grossAmount: amount,
      items: [
        {
          id: itemId,
          price: amount,
          quantity: 1,
          name: itemName,
        },
      ],
      customerDetails: {
        first_name: firstName,
        email,
      },
    }),
    [amount, bookingId, email, firstName, itemId, itemName, orderId]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result = (await response.json()) as UserProfileResponse;

        if (!response.ok || !result.data) {
          throw new Error(result.message || "Failed to fetch user profile");
        }

        if (isMounted) {
          setProfileName(result.data.name || "");
          setProfileEmail(result.data.email || "");
          setFirstName(result.data.name || "");
          setEmail(result.data.email || "");
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!firstName || !email) {
      setError("Data user belum tersedia. Silakan refresh halaman.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as
        | PaymentApiResponse
        | { error?: string };

      if (!response.ok) {
        const errorData = data as { error?: string };
        throw new Error(
          errorData.error || "Failed to create payment transaction"
        );
      }

      const successData = data as PaymentApiResponse;
      window.location.href = successData.redirect_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className=" mx-auto w-full">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Kembali ke Home
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Payment Checkout
          </h1>
        </div>

        <div className="content-center mx-auto max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Data Pembayaran
            </h2>
            {drName && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 pt-5">
                  Psikolog
                </label>
                <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {drName}
                </div>
              </div>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Order ID
                </label>
                <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {orderId}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Item ID
                  </label>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                    {itemId}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Item Name
                  </label>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                    {itemName}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Amount (IDR)
                </label>
                <div className="w-full rounded-lg border border-slate-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
                  {formatIDR(amount)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
                    placeholder={profileLoading ? "Memuat..." : "Nama depan"}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
                    placeholder={
                      profileLoading ? "Memuat..." : "email@contoh.com"
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || profileLoading}
              className="mt-6 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {profileLoading
                ? "Memuat data user..."
                : loading
                ? "Membuat transaksi..."
                : "Bayar Sekarang"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
