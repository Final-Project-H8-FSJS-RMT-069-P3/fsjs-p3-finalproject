import { NextRequest, NextResponse } from "next/server";
import midtransClient from "midtrans-client"
import { cookies } from "next/headers";
import { verifyToken } from "@/helpers/jwt";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token.value);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, grossAmount, items, customerDetails } = body;

    // Create Snap API instance
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
      clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: items,
      customer_details: customerDetails,
      credit_card: {
        secure: true,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error: unknown) {
    console.error("Payment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create payment",
      },
      { status: 500 },
    );
  }
}
