// Use CommonJS require syntax
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const publicChannels = [
  { id: "c1", name: "general", type: "public" },
  { id: "c2", name: "help", type: "public" },
  { id: "c3", name: "random", type: "public" },
  { id: "c4", name: "running", type: "public" },
  { id: "c5", name: "weighttraining", type: "public" },
  { id: "c6", name: "rockclimbing", type: "public" },
  { id: "c7", name: "calisthenics", type: "public" },
]

const GPT_USER_ID = "gpt-assistant-user-id";

// Use an async function and call it
async function main() {
  console.log(`Start seeding ...`)

  for (const channelData of publicChannels) {
    const channel = await prisma.channel.upsert({
      where: { name: channelData.name }, // Use unique name to find existing channel
      update: {},
      create: {
        id: channelData.id, // Use predefined ID for consistency
        name: channelData.name,
        type: channelData.type,
      },
    })
    console.log(`Created or found public channel with id: ${channel.id} (${channel.name})`)
  }

  // Seed the GPT Assistant User
  console.log(`Upserting GPT Assistant User (ID: ${GPT_USER_ID})...`);
  const gptUser = await prisma.user.upsert({
      where: { id: GPT_USER_ID }, // Find user by the predefined ID
      update: { 
          // Optional: Update fields if user already exists
          name: "AI Fitness Assistant",
          role: "assistant" 
      },
      create: {
          id: GPT_USER_ID,
          name: "AI Fitness Assistant",
          role: "assistant", // Add a role if helpful
          // Add dummy email/username if required by schema constraints,
          // otherwise Prisma might handle nullable fields.
          // email: `assistant@placeholder.ai` 
          // username: `ai_assistant` 
      },
  });
  console.log(`Upserted GPT Assistant User: ${gptUser.name} (ID: ${gptUser.id})`);

  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 