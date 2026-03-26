import { NextResponse } from "next/server";
import { clearAuthCookie } from "../_utils";

export async function POST() {
	const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
	return clearAuthCookie(response);
}
