"use client";

import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";
import {
  Send,
  User,
  MessageCircle,
  Stethoscope,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Camera,
} from "lucide-react";

interface IMessage {
  senderName: string;
  message: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [myName, setMyName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatId = "room-konsultasi-privat-001";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isMounted || !isLoggedIn) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(chatId);
    channel.bind("incoming-message", (data: IMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      pusher.unsubscribe(chatId);
      pusher.disconnect();
    };
  }, [isMounted, isLoggedIn]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const tempInput = input;
    setInput("");

    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: tempInput,
          senderName: myName,
          chatId: chatId,
        }),
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-blue-100">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            Konsultasi Privat
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setMyName("Dokter");
                setIsLoggedIn(true);
              }}
              className="flex flex-col items-center p-4 border-2 border-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group"
            >
              <Stethoscope
                size={40}
                className="mb-2 text-blue-600 group-hover:text-white"
              />
              <span className="font-bold">Saya Dokter</span>
            </button>
            <button
              onClick={() => {
                setMyName("Pasien");
                setIsLoggedIn(true);
              }}
              className="flex flex-col items-center p-4 border-2 border-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group"
            >
              <User
                size={40}
                className="mb-2 text-blue-600 group-hover:text-white"
              />
              <span className="font-bold">Saya Pasien</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:py-10 px-0 md:px-4 font-sans">
      <div className="container mx-auto max-w-6xl h-screen md:h-[700px] flex flex-col md:flex-row gap-0 md:gap-4 overflow-hidden">
        {/* LEFT SIDEBAR - List Chat (Hidden on small mobile if needed, but here kept for layout) */}
        <div className="hidden md:flex w-full md:w-1/3 bg-white md:rounded-2xl shadow-sm border border-slate-200 flex-col">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-900">Messages</h2>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer">
              <MoreVertical size={16} />
            </div>
          </div>

          <div className="p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari percakapan..."
                className="w-full bg-slate-100 rounded-xl py-2.5 px-4 pl-10 focus:outline-none text-sm border border-transparent focus:border-blue-200 transition-all"
              />
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={18}
              />
            </div>
          </div>

          <div className="flex border-b text-sm">
            <button className="flex-1 py-3 font-semibold text-blue-600 border-b-2 border-blue-600">
              Aktif
            </button>
            <button className="flex-1 py-3 font-medium text-slate-400 hover:text-slate-600 transition-colors">
              Riwayat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Active Session Item */}
            <div className="p-4 border-b flex items-center bg-blue-50/50 cursor-pointer border-l-4 border-l-blue-600">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {myName === "Dokter" ? (
                    <User size={24} />
                  ) : (
                    <Stethoscope size={24} />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900 truncate">
                    {myName === "Dokter" ? "Pasien Budi" : "dr. Sarah Wijaya"}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Baru saja
                  </span>
                </div>
                <p className="text-xs text-blue-600 font-medium truncate italic">
                  Sesi konsultasi sedang berjalan...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Chat Window */}
        <div className="flex-1 bg-white md:rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-0">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white shrink-0">
                {myName === "Dokter" ? (
                  <User size={20} />
                ) : (
                  <Stethoscope size={20} />
                )}
              </div>
              <div className="ml-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  {myName === "Dokter" ? "Pasien Budi" : "dr. Sarah Wijaya"}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Online
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
              <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <Phone size={18} />
              </button>
              <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <Video size={18} />
              </button>
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
              >
                <Info size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <MessageCircle size={48} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">
                  Mulai percakapan dengan aman
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.senderName === myName;
                return (
                  <div
                    key={i}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-1 shrink-0 text-[10px] font-bold">
                        {msg.senderName.charAt(0)}
                      </div>
                    )}
                    <div className={`max-w-[80%] md:max-w-[70%]`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                      <div
                        className={`flex items-center mt-1 gap-1 ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && (
                          <div className="text-blue-500 text-[10px]">✓✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t shrink-0">
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1 text-slate-400 mr-1">
                <button
                  type="button"
                  className="p-1.5 hover:text-blue-600 transition-colors"
                >
                  <Smile size={20} />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:text-blue-600 transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:text-blue-600 transition-colors"
                >
                  <Camera size={20} />
                </button>
              </div>

              <div className="flex-1 relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="w-full bg-slate-100 rounded-full py-3 px-5 focus:outline-none text-sm border border-transparent focus:border-blue-100 transition-all text-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim()}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  input.trim()
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-90"
                    : "bg-slate-100 text-slate-300"
                }`}
              >
                <Send size={18} className={input.trim() ? "ml-1" : ""} />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Percakapan ini dilindungi enkripsi end-to-end
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
