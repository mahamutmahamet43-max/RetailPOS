async function main() {
  try {
    const { neon } = require('@neondatabase/serverless')
    const sql = neon('postgresql://neondb_owner:npg_q7t6XvKMRH7V@ep-mute-pond-atouzcau.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require')
    const rows = await sql`SELECT token, identifier, expires FROM "VerificationToken" WHERE identifier = 'verify:hamadyare55@gmail.com'`
    console.log(JSON.stringify(rows))
  } catch (e) {
    console.error('ERROR:', e.message)
  }
}
main()
