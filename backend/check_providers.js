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
    console.log(JSON.stringify(providers, null, 2));
}

main()
    .catch((err) => {
        console.error('Error fetching providers:', err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
