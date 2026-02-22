import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

export async function GET() {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const references = await prisma.referenceImage.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(references)
}

export async function POST(request: Request) {
  const { error: authError2 } = await requireApiAuth('admin')
  if (authError2) return authError2

  const body = await request.json()
  const { name, imageUrl, category } = body

  if (!name || !imageUrl) {
    return NextResponse.json(
      { error: 'Name and imageUrl are required' },
      { status: 400 }
    )
  }

  const reference = await prisma.referenceImage.create({
    data: {
      name,
      imageUrl,
      category: category || null,
    },
  })

  return NextResponse.json(reference)
}
