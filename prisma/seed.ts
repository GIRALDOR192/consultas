import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Kiara2022.', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@consultas.com' },
    update: {},
    create: {
      email: 'admin@consultas.com',
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
