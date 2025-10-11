import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role as string | undefined;
    if (!['SPECIALIST', 'SUPER_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let companyId = (session.user as any).companyId as string | undefined | null;
    if (!companyId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { companyId: true },
      });
      companyId = dbUser?.companyId ?? null;
    }

    const where = companyId
      ? {
          OR: [
            { type: 'GLOBAL' },
            { type: 'COMPANY', companyId },
          ],
        }
      : { type: 'GLOBAL' };

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Specialist categories GET error', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
