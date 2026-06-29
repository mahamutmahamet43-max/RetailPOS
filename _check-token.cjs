const { PrismaClient } = require('@prisma/client')
const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_q7t6XvKMRH7V@ep-mute-pond-atouzcau.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require'
const prisma = new PrismaClient({
  datasources: { db: { url } }
})
async function main() {
  const token = await prisma.verificationToken.findFirst({
    where: { identifier: 'verify:hamadyare55@gmail.com' }
  })
  console.log(JSON.stringify(token))
  await prisma.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1); })
