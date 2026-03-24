import { NextResponse } from "next/server";
import User from "@/server/models/User";
import {
	AUTH_PROXY_BASE_URL,
	extractToken,
	loginSchema,
	parseJsonBody,
	proxyAuthRequest,
	toErrorResponse,
	withAuthCookie,
} from "../_utils";

export async function POST(request: Request) {
	try {
		const body = await parseJsonBody(request);
		const payload = loginSchema.parse(body);

		if (AUTH_PROXY_BASE_URL) {
			const { status, data } = await proxyAuthRequest("/login", payload);
			if (status >= 400) {
				return NextResponse.json(data ?? { message: "Login failed" }, { status });
			}

			const token = extractToken(data);
			const response = NextResponse.json(data ?? { message: "Login success" }, { status });

			return token ? withAuthCookie(response, token) : response;
		}

		const token = await User.login(payload);
		const response = NextResponse.json({ message: "Login success" }, { status: 200 });
		return withAuthCookie(response, token);
	} catch (error) {
		return toErrorResponse(error);
	}
}
