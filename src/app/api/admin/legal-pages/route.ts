import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as { role?: string })?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const legalPages = await prisma.legalPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { translations: true }
    });

    return NextResponse.json(legalPages);
  } catch (error) {
    console.error('Error fetching legal pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as { role?: string })?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slug, title, content } = body;

    if (!slug || !title || !content) {
      return NextResponse.json({ error: 'Slug, title, and content are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existingPage = await prisma.legalPage.findUnique({
      where: { slug }
    });

    if (existingPage) {
      return NextResponse.json({ error: 'A legal page with this slug already exists' }, { status: 400 });
    }

    const legalPage = await prisma.legalPage.create({
      data: {
        slug,
        title,
        content,
        translations: {
          create: [
            {
              locale: 'ka',
              title,
              slug,
              content
            },
            {
              locale: 'en',
              title,
              slug,
              content
            },
            {
              locale: 'ru',
              title,
              slug,
              content
            }
          ]
        }
      },
      include: {
        translations: true
      }
    });

    return NextResponse.json(legalPage, { status: 201 });
  } catch (error) {
    console.error('Error creating legal page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
