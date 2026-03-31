import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDB } from "../../../server/config/mongodb"; //<-- import dari src yg bener
import { ObjectId } from "mongodb"; //<-- import dari src yg bener
import { SendEmail } from "@/server/helpers/sendEmail";
import User from "@/server/models/User";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "USER") {
      return NextResponse.json(
        { message: "Doctors cannot book sessions" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { staffId, formBriefId, date, sessionDuration, amount } = body;

    if (!staffId || !date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
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
      createdAt: new Date(),
    });

    console.log("aku disini");

    const userData = await User.getUserById(bookingData.userId.toString());
    const doctorData = await User.getUserById(bookingData.staffId.toString());

    // build a tidy email payload and send without breaking the booking flow
    const emailPayload = {
      doctorEmail: doctorData?.email ?? "",
      doctorName: doctorData?.name ?? "",
      patientName: userData?.name ?? "Unknown Patient",
      patientPhone: userData?.phoneNumber ?? "",
      patientAddress: userData?.address ?? "",
      bookingDate: bookingData.date.toLocaleDateString(),
      priceTier: bookingData.amount.toString(),
    };

    try {
      await SendEmail(emailPayload);
      console.log("Email sent");
    } catch (emailErr) {
      console.error("Failed to send booking email:", emailErr);
      // don't fail the booking if email sending fails
    }

    console.log("aku disana");

    return NextResponse.json(
      {
        message: "Booking created successfully",
        bookingId: result.insertedId,
        roomName: roomName,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
