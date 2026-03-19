import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Seed valmis. Admin-käyttäjä luotu:", admin.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
