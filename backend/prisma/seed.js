const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Create a provider user
    const hashedProviderPassword = await bcrypt.hash('provider123', 10);
    const provider = await prisma.user.upsert({
        where: { email: 'provider@test.com' },
        update: {},
        create: {
            email: 'provider@test.com',
            password_hash: hashedProviderPassword,
            full_name: 'Test Provider',
            role: 'PROVIDER',
            phone_number: '+91 9876543210',
        },
    });
    console.log('✅ Created provider user:', provider.email);

    // 2. Create a customer user
    const hashedCustomerPassword = await bcrypt.hash('customer123', 10);
    const customer = await prisma.user.upsert({
        where: { email: 'customer@test.com' },
        update: {},
        create: {
            email: 'customer@test.com',
            password_hash: hashedCustomerPassword,
            full_name: 'Test Customer',
            role: 'CUSTOMER',
            phone_number: '+91 9876543211',
        },
    });
    console.log('✅ Created customer user:', customer.email);

    // 3. Create parking facilities
    const facilitiesData = [
        {
            provider_id: provider.id,
            name: 'City Center Parking',
            address: '123 Main Street',
            city: 'Mumbai',
            latitude: 19.1136,
            longitude: 72.8697,
            total_floors: 2,
            operating_hours: '24/7',
            image_url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe',
        },
        {
            provider_id: provider.id,
            name: 'Urban Square Garage',
            address: '456 Park Avenue',
            city: 'Mumbai',
            latitude: 19.0596,
            longitude: 72.8295,
            total_floors: 1,
            operating_hours: '06:00-23:00',
            image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a',
        }
    ];

    for (const fData of facilitiesData) {
        // Since we don't have a unique constraint on name, we'll check manually or just skip if exists
        const existing = await prisma.parkingFacility.findFirst({
            where: { name: fData.name, provider_id: fData.provider_id }
        });

        if (existing) {
            console.log(`⚠️  Facility ${fData.name} already exists, skipping.`);
            continue;
        }

        const facility = await prisma.parkingFacility.create({
            data: fData
        });
        console.log(`✅ Created facility: ${facility.name}`);

        // Create floors for each facility
        for (let floorNum = 1; floorNum <= facility.total_floors; floorNum++) {
            const floor = await prisma.floor.create({
                data: {
                    facility_id: facility.id,
                    floor_number: floorNum,
                    floor_name: `Level ${floorNum}`,
                },
            });
            console.log(`  ✅ Created floor ${floorNum} for ${facility.name}`);

            // Create slots for each floor
            const vehicleTypes = ['BIKE', 'SCOOTER', 'CAR', 'TRUCK'];
            let slotCount = 0;

            for (const vehicleType of vehicleTypes) {
                const numSlots = vehicleType === 'CAR' ? 5 : 2;
                for (let i = 1; i <= numSlots; i++) {
                    await prisma.parkingSlot.create({
                        data: {
                            floor_id: floor.id,
                            slot_number: `${floorNum}-${vehicleType.charAt(0)}${i}`,
                            vehicle_type: vehicleType,
                            status: 'FREE',
                            is_active: true
                        },
                    });
                    slotCount++;
                }
            }
            console.log(`  ✅ Created ${slotCount} slots on floor ${floorNum}`);
        }

        // Create pricing rules
        const vehicleTypes = ['BIKE', 'SCOOTER', 'CAR', 'TRUCK'];
        const rates = { 'BIKE': 20, 'SCOOTER': 20, 'CAR': 50, 'TRUCK': 100 };
        const maxRates = { 'BIKE': 150, 'SCOOTER': 150, 'CAR': 500, 'TRUCK': 800 };

        for (const vType of vehicleTypes) {
            await prisma.pricingRule.create({
                data: {
                    facility_id: facility.id,
                    vehicle_type: vType,
                    hourly_rate: rates[vType],
                    daily_max: maxRates[vType],
                },
            });
        }
        console.log(`  ✅ Created pricing rules for ${facility.name}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Provider: provider@test.com / provider123');
    console.log('Customer: customer@test.com / customer123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
