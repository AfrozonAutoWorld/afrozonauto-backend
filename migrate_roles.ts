import 'dotenv/config';
import { PrismaClient, UserRole } from './src/generated/prisma/client';

const prisma = new PrismaClient();

async function migrateRoles() {
    console.log('Migrating existing users to include roles array...');
    
    // Use findRaw to get the actual documents with the legacy 'role' field
    const usersRaw = await (prisma.user as any).findRaw({});
    let migratedCount = 0;

    for (const userRaw of usersRaw) {
        const id = userRaw._id.$oid || userRaw._id;
        const roles = userRaw.roles || [];
        const oldRole = userRaw.role;

        // If roles is empty or missing, populate it with their current primary role
        if (!roles || roles.length === 0) {
            if (oldRole) {
                // Map old role to new UserRole enum if needed
                // For now assuming they match exactly as strings
                let roleToSet: UserRole = oldRole as UserRole;
                
                // Optional: Handle mapping if old roles were different
                if (oldRole === 'ADMIN') roleToSet = UserRole.SUPER_ADMIN;

                await prisma.user.update({
                    where: { id: id },
                    data: {
                        roles: { set: [roleToSet] }
                    }
                });
                migratedCount++;
            } else {
                // Fallback to BUYER if no role at all
                await prisma.user.update({
                    where: { id: id },
                    data: {
                        roles: { set: [UserRole.BUYER] }
                    }
                });
                migratedCount++;
            }
        }
    }

    console.log(`Migration complete! Successfully migrated array roles for ${migratedCount} out of ${usersRaw.length} users.`);
}

migrateRoles()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
