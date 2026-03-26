"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { Send, User, MessageCircle, Stethoscope } from "lucide-react";

interface IMessage {
  senderName: string;
  message: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  
  // State untuk identitas (Biasanya dari Login/Auth)
  const [myName, setMyName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const chatId = "room-konsultasi-privat-001";

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    setInput(""); // Optimistic UI: kosongkan input segera

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

  // --- SCREEN PILIH ROLE (Hanya untuk Testing yaa nanti diganti kalo sudah ada role beneran sesuai kebutuhan) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-emerald-800 mb-6">Masuk ke Ruang Chat</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { setMyName("Dokter"); setIsLoggedIn(true); }}
              className="flex flex-col items-center p-4 border-2 border-emerald-100 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all group"
            >
              <Stethoscope size={40} className="mb-2 text-emerald-600 group-hover:text-white" />
              <span className="font-bold">Saya Dokter</span>
            </button>
            <button 
              onClick={() => { setMyName("Pasien"); setIsLoggedIn(true); }}
              className="flex flex-col items-center p-4 border-2 border-emerald-100 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all group"
            >
              <User size={40} className="mb-2 text-emerald-600 group-hover:text-white" />
              <span className="font-bold">Saya Pasien</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-emerald-100 flex flex-col h-[600px]">
        
        {/* Header */}
        <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {myName === "Dokter" ? <Stethoscope size={20} /> : <User size={20} />}
            </div>
            <div>
              <p className="text-xs opacity-80 italic">Anda masuk sebagai:</p>
              <h2 className="font-bold leading-none">{myName}</h2>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="text-xs bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20">Keluar</button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <MessageCircle size={64} className="mb-2" />
              <p>Belum ada percakapan...</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderName === myName;
              return (
                <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                    isMe 
                    ? "bg-emerald-600 text-white rounded-br-none" 
                    : "bg-white border border-emerald-100 text-slate-800 rounded-tl-none"
                  }`}>
                    <p className={`text-[10px] font-bold mb-1 ${isMe ? "text-emerald-200" : "text-emerald-600"}`}>
                      {msg.senderName}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className="text-[9px] mt-1 opacity-50 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
          <input 
            className="flex-1 bg-slate-100 border-none p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-slate-700 outline-none transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ketik pesan sebagai ${myName}...`}
          />
          <button type="submit" className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}