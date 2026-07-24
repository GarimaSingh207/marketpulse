import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import prisma from "./src/lib/prisma";

async function seedAdmin() {
  const adminEmail = "admin@example.com";
  const adminPassword = "Admin123";

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`Admin user '${adminEmail}' already exists. Skipping seed.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log(`Admin user created successfully: ${admin.email}`);
  } catch (error) {
    console.error("Error seeding admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
