import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
    const payments = await prisma.payment.findMany();
    let count = 0;
    for (const payment of payments) {
        const order = await prisma.order.findUnique({ where: { id: payment.orderId }});
        if (!order) {
            console.log(`Deleting orphaned payment: ${payment.id}`);
            await prisma.payment.delete({ where: { id: payment.id }});
            count++;
        }
    }
    console.log(`Deleted ${count} orphaned payments`);
}
clean().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
