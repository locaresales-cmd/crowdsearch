import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    // Return session user. Note: Token roles are added to session in authOptions logic.
    return NextResponse.json({ user: session.user });
}
