import { NextRequest, NextResponse } from "next/server";
import { login, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();
        const user = await login(username, password);

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        await createSession(user);
        return NextResponse.json({ success: true, user });
    } catch (e) {
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
