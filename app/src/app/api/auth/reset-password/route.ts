import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, User } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const users = getUsers();
        const user = users.find(u => u.resetToken === token);

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        // Check expiry
        if (!user.resetTokenExpiry || Date.now() > user.resetTokenExpiry) {
            return NextResponse.json({ error: "Token expired" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Clear token
        delete user.resetToken;
        delete user.resetTokenExpiry;

        saveUsers(users);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
