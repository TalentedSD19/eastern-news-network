import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getPlatformProxy } from "wrangler";

// Seeds the local D1 database that `next dev` and `npm run preview` use
// (apply migrations first: `npx wrangler d1 migrations apply DB --local`).
async function main() {
  const { env, dispose } = await getPlatformProxy<CloudflareEnv>();
  const prisma = new PrismaClient({ adapter: new PrismaD1(env.DB) });

  const password1 = await bcrypt.hash("admin1234", 12);
  const password2 = await bcrypt.hash("editor1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@easternnewsnetwork.com" },
    update: {},
    create: { email: "admin@easternnewsnetwork.com", password: password1, name: "Admin" },
  });

  const editor = await prisma.user.upsert({
    where: { email: "editor@easternnewsnetwork.com" },
    update: {},
    create: { email: "editor@easternnewsnetwork.com", password: password2, name: "Editor" },
  });

  const categories = [
    { name: "Politics", slug: "politics" },
    { name: "Economy", slug: "economy" },
    { name: "Society", slug: "society" },
    { name: "Culture", slug: "culture" },
    { name: "Environment", slug: "environment" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("Seeded users:");
  console.log(`  ${admin.email}  /  admin1234`);
  console.log(`  ${editor.email}  /  editor1234`);
  console.log("Seeded 5 categories.");

  await prisma.$disconnect();
  await dispose();
}

main().catch(console.error);
