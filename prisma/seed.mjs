import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // Create test user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: {
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
      },
    });

    console.log("👤 Created test user:", user.email);

    // Create test workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
      include: {
        members: true,
      },
    });

    console.log("🏢 Created test workspace:", workspace.name);

    // Create test mind map
    const mindMap = await prisma.mindMap.create({
      data: {
        title: "Test Mind Map",
        description: "A test mind map for debugging",
        complexity: "simple",
        workspaceId: workspace.id,
      },
    });

    console.log("🗺️ Created test mind map:", mindMap.title);

    // Create some test nodes
    await prisma.mapNode.createMany({
      data: [
        {
          mindMapId: mindMap.id,
          title: "Root Node",
          content: "This is the root node of our test mind map",
          level: 0,
          order: 0,
          x: 0,
          y: 0,
        },
        {
          mindMapId: mindMap.id,
          title: "Child Node 1",
          content: "This is the first child node",
          level: 1,
          order: 0,
          x: 200,
          y: 100,
        },
        {
          mindMapId: mindMap.id,
          title: "Child Node 2",
          content: "This is the second child node",
          level: 1,
          order: 1,
          x: 200,
          y: 250,
        },
      ],
    });

    console.log("✅ Database seeded successfully!");
    console.log("\n🔑 Test Credentials:");
    console.log("Email: test@example.com");
    console.log("Password: password123");
    console.log("\n🏢 Test Workspace ID:", workspace.id);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();