const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
  });
  
  try {
    // List all users
    const users = await prisma.user.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, emailVerified: true, role: true, name: true, createdAt: true },
    });
    console.log('Users found:', users.length);
    for (const u of users) {
      console.log(`  [${u.role}] ${u.email} | verified: ${u.emailVerified ? 'YES' : 'NO'} | created: ${u.createdAt}`);
    }

    // Verify the last user if not verified
    const lastUnverified = users.find(u => !u.emailVerified);
    if (lastUnverified) {
      console.log(`\nVerifying last unverified user: ${lastUnverified.email}`);
      await prisma.user.update({
        where: { id: lastUnverified.id },
        data: { emailVerified: new Date() },
      });
      console.log('Done!');
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
