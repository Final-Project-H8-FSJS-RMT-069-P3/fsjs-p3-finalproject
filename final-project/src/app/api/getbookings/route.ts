import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import UserBooking from "@/server/models/UserBooking";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url)
    const staffId = url.searchParams.get('staffId')
    const dateStr = url.searchParams.get('date') // expected format 'YYYY-MM-DD'

    let bookings = []
    if (staffId && dateStr) {
      // return bookings for the staff on that specific date
      const all = await UserBooking.getBookingsByStaffId(staffId)
      const start = new Date(`${dateStr}T00:00:00`)
      const end = new Date(`${dateStr}T23:59:59.999`)
      bookings = all.filter(b => {
        const d = new Date(b.date)
        return d >= start && d <= end
      })
    } else {
      bookings =
        session.user.role === "DOCTOR"
          ? await UserBooking.getBookingsByStaffId(session.user.id)
          : await UserBooking.getBookingsByUserId(session.user.id);
    }

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
