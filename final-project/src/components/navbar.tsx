"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-black text-blue-900 tracking-tighter">
          pendengarMu
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link
            key="home"
            href="/"
            className="text-gray-500 hover:text-blue-700 transition-colors"
          >
            Home
          </Link>
          <Link
            key="listpsikolog"
            href="/listpsikolog"
            className="text-gray-500 hover:text-blue-700 transition-colors"
          >
            List Psikolog
          </Link>
          <Link
            key="aboutus"
            href="/aboutus"
            className="text-gray-500 hover:text-blue-700 transition-colors"
          >
            Tentang kami
          </Link>
          <Link
            key="kontenpsikologi"
            href="/qna"
            className="text-gray-500 hover:text-blue-700 transition-colors"
          >
            Konsultasi
          </Link>
          <Link
            key="bookinglist"
            href="/bookinglist"
            className="block py-3 text-sm font-medium text-gray-600 border-b border-gray-50"
          >
          list booking
          </Link>
          {session ? (
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="text-gray-500 hover:text-blue-700 transition-colors"
            >
              Masuk / Daftar
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md hidden sm:block">
            Konseling Sekarang
          </button>
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="block w-5 h-0.5 bg-gray-700 rounded" />
            <span className="block w-5 h-0.5 bg-gray-700 rounded" />
            <span className="block w-5 h-0.5 bg-gray-700 rounded" />
          </button>
        </div>
      </div>

      {/* ini untuk tampilan mobilenya */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 shadow-lg">
          <Link
            key="home"
            href="/home"
            className="block py-3 text-sm font-medium text-gray-600 border-b border-gray-50"
          >
            Home
          </Link>
          <Link
            key="listpsikolog"
            href="/listpsikolog"
            className="block py-3 text-sm font-medium text-gray-600 border-b border-gray-50"
          >
            List Psikolog
          </Link>
          <Link
            key="aboutus"
            href="/aboutus"
            className="block py-3 text-sm font-medium text-gray-600 border-b border-gray-50"
          >
            Tentang kami
          </Link>
          <Link
            key="kontenpsikologi"
            href="/qna"
            className="block py-3 text-sm font-medium text-gray-600 border-b border-gray-50"
          >
          Konsultasi
          </Link>
          <Link
            key="bookinglist"
            href="/bookinglist"
            className="block py-3 text-sm font-medium text-gray-600 border-b border-gray-50"
          >
          list booking
          </Link>
          {session ? (
            <button
              onClick={handleLogout}
              className="block w-full text-left py-3 text-sm font-medium text-red-600 border-b border-gray-50"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="block py-3 text-sm font-medium text-gray-600 border-b border-gray-50"
            >
              Masuk / Daftar
            </Link>
          )}

          <button className="mt-4 w-full py-3 bg-orange-500 text-white font-bold rounded-xl">
            Konseling Sekarang
          </button>
        </div>
      )}
    </nav>
  );
}
