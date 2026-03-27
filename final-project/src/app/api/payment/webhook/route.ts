import { NextRequest, NextResponse } from "next/server";
import Order from "@/server/models/Order";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Midtrans sends notification with these fields
    const { transaction_status, order_id, fraud_status } = body;

    console.log("Webhook received:", {
      transaction_status,
      order_id,
      fraud_status,
    });

    // Determine order status based on transaction_status
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

    // Update order status in database
    await Order.updateOrderStatus(order_id, orderStatus);

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
