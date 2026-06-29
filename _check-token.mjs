import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_q7t6XvKMRH7V@ep-mute-pond-atouzcau-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' } }
})
try {
  const token = await prisma.verificationToken.findFirst({
    where: { identifier: 'verify:hamadyare55@gmail.com' }
  })
  console.log(JSON.stringify(token))
} catch (e) {
  console.error(e.message)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
