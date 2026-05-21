import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('aura2026', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aura.local' },
    update: {},
    create: {
      email: 'admin@aura.local',
      name: 'Administrador Principal',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log({ admin })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
