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
import { useSession } from "next-auth/react";
import { useAgoraVideoCall } from "@/hooks/useAgoraVideoCall";
import PusherClient from "pusher-js";

type Tab = "chat" | "notes";
type Message = {
  id: number;
  senderName: string;
  text: string;
  timestamp: string;
};

// --- Video Renderer Component ---
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

function VideoCallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelName = searchParams.get("channel") ?? "";
  const { data: session } = useSession();
  const currentUserName = session?.user?.name || "User";

  const {
    connectionState,
    localVideoTrack,
    remoteVideoTrack,
    isMicOn,
    isCamOn,
    isRemoteSpeaking,
    join,
    leave,
    toggleMic,
    toggleCam,
  } = useAgoraVideoCall({
    channelName,
    onEnded: () => router.push("/bookinglist"),
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [mobChatOpen, setMobChatOpen] = useState(false);

  // --- Pusher Real-time Listener ---
  useEffect(() => {
    if (!channelName) return;

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(channelName);
    channel.bind("incoming-message", (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          senderName: data.senderName || "Unknown",
          text: data.message,
          timestamp: new Date(data.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [channelName]);

  // --- Logic Kirim Pesan ---
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelName,
            message: text,
            senderName: currentUserName,
          }),
        });
      } catch (err) {
        console.error(err);
      }
    },
    [channelName, currentUserName]
  );

  if (!channelName)
    return <div className="p-10 text-center">Invalid Session</div>;

  return (
    <div className="flex flex-col h-dvh bg-gray-50 text-gray-900 overflow-hidden">
      {/* Header */}
      <header className="p-4 bg-white border-b flex justify-between items-center">
        <h1 className="font-bold text-blue-900">Konsultasi Aktif</h1>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
          {connectionState}
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_350px] overflow-hidden">
        {/* Video Call View */}
        <div className="relative bg-black flex items-center justify-center">
          {connectionState === "connected" ? (
            <>
              {remoteVideoTrack ? (
                <VideoTrack
                  track={remoteVideoTrack}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white">Menunggu video psikolog...</div>
              )}
              {/* PiP Local Video */}
              <div className="absolute top-4 right-4 w-32 h-44 bg-gray-800 rounded-xl overflow-hidden border-2 border-white">
                {isCamOn && localVideoTrack ? (
                  <VideoTrack
                    track={localVideoTrack}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white text-xs">
                    Cam Off
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={join}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold"
            >
              Gabung Sekarang
            </button>
          )}
        </div>

        {/* Sidebar Chat (Desktop) */}
        <div className="hidden md:flex flex-col border-l bg-white">
          <div className="flex p-2 border-b bg-gray-50">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2 text-xs font-bold ${
                activeTab === "chat" ? "bg-white shadow rounded-md" : ""
              }`}
            >
              CHAT
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-2 text-xs font-bold ${
                activeTab === "notes" ? "bg-white shadow rounded-md" : ""
              }`}
            >
              CATATAN
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" ? (
              <ChatPanel
                messages={messages}
                onSend={sendMessage}
                currentUserName={currentUserName}
              />
            ) : (
              <div className="p-4 text-sm">
                Catatan sesi akan muncul di sini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-white border-t flex justify-center gap-6">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full ${
            isMicOn ? "bg-blue-50" : "bg-red-100 text-red-600"
          }`}
        >
          {isMicOn ? "🎙️" : "🔇"}
        </button>
        <button
          onClick={toggleCam}
          className={`p-4 rounded-full ${
            isCamOn ? "bg-blue-50" : "bg-red-100 text-red-600"
          }`}
        >
          {isCamOn ? "📹" : "🚫"}
        </button>
        <button
          onClick={() => confirm("Akhiri?") && leave()}
          className="p-4 bg-red-500 text-white rounded-full"
        >
          📵
        </button>
        <button
          onClick={() => setMobChatOpen(true)}
          className="md:hidden p-4 bg-gray-100 rounded-full"
        >
          💬
        </button>
      </div>

      {/* Mobile Chat Overlay */}
      {mobChatOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="p-4 border-b flex justify-between">
            <button onClick={() => setMobChatOpen(false)}>✕ Close</button>
          </div>
          <ChatPanel
            messages={messages}
            onSend={sendMessage}
            currentUserName={currentUserName}
          />
        </div>
      )}
    </div>
  );
}

// --- Chat Panel Component ---
function ChatPanel({
  messages,
  onSend,
  currentUserName,
}: {
  messages: Message[];
  onSend: (t: string) => void;
  currentUserName: string;
}) {
  const [val, setVal] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [messages]
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m: Message) => {
          const isMine = m.senderName === currentUserName;

          return (
            <div
              key={m.id}
              className={`flex flex-col ${
                isMine ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                  isMine ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1">
                {m.timestamp}
              </span>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSend(val);
              setVal("");
            }
          }}
          className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
          placeholder="Tulis pesan..."
        />
        <button
          onClick={() => {
            onSend(val);
            setVal("");
          }}
          className="bg-blue-600 text-white p-2 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default function VideoCallPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoCallContent />
    </Suspense>
  );
}
