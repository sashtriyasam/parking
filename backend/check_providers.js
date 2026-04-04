const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching providers...');
    const providers = await prisma.user.findMany({
        where: { role: 'PROVIDER' },
        select: {
            id: true,
            email: true,
            full_name: true,
            role: true
        }
    });
    console.log('Providers found:');
    const sanitized = providers.map(p => ({
        ...p,
        email: p.email ? `${p.email.charAt(0)}***@${p.email.split('@')[1]}` : 'N/A'
    }));
    console.log(JSON.stringify(sanitized, null, 2));
}

main()
    .catch((err) => {
        console.error('Error fetching providers:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
