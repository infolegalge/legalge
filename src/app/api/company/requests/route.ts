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

    const userRole = (session.user as any)?.role;
    if (!['COMPANY', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let companyId = (session.user as any)?.companyId as string | null | undefined;

    if (!companyId && userRole === 'COMPANY') {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { companyId: true },
      });
      companyId = user?.companyId ?? null;
      if (!companyId) {
        return NextResponse.json({ error: 'Company not found for current user' }, { status: 404 });
      }
    }

    const queryCompanyId = request.nextUrl.searchParams.get('companyId');
    const effectiveCompanyId = userRole === 'SUPER_ADMIN' && queryCompanyId ? queryCompanyId : companyId;

    const requests = await prisma.request.findMany({
      where: {
        requestType: 'SPECIALIST',
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Company requests GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}
