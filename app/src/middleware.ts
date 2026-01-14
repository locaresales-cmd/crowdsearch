import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Custom logic if needed, e.g. checking specific roles for specific paths
        const token = req.nextauth.token;
        const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

        if (isDashboard) {
            // Require admin or editor or viewer (allow all authenticated roles)
            if (token?.role !== 'admin' && token?.role !== 'editor' && token?.role !== 'viewer') {
                return NextResponse.redirect(new URL('/login', req.url));
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token, // Require login for all matched paths
        },
        secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/share/:path*",
        "/api/users/:path*"
    ],
};
