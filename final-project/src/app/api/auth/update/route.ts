import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import User from "@/server/models/User";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phoneNumber, address, psychiatristInfo } = body;

    // Update basic fields
    const collection = await User.getCollection();
    const updateResult = await collection.updateOne(
      { _id: new (await import('mongodb')).ObjectId(session.user.id) },
      { $set: { name, phoneNumber, address } }
    );

    if (psychiatristInfo && session.user.role === 'DOCTOR') {
      // Check if psychiatristInfo already exists
      const user = await User.getUserById(session.user.id);
      if (user?.psychiatristInfo) {
        // Update existing psychiatrist info
        await User.updatePsychiatristInfo(session.user.id, psychiatristInfo);
      } else {
        // Create new psychiatrist info
        await User.createPsychiatristInfo(session.user.id, psychiatristInfo);
      }
    }

    return NextResponse.json({ message: "Profile updated" });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ message }, { status: 500 });
  }
}
