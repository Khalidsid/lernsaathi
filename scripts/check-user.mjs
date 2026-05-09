import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('Checking database for users...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        authProvider: true,
        passwordHash: true,
        allowlisted: true,
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('\nRun the app once to seed the user, or run:');
      console.log('  npm run dev');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email || '(none)'}`);
        console.log(`Auth Provider: ${user.authProvider}`);
        console.log(`Has Password Hash: ${user.passwordHash ? '✅ Yes' : '❌ No'}`);
        console.log(`Allowlisted: ${user.allowlisted}`);
        if (user.passwordHash) {
          console.log(`Password Hash: ${user.passwordHash.substring(0, 30)}...`);
        }
        console.log('---');
      });
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('\nMake sure:');
    console.log('1. PostgreSQL is running');
    console.log('2. DATABASE_URL in .env is correct');
    console.log('3. Run: npm run prisma:migrate');
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
