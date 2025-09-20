import { PrismaClient, Role } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const adminUpn = "help@agrnetworks.com" // TODO: replace with real UPN

  await prisma.user.upsert({
    where: { upn: adminUpn },
    update: {},
    create: {
      upn: adminUpn,
      display: "Administrator",
      role: Role.ADMIN,
    },
  })
}

main()
  .catch((error) => {
    console.error("Seeding failed", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
