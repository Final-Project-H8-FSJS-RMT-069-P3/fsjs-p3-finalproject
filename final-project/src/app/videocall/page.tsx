// src/app/videocall/page.tsx
//
// Akses: /videocall?channel=session_abc123_xyz789
// channelName didapat dari query param, bukan dynamic route
// karena struktur folder proyek ini flat (bukan /videocall/[channelName])

"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAgoraVideoCall } from "@/hooks/useAgoraVideoCall";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "chat" | "notes";

type Message = {
  id: number;
  from: "doctor" | "user";
  text: string;
  timestamp: string;
};

const NOTES = [
  "Keluhan tidur tidak teratur sejak 3 minggu",
  "Stres pekerjaan meningkat bulan ini",
  "Teknik pernapasan 4-7-8 direkomendasikan",
  "Perlu evaluasi pola makan & olahraga",
];

// ─── Timer ───────────────────────────────────────────────────────────────────
function useSessionTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return useMemo(() => {
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secs]);
}

// ─── Video Track Renderer ─────────────────────────────────────────────────────
function VideoTrack({
  track,
  className = "",
}: {
  track: any;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!track || !ref.current) return;
    track.play(ref.current);
    return () => track.stop();
  }, [track]);
  return <div ref={ref} className={className} />;
}

// ─── Wave Bars ────────────────────────────────────────────────────────────────
function WaveBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px]" aria-hidden="true">
      {[7, 13, 9, 15, 7].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-emerald-500 transition-all duration-500"
          style={{
            height: h,
            opacity: active ? 1 : 0.2,
            transform: active ? "scaleY(1)" : "scaleY(0.35)",
            animation: active
              ? `waveAnim 0.8s ease-in-out ${i * 0.1}s infinite`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Control Button ───────────────────────────────────────────────────────────
function CtrlBtn({
  icon,
  label,
  muted = false,
  active = false,
  danger = false,
  big = false,
  onClick,
}: {
  icon: string;
  label: string;
  muted?: boolean;
  active?: boolean;
  danger?: boolean;
  big?: boolean;
  onClick: () => void;
}) {
  const size = big ? "w-14 h-14 text-2xl" : "w-12 h-12 text-lg";
  const color = danger
    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-100"
    : muted
    ? "bg-red-50 border border-red-100 text-red-500"
    : active
    ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
    : "bg-blue-50 border border-blue-100 text-blue-900 hover:bg-blue-100";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 hover:scale-105 cursor-pointer ${size} ${color}`}
        aria-label={label}
      >
        {icon}
      </button>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
          danger || muted ? "text-red-600" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.from === "user";
  return (
    <div
      className={`flex gap-3 max-w-[90%] ${
        isUser ? "self-end flex-row-reverse" : "self-start"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border-2 border-white shadow-sm ${
          isUser ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-900"
        }`}
      >
        {isUser ? "U" : "D"}
      </div>
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && (
          <p className="text-[11px] font-bold text-gray-900 mb-1 ml-1">
            Psikolog
          </p>
        )}
        <div
          className={`text-[13px] leading-relaxed px-4 py-2.5 rounded-2xl shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-none"
              : "bg-gray-100 text-gray-800 rounded-tl-none"
          }`}
        >
          {msg.text}
        </div>
        <span className="text-[9px] text-gray-400 mt-1.5 px-1 font-medium">
          {msg.timestamp}
        </span>
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({
  messages,
  onSend,
}: {
  messages: Message[];
  onSend: (t: string) => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  }, [input, onSend]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 min-h-0 bg-gray-50/50">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-300 mt-8 font-medium">
            Belum ada pesan. Mulai percakapan!
          </p>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} msg={m} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3.5 border-t border-gray-100 bg-white shrink-0">
        <div className="flex gap-2 items-center bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-md transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Tulis pesan..."
            className="flex-1 bg-transparent text-[13px] text-gray-900 placeholder-gray-300 outline-none py-1.5"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="text-blue-600 disabled:opacity-30 transition-all p-1.5 rounded-full hover:bg-blue-50 active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component (butuh Suspense karena useSearchParams) ──────────────────
function VideoCallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Ambil channelName dari query: /videocall?channel=session_xxx
  const channelName = searchParams.get("channel") ?? "";

  const {
    connectionState,
    localVideoTrack,
    remoteVideoTrack,
    isMicOn,
    isCamOn,
    isRemoteSpeaking,
    isRecording,
    error,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleRecording,
  } = useAgoraVideoCall({
    channelName,
    onEnded: () => router.push("/bookinglist"), // kembali ke daftar booking setelah selesai
  });

  const isConnected = connectionState === "connected";
  const timer = useSessionTimer(isConnected);

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [mobChatOpen, setMobChatOpen] = useState(false);

  const sendMessage = useCallback((text: string) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: "user", text, timestamp },
    ]);
  }, []);

  const handleEndCall = useCallback(async () => {
    if (confirm("Akhiri sesi konsultasi sekarang?")) await leave();
  }, [leave]);

  // Guard: channelName harus ada di query params
  if (!channelName) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4 text-center px-6">
        <div className="text-5xl">🔗</div>
        <h2 className="text-lg font-bold text-blue-900">
          Link Sesi Tidak Valid
        </h2>
        <p className="text-sm text-gray-400">
          Akses sesi video melalui halaman daftar booking Anda.
        </p>
        <button
          onClick={() => router.push("/bookinglist")}
          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all text-sm"
        >
          Ke Daftar Booking
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes waveAnim {
          0%,100% { transform: scaleY(0.4); opacity: 0.5; }
          50%      { transform: scaleY(1);   opacity: 1; }
        }
        @keyframes livePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
        }
        @keyframes ringExpand {
          0%,100% { transform: scale(1); opacity: 0.3; }
          50%      { transform: scale(1.08); opacity: 0.7; }
        }
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>

      <div className="flex flex-col h-dvh bg-white text-gray-900 overflow-hidden">
        {/* HEADER */}
        <header className="flex items-center justify-between px-5 md:px-7 py-3 bg-white border-b border-gray-100 shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isConnected ? "bg-emerald-500" : "bg-gray-300"
              }`}
              style={
                isConnected
                  ? { animation: "livePulse 2.5s ease-in-out infinite" }
                  : {}
              }
            />
            <div>
              <p className="text-[14px] font-extrabold text-blue-900">
                Sesi Konsultasi
              </p>
              <p className="text-[11px] text-gray-400 hidden sm:block font-semibold uppercase tracking-wider mt-0.5">
                {connectionState === "connected"
                  ? "Sesi Aktif"
                  : connectionState === "connecting"
                  ? "Menghubungkan..."
                  : connectionState === "error"
                  ? "Koneksi Gagal"
                  : "Menunggu"}
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="bg-gray-50 border border-gray-100 px-4 py-1 rounded-full">
              <span className="text-[15px] font-mono font-medium text-blue-900 tabular-nums">
                {timer}
              </span>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
              <span
                className="w-2 h-2 rounded-full bg-red-500"
                style={{ animation: "livePulse 1.5s ease-in-out infinite" }}
              />
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                Merekam
              </span>
            </div>
          )}
        </header>

        {/* MAIN */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_320px] md:gap-4 md:p-4 overflow-hidden bg-gray-50/50">
          {/* VIDEO AREA */}
          <div className="relative flex items-center justify-center overflow-hidden md:rounded-[2rem] bg-white border border-gray-100 shadow-xl shadow-blue-50/50">
            {/* IDLE */}
            {connectionState === "idle" && (
              <div className="flex flex-col items-center gap-6 text-center px-8">
                <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-4xl shadow-lg">
                  📹
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-blue-900">
                    Siap Memulai Sesi?
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Pastikan kamera dan mikrofon sudah siap
                  </p>
                </div>
                <button
                  onClick={join}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  Bergabung Sekarang
                </button>
              </div>
            )}

            {/* CONNECTING */}
            {connectionState === "connecting" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-semibold text-gray-400">
                  Menghubungkan ke sesi...
                </p>
              </div>
            )}

            {/* ERROR */}
            {connectionState === "error" && (
              <div className="flex flex-col items-center gap-4 text-center px-8">
                <div className="text-5xl">⚠️</div>
                <h2 className="text-lg font-extrabold text-red-600">
                  Koneksi Bermasalah
                </h2>
                <p className="text-sm text-gray-500">{error}</p>
                <button
                  onClick={join}
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all text-sm"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* ENDED */}
            {connectionState === "ended" && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-5xl">✅</div>
                <p className="text-lg font-bold text-blue-900">Sesi Selesai</p>
                <p className="text-sm text-gray-400">
                  Mengarahkan ke halaman booking...
                </p>
              </div>
            )}

            {/* CONNECTED */}
            {isConnected && (
              <>
                {/* Live badge */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/70 backdrop-blur-md border border-emerald-100 rounded-full px-3 py-1.5 text-[11px] font-bold text-emerald-800 shadow-sm">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    style={{ animation: "livePulse 2.5s ease-in-out infinite" }}
                  />
                  Sesi Aktif
                </div>

                {/* Remote video (lawan bicara) */}
                {remoteVideoTrack ? (
                  <VideoTrack
                    track={remoteVideoTrack}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  // Fallback avatar ketika video lawan bicara belum ada / off
                  <div className="relative z-10 flex flex-col items-center gap-5 text-center select-none">
                    <div className="relative">
                      <span
                        className="absolute inset-[-12px] rounded-full border border-emerald-100"
                        style={{
                          animation: isRemoteSpeaking
                            ? "ringExpand 2.8s ease-in-out infinite"
                            : "none",
                          opacity: isRemoteSpeaking ? 1 : 0.2,
                        }}
                      />
                      <div
                        className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-black bg-white text-blue-900 border-2 transition-all ${
                          isRemoteSpeaking
                            ? "border-emerald-300 shadow-2xl shadow-emerald-100/50"
                            : "border-gray-100 shadow-lg"
                        }`}
                      >
                        👨‍⚕️
                      </div>
                    </div>
                    <div>
                      <h2 className="text-[20px] font-extrabold text-blue-900">
                        Psikolog
                      </h2>
                      <div className="flex items-center gap-2.5 justify-center mt-2.5 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5">
                        <WaveBars active={isRemoteSpeaking} />
                        <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest ml-1">
                          {isRemoteSpeaking
                            ? "Sedang Berbicara"
                            : "Menunggu..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Local video PiP (pojok kanan atas) */}
                <div className="absolute top-4 right-4 z-20 w-28 h-36 rounded-3xl overflow-hidden border-2 border-white shadow-xl bg-white">
                  {localVideoTrack && isCamOn ? (
                    <VideoTrack
                      track={localVideoTrack}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-blue-50 to-white">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xs font-black text-purple-700 border-2 border-white shadow-sm">
                        AU
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">
                        Anda
                      </span>
                      {!isCamOn && (
                        <span className="text-[10px] text-gray-300">
                          Kamera Off
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* SIDEBAR (Desktop) */}
          <div className="hidden md:flex flex-col gap-4 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 rounded-[2rem] bg-white border border-gray-300 flex flex-col overflow-hidden shadow-xl shadow-blue-50/30">
              {/* Tabs */}
              <div className="flex p-2 bg-gray-50 border-b border-gray-100 gap-1.5 shrink-0">
                {(["chat", "notes"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-[12px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                      activeTab === tab
                        ? "bg-white text-blue-600 shadow-md border border-blue-100"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {tab === "notes" ? "📋 Catatan" : "💬 Chat"}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === "notes" && (
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-gray-50/50">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      Catatan Sesi
                    </h3>
                    {NOTES.map((note, i) => (
                      <div key={i} className="flex gap-3.5 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 shrink-0 group-hover:bg-blue-600 transition-colors" />
                        <p className="text-[14px] text-gray-600 leading-relaxed font-medium group-hover:text-blue-900 transition-colors">
                          {note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "chat" && (
                  <ChatPanel messages={messages} onSend={sendMessage} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 px-4 py-5 bg-white border-t border-gray-100 shrink-0 z-30">
          <CtrlBtn
            icon={isMicOn ? "🎙️" : "🔇"}
            label="Mic"
            muted={!isMicOn}
            onClick={toggleMic}
          />
          <CtrlBtn
            icon={isCamOn ? "📷" : "🚫"}
            label="Kamera"
            active={isCamOn}
            onClick={toggleCam}
          />
          <CtrlBtn
            icon="📵"
            label="Akhiri"
            danger
            big
            onClick={handleEndCall}
          />
          <CtrlBtn
            icon={isRecording ? "⏹️" : "⏺️"}
            label={isRecording ? "Stop Rekam" : "Rekam"}
            active={isRecording}
            muted={isRecording}
            onClick={toggleRecording}
          />
          <div className="md:hidden">
            <CtrlBtn
              icon="💬"
              label="Chat"
              onClick={() => setMobChatOpen(true)}
              active={mobChatOpen}
            />
          </div>
        </div>

        {/* MOBILE CHAT */}
        {mobChatOpen && (
          <div className="fixed inset-0 z-[100] bg-white flex flex-col md:hidden">
            <header className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <button
                onClick={() => setMobChatOpen(false)}
                className="text-blue-900 p-2 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
              <p className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                Chat Sesi
              </p>
              <div className="w-10" />
            </header>
            <ChatPanel messages={messages} onSend={sendMessage} />
          </div>
        )}
      </div>
    </>
  );
}

// Suspense wrapper wajib karena useSearchParams()
export default function VideoCallPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-dvh">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      }
    >
      <VideoCallContent />
    </Suspense>
  );
}
