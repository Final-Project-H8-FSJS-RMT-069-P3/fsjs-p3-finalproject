import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import User from "@/server/models/User";
import { BadRequestError } from "@/server/helpers/CustomError";
import {
	AUTH_PROXY_BASE_URL,
	parseJsonBody,
	proxyAuthRequest,
	registerSchema,
	toErrorResponse,
} from "../_utils";

export async function POST(request: Request) {
	try {
		const body = await parseJsonBody(request);
		const payload = registerSchema.parse(body);

		if (AUTH_PROXY_BASE_URL) {
			const { status, data } = await proxyAuthRequest("/register", payload);
			if (status >= 400) {
				return NextResponse.json(data ?? { message: "Register failed" }, { status });
			}

			return NextResponse.json(data ?? { message: "Register success" }, { status });
		}

		const existingUser = await User.getUserByEmail(payload.email);
		if (existingUser) {
			throw new BadRequestError("Email is already registered");
		}

		await User.register({
			_id: new ObjectId(),
			name: payload.name,
			email: payload.email,
			password: payload.password,
			role: payload.role,
			phoneNumber: payload.phoneNumber,
			address: payload.address,
		});

		return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
	} catch (error) {
		return toErrorResponse(error);
	}
}
