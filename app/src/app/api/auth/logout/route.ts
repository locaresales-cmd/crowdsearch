import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(req: NextRequest) {
    await logout();
    return NextResponse.json({ success: true });
}
