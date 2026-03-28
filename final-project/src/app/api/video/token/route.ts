import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDB } from "@/server/config/mongodb";
import { RtcTokenBuilder, RtcRole } from "agora-token";

const APP_ID = process.env.AGORA_APP_ID!;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { channelName } = await req.json();
    if (!channelName) {
      return NextResponse.json({ message: "Channel name is required" }, { status: 400 });
    }

    const db = await getDB();
    const room = await db.collection("Rooms").findOne({ roomName: channelName });

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    const currentUserId = session.user.id;
    const isUserValid = 
      room.userId.toString() === currentUserId || 
      room.staffId.toString() === currentUserId;

    if (!isUserValid) {
      return NextResponse.json({ message: "You are not authorized to join this room" }, { status: 403 });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + 3600; // Token valid for 1 hour

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      0, // UID 0 means Agora assigns a random ID
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    return NextResponse.json({ 
      token, 
      appId: APP_ID, 
      channelName 
    });

  } catch (error) {
    console.error("Video Token Error:", error);
    return NextResponse.json({ message: "Failed to generate token" }, { status: 500 });
  }
}