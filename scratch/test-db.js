const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const users = await prisma.user.count();
    const clients = await prisma.client.count();
    const processes = await prisma.process.count();
    console.log('--- DATABASE STATUS ---');
    console.log('Users:', users);
    console.log('Clients:', clients);
    console.log('Processes:', processes);
    
    if (processes > 0) {
      const sampleProc = await prisma.process.findFirst({
        include: { client: true }
      });
      console.log('Sample Process:', sampleProc);
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
