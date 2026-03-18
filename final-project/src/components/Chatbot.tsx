"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", text: "Halo! Saya AuraMind Chatbot. Ada yang bisa saya bantu hari ini?" },
  ]);

  // Ref untuk fitur auto-scroll ke bawah
  const scrollRef = useRef<HTMLDivElement>(null);

  // Efek untuk scroll otomatis setiap ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;

    // 1. Tambahkan pesan user ke UI
    const nextMessages = [...messages, { role: "user" as const, text: message }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      /**
       * PERBAIKAN KRUSIAL:
       * Gemini mewajibkan pesan pertama dalam history adalah role: 'user'.
       * Karena pesan index 0 kita adalah sapaan 'model', kita buang dengan .slice(1).
       * Kita juga gunakan .slice(0, -1) dari nextMessages agar pesan terbaru 
       * tidak duplikat masuk ke history (karena dikirim via variabel 'message').
       */
      const history = nextMessages
        .slice(1, -1) 
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Menangkap error kuota (429) atau error server lainnya
        throw new Error(data?.details || data?.error || "Gagal menghubungi chatbot");
      }

      // 2. Tambahkan jawaban model ke UI
      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.reply || "Maaf, saya tidak mendapatkan jawaban." },
      ]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Terjadi kesalahan";
      
      // Memberikan feedback error yang lebih rapi di chat
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `⚠️ Kendala: ${errorText}. Silakan coba beberapa saat lagi.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {isOpen ? (
        <div className="w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-emerald-100 bg-white shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-emerald-600 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border border-emerald-400">
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="font-bold text-sm">AuraMind Chatbot</p>
                <p className="text-[10px] text-emerald-100 uppercase tracking-wider">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 transition hover:bg-emerald-700/50"
              aria-label="Tutup chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Container */}
          <div 
            ref={scrollRef}
            className="h-[400px] overflow-y-auto bg-slate-50 p-4 space-y-4 scroll-smooth"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya sesuatu..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-emerald-200"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        /* Floating Button */
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 rounded-full bg-emerald-600 px-6 py-3.5 text-white shadow-xl transition-all hover:bg-emerald-700 hover:scale-105 active:scale-95"
        >
          <MessageCircle size={20} className="animate-pulse" />
          <span className="text-sm font-bold tracking-wide">Konsultasi AI</span>
        </button>
      )}
    </div>
  );
}