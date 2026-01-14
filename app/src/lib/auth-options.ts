import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        // Admin / Standard Login
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("Authorize called with:", credentials?.username);

                if (!credentials?.username || !credentials?.password) return null;

                // Find user by username in DB
                const user = await prisma.user.findUnique({
                    where: { username: credentials.username }
                });

                if (user) {
                    console.log(`[AuthDebug] User found: ${user.username} (Role: ${user.role})`);
                    try {
                        const isValid = await bcrypt.compare(credentials.password, user.password);
                        console.log(`[AuthDebug] Password valid? ${isValid}`);
                        if (isValid) {
                            return { id: user.id, name: user.name, email: user.username, role: user.role };
                        }
                    } catch (err) {
                        console.error("[AuthDebug] Bcrypt error:", err);
                    }
                } else {
                    console.log("[AuthDebug] User NOT found");
                }
                return null;
            }
        }),
        // Google Login Removed as per user request
    ],

    callbacks: {
        async signIn({ user, account }) {
            return true; // Simple allow for now as credentials handle auth
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 60 * 60, // 1 hour (Forces re-login more frequently)
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
    debug: true, // Enable debug to see exact error in console
};
