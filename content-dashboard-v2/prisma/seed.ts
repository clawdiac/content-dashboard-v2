import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
    },
  })
  console.log('Created admin user:', admin.id)

  // Create a test character
  const character = await prisma.character.create({
    data: {
      name: 'Goldman',
      description: 'Main character for content generation',
    },
  })
  console.log('Created character:', character.id)

  // Create a preset for the character
  const preset = await prisma.characterPreset.create({
    data: {
      name: 'Default Look',
      imageUrl: '/uploads/references/1771243079788-ComfyUI_00041_.png',
      characterId: character.id,
      generationParams: {
        aspectRatio: '9:16',
        quality: '2K',
      },
    },
  })
  console.log('Created preset:', preset.id)

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
