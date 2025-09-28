import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as { role?: string })?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const legalPage = await prisma.legalPage.findUnique({
      where: { id },
      include: {
        translations: true
      }
    });

    if (!legalPage) {
      return NextResponse.json({ error: 'Legal page not found' }, { status: 404 });
    }

    return NextResponse.json(legalPage);
  } catch (error) {
    console.error('Error fetching legal page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as { role?: string })?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slug, title, content, lastUpdated } = body;

    const updateData: Record<string, unknown> = {};
    if (slug !== undefined) updateData.slug = slug;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (lastUpdated !== undefined) updateData.lastUpdated = new Date(lastUpdated);

    const { id } = await params;
    const legalPage = await prisma.legalPage.update({
      where: { id },
      data: updateData,
      include: {
        translations: true
      }
    });

    return NextResponse.json(legalPage);
  } catch (error) {
    console.error('Error updating legal page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as { role?: string })?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.legalPage.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Legal page deleted successfully' });
  } catch (error) {
    console.error('Error deleting legal page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
