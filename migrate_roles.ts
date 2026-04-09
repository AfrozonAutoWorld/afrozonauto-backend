import 'dotenv/config';
import { PrismaClient, UserRole } from './src/generated/prisma/client';

const prisma = new PrismaClient();

async function migrateRoles() {
    console.log('Migrating existing users to include roles array...');
    const users = await prisma.user.findMany();
    let migratedCount = 0;

    for (const user of users) {
        // If roles is empty or missing, populate it with their current primary role
        if (!user.roles || user.roles.length === 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    roles: [(user as any).role as UserRole]
                }
            });
            migratedCount++;
        } else if (!user.roles.includes((user as any).role as UserRole)) {
            // If they have an array but it's missing their primary role
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    roles: {
                        push: (user as any).role as UserRole
                    }
                }
            });
            migratedCount++;
        }
    }

    console.log(`Migration complete! Successfully migrated array roles for ${migratedCount} out of ${users.length} users.`);
}

migrateRoles()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
