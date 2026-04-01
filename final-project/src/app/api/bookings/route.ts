import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDB } from "../../../server/config/mongodb"; //<-- import dari src yg bener
import { ObjectId } from "mongodb"; //<-- import dari src yg bener
import { SendEmail } from "@/server/helpers/sendEmail";
import User from "@/server/models/User";
import { sendWhatsApp } from "@/server/helpers/sendWa";

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
    const { staffId, formBriefId, date, sessionDuration, amount, sessionType } =
      body;

    if (!staffId || !date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // validate staffId is a valid ObjectId
    if (!ObjectId.isValid(staffId)) {
      return NextResponse.json({ message: "Invalid staffId" }, { status: 400 });
    }

    // validate date is a valid ISO datetime
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }

    const db = await getDB();

    const mapType =
      sessionType === "video"
        ? "videocall"
        : sessionType === "chat"
          ? "chat-only"
          : "offline";

    const bookingData = {
      userId: new ObjectId(session.user.id),
      staffId: new ObjectId(staffId),
      formBriefId: formBriefId ? new ObjectId(formBriefId) : null,
      date: dateObj,
      sessionDuration: parseInt(sessionDuration) || 30,
      amount: parseFloat(amount) || 0,
      type: mapType,
      isPaid: false,
      isDone: false,
      createdAt: new Date(),
    };

    // Prevent double-booking for the exact same staff and datetime
    const existing = await db.collection("UserBookings").findOne({
      staffId: new ObjectId(staffId),
      date: bookingData.date,
    });
    if (existing) {
      return NextResponse.json(
        { message: "Time slot already booked" },
        { status: 409 },
      );
    }

    const result = await db.collection("UserBookings").insertOne(bookingData);

    const roomName = `room-${result.insertedId.toString()}`;

    await db.collection("Rooms").insertOne({
      userId: bookingData.userId,
      staffId: bookingData.staffId,
      roomName: roomName,
      createdAt: new Date(),
    });

    console.log("aku disini");

    let userData = null;
    let doctorData = null;
    try {
      userData = await User.getUserById(bookingData.userId.toString());
    } catch (e) {
      console.warn("Could not load user data for booking email:", e);
    }
    try {
      doctorData = await User.getUserById(bookingData.staffId.toString());
    } catch (e) {
      console.warn("Could not load doctor data for booking email:", e);
    }
    const bookingDate = bookingData.date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const bookingTime = bookingData.date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // build a tidy email payload and send without breaking the booking flow
    const emailPayload = {
      patientEmail: userData?.email ?? "",
      doctorEmail: doctorData?.email ?? "",
      doctorName: doctorData?.name ?? "",
      patientName: userData?.name ?? "Unknown Patient",
      patientPhone: userData?.phoneNumber ?? "",
      patientAddress: userData?.address ?? "",
      bookingDate: bookingDate,
      bookingTime: `${bookingTime} WIB`,
      priceTier: bookingData.amount.toString(),
    };
    try {
      void SendEmail({
        type: "doctor",
        ...emailPayload,
      }).catch((err: any) => console.error("Failed to send booking email:", err));
      void SendEmail({
        type: "patient",
        ...emailPayload,
      }).catch((err: any) => console.error("Failed to send booking email:", err));
      console.log("Email sent");
    } catch (emailErr) {
      console.error("Failed to send booking email:", emailErr);
      // don't fail the booking if email sending fails
    }

    // Send WhatsApp notification to doctor
    if (doctorData?.phoneNumber) {
      const waMessage = [
        "📢 *Booking Request*",
        "",
        `Patient : ${emailPayload.patientName}`,
        `Date    : ${emailPayload.bookingDate}`,
        `Time    : ${emailPayload.bookingTime}`,
        `Session : ${mapType}`,
        "Status  : *PENDING*",
        "",
        "Waiting for patient payment confirmation.",
      ].join("\n");
      void sendWhatsApp(doctorData.phoneNumber, waMessage)
        .then(() => console.log("WhatsApp sent to doctor"))
  .catch((err) => console.error("WA doctor error:", err));
    }
    const paymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}payment?bookingId=${result.insertedId.toString()}`;
    if (userData?.phoneNumber) {
      const waMessage = [
        "*Complete Your Payment*",
        "",
        `Hi ${emailPayload.patientName},`,
        "",
        "Booking details:",
        "",
        `Doctor  : ${emailPayload.doctorName}`,
        `Date    : ${emailPayload.bookingDate}`,
        `Time    : ${emailPayload.bookingTime}`,
        `Session : ${mapType}`,
        `Price   : Rp ${emailPayload.priceTier}`,
        "",
        "Payment link:",
        paymentUrl,
        "",
        "Your booking will be confirmed after payment.",
      ].join("\n");
      void sendWhatsApp(userData.phoneNumber, waMessage)
        .then(() =>
          console.log("WhatsApp sent to patient", userData?.phoneNumber),
        )
        .catch((err: any) => console.error("Failed to send WhatsApp:", err));
    }
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
