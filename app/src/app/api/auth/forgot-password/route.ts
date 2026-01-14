import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, User } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const users = getUsers();
        // Determine if we match by email or username (since we merged them mostly)
        // Our new convention: username field stores the Login ID (Email).
        // But the legacy "User" object has both.
        // We check both just in case.
        const user = users.find(u => u.email === email || u.username === email);

        if (!user) {
            // Security: Don't reveal user existence
            return NextResponse.json({ success: true, message: "If that email exists, we sent a link." });
        }

        // Generate Token
        const token = crypto.randomUUID();
        const expiry = Date.now() + 3600000; // 1 hour

        user.resetToken = token;
        user.resetTokenExpiry = expiry;

        saveUsers(users);

        // Mock Send Email
        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        console.log("\n========================================================");
        console.log(`[PASSWORD RESET] Link for ${user.username || user.email}:`);
        console.log(resetLink);
        console.log("========================================================\n");

        return NextResponse.json({ success: true, message: "Reset link sent (check console)" });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
