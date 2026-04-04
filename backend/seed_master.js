const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.dofeprhouepdxltbppyl:t%2An6D5yM%24MRaH7x@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
    },
  },
});

async function createMasterAccount() {
  const email = 'admin@parkeasy.com';
  const password = 'password123';
  const fullName = 'ParkEasy Master Admin';
  const phoneNumber = '9999999999';
  const role = 'PROVIDER';

  console.log(`--- SEEDING MASTER ACCOUNT ---`);
  
  try {
    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('Account already exists. Updating password to "password123"...');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await prisma.user.update({
        where: { email },
        data: { password_hash, full_name: fullName, role }
      });
      console.log('Update SUCCESS ✅');
    } else {
      console.log('Creating new Master Account...');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await prisma.user.create({
        data: {
          email,
          password_hash,
          full_name: fullName,
          phone_number: phoneNumber,
          role
        }
      });
      console.log('Creation SUCCESS ✅');
    }
    
    console.log('\n--- CREDENTIALS ---');
    console.log('EMAIL:    ', email);
    console.log('PHONE:    ', phoneNumber);
    console.log('PASSWORD: ', password);
    console.log('ROLE:     ', role);
  } catch (error) {
    console.error('FAILED ❌:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createMasterAccount();
