
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load env explicitly
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Seeding admin user...');
    try {
        const password = await bcrypt.hash('admin123', 10);
        const user = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {},
            create: {
                username: 'admin',
                password,
                role: 'admin',
                name: 'System Admin'
            }
        });
        console.log(`User created: ${user.username} (password: admin123)`);
    } catch (e) {
        console.error('Error creating admin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
