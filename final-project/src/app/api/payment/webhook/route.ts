import { NextRequest, NextResponse } from "next/server";
import Order from "@/server/models/Order";
import UserBooking from "@/server/models/UserBooking";
import User from "@/server/models/User";
import { sendWhatsApp } from "@/server/helpers/sendWa";
import { SendEmail } from "@/server/helpers/sendEmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { transaction_status, order_id, fraud_status } = body;

    console.log("Webhook received:", {
      transaction_status,
      order_id,
      fraud_status,
    });

    let orderStatus: "pending" | "success" | "failed" = "pending";

    if (transaction_status === "capture") {
      if (fraud_status === "accept") {
        orderStatus = "success";
      }
    } else if (transaction_status === "settlement") {
      orderStatus = "success";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      orderStatus = "failed";
    } else if (transaction_status === "pending") {
      orderStatus = "pending";
    }

    await Order.updateOrderStatus(order_id, orderStatus);

    if (orderStatus === "success") {
      const order = await Order.getOrderById(order_id);
      console.log("[webhook] Order retrieved:", { orderId: order_id, bookingId: order?.bookingId });

      if (!order?.bookingId) {
        console.error("[webhook] No booking ID found in order:", order_id);
        return NextResponse.json(
          { message: "Booking not found" },
          { status: 404 },
        );
      }

      const booking = await UserBooking.getBookingById(order.bookingId);
      console.log("[webhook] Booking retrieved:", { bookingId: order.bookingId, isPaid: booking?.isPaid });

      if (!booking) {
        console.error("[webhook] Booking not found:", order.bookingId);
        return NextResponse.json(
          { message: "Booking not found" },
          { status: 404 },
        );
      }

      if (booking.isPaid) {
        console.log("[webhook] Booking already paid, skipping update:", order.bookingId);
        return NextResponse.json(
          { message: "Booking already paid" },
          { status: 200 },
        );
      }

      console.log("[webhook] Updating booking payment status to true:", order.bookingId);
      await UserBooking.updateBookingPaymentStatus(
        order.bookingId.toString(),
        true,
      );
      console.log("[webhook] Booking payment status updated successfully:", order.bookingId);

      const userData = await User.getUserById(booking.userId.toString());
      const doctorData = await User.getUserById(booking.staffId.toString());

      // Verify the update was successful
      const updatedBooking = await UserBooking.getBookingById(order.bookingId);
      if (updatedBooking?.isPaid) {
        console.log("[webhook] ✓ Payment status confirmed in database:", {
          bookingId: order.bookingId,
          isPaid: updatedBooking.isPaid,
        });
      } else {
        console.error("[webhook] ✗ Payment status update verification failed:", {
          bookingId: order.bookingId,
          isPaid: updatedBooking?.isPaid,
        });
      }
  

      const bookingDate = new Date(booking.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const bookingTime = new Date(booking.date).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const emailPayload = {
        patientEmail: userData?.email ?? "",
        doctorEmail: doctorData?.email ?? "",
        doctorName: doctorData?.name ?? "",
        patientName: userData?.name ?? "Unknown Patient",
        patientPhone: userData?.phoneNumber ?? "",
        patientAddress: userData?.address ?? "",
        bookingDate: bookingDate,
        bookingTime: `${bookingTime} WIB`,
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
      }

      if (userData?.phoneNumber) {
        const waMessage = [
          "✅ *Booking Confirmed*",
          "",
          `Hi ${userData.name},`,
          "",
          "Your session has been successfully scheduled:",
          "",
          `Doctor : ${doctorData?.name}`,
          `Date   : ${bookingDate}`,
          `Time   : ${bookingTime} WIB`,
          `Session : ${booking.type}`,

          "",
          "Please be ready on time 🙌",
        ].join("\n");

        try {
          await sendWhatsApp(userData.phoneNumber, waMessage);
        } catch (err) {
          console.error("WA patient failed:", err);
        }
      }

      if (doctorData?.phoneNumber) {
        const waMessage = [
          "📢 *Booking Confirmed*",
          "",
          "A booking has been confirmed.",
          "",
          `Patient : ${userData?.name}`,
          `Date    : ${bookingDate}`,
          `Time    : ${bookingTime} WIB`,
          `Session : ${booking.type}`,
          "Status  : *CONFIRMED*",
          "",
          "Please prepare accordingly.",
        ].join("\n");

        try {
          await sendWhatsApp(doctorData.phoneNumber, waMessage);
        } catch (err) {
          console.error("WA patient failed:", err);
        }
      }
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process webhook",
      },
      { status: 500 },
    );
  }
}
