import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const USERS_FILE = path.join(process.cwd(), 'src/data/users.json');
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-it');

export interface User {
    id: string;
    username: string;
    password?: string;
    role: 'admin' | 'viewer' | 'editor';
    name: string;
    email?: string;
    resetToken?: string;
    resetTokenExpiry?: number;
}

export function getUsers(): User[] {
    if (!fs.existsSync(USERS_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Failed to read users", e);
        return [];
    }
}

export function saveUsers(users: User[]) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function login(username: string, password: string): Promise<User | null> {
    const users = getUsers();
    // In a real app, use bcrypt or argon2. For now, simple comparison as requested/MVP.
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }
    return null;
}

export async function createSession(user: User) {
    const token = await new SignJWT({ ...user })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

    (await cookies()).set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });
}

export async function verifySession() {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return null;

    try {
        const output = await jwtVerify(token, JWT_SECRET);
        return output.payload as unknown as User;
    } catch (e) {
        return null;
    }
}

export async function logout() {
    (await cookies()).delete('auth_token');
}
