import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.workspaceMember.deleteMany({});
  await prisma.userProviderKey.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.contentAttachment.deleteMany({});
  await prisma.mapNode.deleteMany({});
  await prisma.mindMap.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});

  // Create demo user
  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo User",
      password: null,
    },
  });

  // Create demo workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
  });

  // Create demo mind map
  const mindMap = await prisma.mindMap.create({
    data: {
      title: "Getting Started",
      description: "A demo mind map to get you started",
      workspaceId: workspace.id,
      nodes: {
        create: [
          {
            content: "Root Node",
            x: 0,
            y: 0,
          },
          {
            content: "Child Node 1",
            x: 100,
            y: 50,
          },
          {
            content: "Child Node 2",
            x: 100,
            y: -50,
          },
        ],
      },
    },
  });

  // Create demo template
  await prisma.template.create({
    data: {
      name: "Basic Template",
      description: "A basic template for new mind maps",
      workspaceId: workspace.id,
      content: {
        root: {
          id: "root",
          text: "Root",
          children: [],
        },
      },
    },
  });

  console.log("Seed data created successfully!");
  console.log(`Created user: ${user.email}`);
  console.log(`Created workspace: ${workspace.name}`);
  console.log(`Created mind map: ${mindMap.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
