import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.service.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Service deleted' })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
