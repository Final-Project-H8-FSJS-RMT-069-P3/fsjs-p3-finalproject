"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const capitalizeName = (name?: string | null) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  useEffect(() => {
    if (session) {
      setMessages([
        {
          role: "ai",
          content: `Halo ${capitalizeName(session?.user?.name || "")}, Aku di sini untuk mendengarkan. Kamu bisa cerita apa saja tanpa takut.`,
        },
      ]);
    }
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const formatHistory = (messages: Message[]) => {
    return messages.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userText },
    ];

    setMessages(newMessages);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/ai-psikolog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          history: formatHistory(newMessages),
          type: "chat",
        }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
      if (data.redirectToBooking) {
        setTimeout(() => {
          router.push("/qna");
        }, 1000);
      }
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Terjadi kesalahan, coba lagi ya 🙏" },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700">
      {/* HERO */}
      <div className="text-center text-white pt-16 md:pt-20 pb-10 md:pb-16 px-4">
        <h1 className="text-2xl md:text-5xl font-bold">
          Cerita dengan <span className="text-orange-400">AI Pendengar</span>
        </h1>
        <p className="mt-3 md:mt-4 max-w-xl mx-auto text-sm md:text-base opacity-80">
          Aman, anonim, dan tanpa menghakimi.
        </p>
      </div>

      {/* CHAT */}
      <div className="flex-1 flex justify-center px-3 md:px-4 pb-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4 pb-10 bg-gradient-to-b from-white via-gray-50 to-gray-100">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 md:px-5 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm leading-relaxed max-w-[80%] md:max-w-md backdrop-blur ${
                    msg.role === "user"
                      ? "bg-blue-500/90 text-white rounded-br-none shadow-lg"
                      : "bg-white/80 text-gray-800 rounded-bl-none shadow border border-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing */}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white/80 px-4 py-2 rounded-2xl flex gap-1 shadow ">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="sticky bottom-3 md:bottom-4 px-3 md:px-4 pb-[env(safe-area-inset-bottom)]">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 px-3 py-2 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ceritakan apa yang kamu rasakan..."
                className="flex-1 resize-none bg-transparent outline-none text-sm max-h-28"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button
                onClick={handleSend}
                className="bg-orange-500 text-white p-2 rounded-full shadow hover:bg-orange-600"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
