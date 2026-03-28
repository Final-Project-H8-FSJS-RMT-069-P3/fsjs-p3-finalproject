import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import UserBooking from "@/server/models/UserBooking";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const bookings =
      session.user.role === "DOCTOR"
        ? await UserBooking.getBookingsByStaffId(session.user.id)
        : await UserBooking.getBookingsByUserId(session.user.id);

    const safeBookings = bookings.map((booking) => ({
      _id: booking._id?.toString(),
      userId: booking.userId.toString(),
      staffId: booking.staffId.toString(),
      date: booking.date,
      sessionDuration: booking.sessionDuration,
      amount: booking.amount,
      isPaid: booking.isPaid,
      isDone: booking.isDone,
      createdAt: booking.createdAt,
      userName: booking.user?.name || "Unknown User",
      staffName: booking.staff?.name || "Unknown Doctor",
    }));

    return NextResponse.json({
      message: "Bookings fetched successfully",
      role: session.user.role,
      data: safeBookings,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch bookings";

    return NextResponse.json({ message }, { status: 500 });
  }
}
