import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
// import { getDB } from "@/lib/db"; <-- import dari src yg bener
// import { ObjectId } from "mongodb"; <-- import dari src yg bener

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "USER") {
      return NextResponse.json({ message: "Doctors cannot book sessions" }, { status: 403 });
    }

    const body = await req.json();
    const { staffId, formBriefId, date, sessionDuration, amount } = body;

    if (!staffId || !date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const db = await getDB();
    
    const bookingData = {
      userId: new ObjectId(session.user.id),
      staffId: new ObjectId(staffId),
      formBriefId: formBriefId ? new ObjectId(formBriefId) : null,
      date: new Date(date),
      sessionDuration: parseInt(sessionDuration) || 30,
      amount: parseFloat(amount) || 0,
      isPaid: false,
      isDone: false,
      createdAt: new Date(),
    };

    const result = await db.collection("UserBookings").insertOne(bookingData);

    const roomName = `room-${result.insertedId.toString()}`;
    
    await db.collection("Rooms").insertOne({
      userId: bookingData.userId,
      staffId: bookingData.staffId,
      roomName: roomName,
      createdAt: new Date() 
    });

    return NextResponse.json({ 
      message: "Booking created successfully", 
      bookingId: result.insertedId,
      roomName: roomName
    }, { status: 201 });

  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}