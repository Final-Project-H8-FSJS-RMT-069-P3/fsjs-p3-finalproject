/* import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher"; // Gunakan 'pusher' (tanpa -js) jika di backend murni, 
                                // tapi untuk Next.js Route Handler biasanya pakai library 'pusher' server-side.
import PusherServer from "pusher";

const pusher = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const { message, senderName, chatId } = await req.json();

    await pusher.trigger(chatId, "incoming-message", {
      message,
      senderName,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal kirim" }, { status: 500 });
  }
}

// tolong untk yang setup nnti variabelnya di samain aja yaa biar jalan contoh kayak !!chatId BUKAN roomId!! */

import { NextRequest, NextResponse } from "next/server";
import PusherServer from "pusher";

const pusher = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const { message, senderName, channelName } = await req.json();

    // Kirim data ke Pusher menggunakan channelName yang sama dengan Video Call
    await pusher.trigger(channelName, "incoming-message", {
      message,
      senderName,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Gagal" }, { status: 500 });
  }
}
