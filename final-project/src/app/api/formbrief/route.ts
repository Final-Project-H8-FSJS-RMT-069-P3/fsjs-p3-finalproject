import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import FormBrief from "@/server/models/FormBrief";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const briefs = await FormBrief.getFormBriefByUserId(userId);

    return NextResponse.json(briefs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch FormBriefs" }, { status: 500 });
  }
}