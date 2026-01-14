import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, User } from "@/lib/auth";
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid if not present, or use crypto.
import bcrypt from 'bcryptjs';

export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const users = getUsers();
        const initialLength = users.length;
        const newUsers = users.filter(u => u.id !== id);

        if (newUsers.length === initialLength) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        saveUsers(newUsers);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // Ideally verify admin role here
    const users = getUsers();
    // Return users users WITH passwords (as requested for admin visibility)
    // const safeUsers = users.map(({ password, ...u }) => u);
    return NextResponse.json({ users: users });
}

export async function POST(req: NextRequest) {
    try {
        const { username, password, role, name, email } = await req.json();

        // Validation Logic
        if (!name || !role) {
            return NextResponse.json({ error: "Missing common fields" }, { status: 400 });
        }

        // If email is provided (Google Auth), username/password are optional (or username can be email)
        // If email is NOT provided (Credentials), username/password are required.
        if (email) {
            // Google Auth User
            // Ensure no duplicate email
            const users = getUsers();
            if (users.find(u => u.email === email)) {
                return NextResponse.json({ error: "Email already exists" }, { status: 400 });
            }
        } else {
            // Credentials User
            if (!username || !password) {
                return NextResponse.json({ error: "Missing username/password" }, { status: 400 });
            }
            const users = getUsers();
            if (users.find(u => u.username === username)) {
                return NextResponse.json({ error: "Username already exists" }, { status: 400 });
            }
        }

        const users = getUsers(); // Reload to be safe

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser: User = {
            id: crypto.randomUUID(),
            username: username || email, // Use email as username if not provided
            password: hashedPassword,
            role,
            name,
            email // Save email
        };

        users.push(newUser);
        saveUsers(users);

        return NextResponse.json({ success: true, user: { ...newUser, password: undefined } });
    } catch (e) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
