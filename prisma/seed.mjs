import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data in correct order (respecting foreign key constraints)
  await prisma.shareLink.deleteMany({});
  await prisma.userPresence.deleteMany({});
  await prisma.nodeCitation.deleteMany({});
  await prisma.contentAttachment.deleteMany({});
  await prisma.mapNode.deleteMany({});
  await prisma.generationJob.deleteMany({});
  await prisma.contentSource.deleteMany({});
  await prisma.mapTemplate.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.mindMap.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.userProviderKey.deleteMany({});
  await prisma.session.deleteMany({});
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

  // Create demo mind map with complete structure
  const mindMap = await prisma.mindMap.create({
    data: {
      title: "Getting Started",
      description: "A demo mind map to get you started",
      summary: "Welcome to your mind map editor",
      prompt: "Create a mind map about learning a new skill",
      provider: "openai",
      complexity: "simple",
      workspaceId: workspace.id,
      nodes: {
        create: [
          {
            title: "Getting Started",
            content: "Welcome to the mind map editor! This is the root node of your mind map.",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            level: 0,
            order: 0,
            shape: "rectangle",
            isCollapsed: false,
            children: {
              create: [
                {
                  title: "Key Concepts",
                  content: "Learn the fundamental concepts and terminology",
                  x: -200,
                  y: 150,
                  width: 180,
                  height: 80,
                  level: 1,
                  order: 0,
                  shape: "rectangle",
                  isCollapsed: false,
                },
                {
                  title: "Next Steps",
                  content: "Plan your next actions and milestones",
                  x: 200,
                  y: 150,
                  width: 180,
                  height: 80,
                  level: 1,
                  order: 1,
                  shape: "rectangle",
                  isCollapsed: false,
                },
              ],
            },
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
          text: "Main Topic",
          children: [],
        },
      },
    },
  });

  // Create demo map template
  await prisma.mapTemplate.create({
    data: {
      name: "Project Planning Template",
      description: "Template for planning projects with objectives, timeline, and resources",
      category: "project",
      prompt: "Create a project planning mind map with phases, objectives, timeline, and resources",
      language: "en",
      complexity: "moderate",
      isPublic: true,
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
