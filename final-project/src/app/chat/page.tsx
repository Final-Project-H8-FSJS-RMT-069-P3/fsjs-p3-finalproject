import type { Metadata } from "next"
import Chat from "@/components/chat"

export const metadata: Metadata = {
  title: "ChatRoom",
  description: "Time to talk!",
}

export default function ChatPage() {
  return (
    <>
      <Chat />
    </>
  ) 
}