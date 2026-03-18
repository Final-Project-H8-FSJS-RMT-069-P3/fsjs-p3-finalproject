import React from 'react';
import { Heart, Search, Video } from 'lucide-react'; // Library icon (opsional: npm install lucide-react)
import ChatbotWidget from '../src/components/Chatbot';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* --- NAVBAR --- */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Heart className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-800 italic">AuraMind</span>
        </div>
        <div className="hidden md:flex gap-8 text-slate-600 font-medium">
          <a href="#" className="hover:text-emerald-600 transition">Cari Psikolog</a>
          <a href="#" className="hover:text-emerald-600 transition">Layanan</a>
          <a href="#" className="hover:text-emerald-600 transition">Artikel</a>
        </div>
        <button className="bg-emerald-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-emerald-700 transition">
          Masuk
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="px-8 py-16 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
            Temukan Kenyamanan dan <span className="text-emerald-600">Bimbingan</span> yang Anda Butuhkan.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Konsultasi online dengan psikolog berlisensi, di mana saja, kapan saja. Mulai perjalanan kesehatan mentalmu hari ini.
          </p>
          <div className="flex gap-4">
            <button className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:scale-105 transition-transform">
              Mulai Konsultasi Gratis
            </button>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <div className="w-full h-[400px] bg-emerald-100 rounded-3xl overflow-hidden relative border-4 border-white shadow-xl">
             {/* Placeholder untuk gambar ilustrasi */}
             <div className="absolute inset-0 flex items-center justify-center text-emerald-300">
               <Video size={120} strokeWidth={1} />
             </div>
          </div>
          {/* Floating Card Akses Cepat */}
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100">
            <div className="bg-orange-100 p-3 rounded-full">
              {/* <ShieldCheck className="text-orange-600 w-6 h-6" /> */}
            </div>
            <div>
              <p className="font-bold text-slate-800">100% Privasi</p>
              <p className="text-sm text-slate-500">Sesi aman & anonim</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES / SERVICES --- */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="p-8 rounded-3xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50 transition group">
              <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition">
                <Search className="text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Cari Psikolog</h3>
              <p className="text-slate-600">Pilih ahli yang tepat berdasarkan spesialisasi dan pengalaman yang sesuai kebutuhanmu.</p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50 transition group">
              <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition">
                <Video className="text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Sesi Online</h3>
              <p className="text-slate-600">Konsultasi tatap muka via video call yang fleksibel tanpa harus keluar rumah.</p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50 transition group">
              <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition">
                <Heart className="text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Lacak Kemajuan</h3>
              <p className="text-slate-600">Pantau grafik kesehatan mentalmu dan jurnal harian dalam satu aplikasi terpadu.</p>
            </div>

          </div>
        </div>
      </section>

      <ChatbotWidget />
    </div>
  );
}