import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { getJob } from '@/lib/character-gen-store'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { jobId } = await params
  const job = getJob(jobId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(job)
}
