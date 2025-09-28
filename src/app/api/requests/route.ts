import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      phone,
      message,
      requestType,
      companyId,
      companyName,
      companySlug,
    } = body as {
      phone: string;
      message: string;
      requestType: 'SPECIALIST' | 'COMPANY';
      companyId?: string | null;
      companyName?: string;
      companySlug?: string;
    };

    const sessionEmail = (session?.user as { email?: string | null } | undefined)?.email ?? null;

    // Validation
    if (!sessionEmail || !phone || !message || !requestType) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 });
    }

    if (!['SPECIALIST', 'COMPANY'].includes(requestType)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    // For company requests, require basic company info
    if (requestType === 'COMPANY') {
      if (!companyName || !(companyName as string).trim() || !companySlug || !(companySlug as string).trim()) {
        return NextResponse.json({ error: 'Company name and slug are required' }, { status: 400 });
      }
    }

    // Check if company exists (if companyId is provided)
    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        return NextResponse.json({ error: 'Selected company not found' }, { status: 400 });
      }
    }

    // Create or resolve company for COMPANY requests
    let createdCompanyId: string | null = null;
    if (requestType === 'COMPANY') {
      const base = (companySlug || companyName || '').toString().toLowerCase()
        .normalize('NFKC')
        .replace(/["'’`]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
      if (!companyName || !base) {
        return NextResponse.json({ error: 'Company name and slug are required' }, { status: 400 });
      }
      let unique = base;
      let i = 1;
      while (await prisma.company.findUnique({ where: { slug: unique } })) {
        unique = `${base}-${i++}`;
      }
      const created = await prisma.company.create({ data: { name: companyName, slug: unique } });
      createdCompanyId = created.id;
    }

    // Create the request
    const newRequest = await prisma.request.create({
      data: {
        email: sessionEmail,
        phone,
        message,
        requestType,
        companyId: requestType === 'COMPANY' ? createdCompanyId : companyId || null,
        status: 'PENDING',
        userId: (session?.user as { id?: string } | undefined)?.id ?? null,
      },
    });

    return NextResponse.json({
      message: 'Request submitted successfully',
      requestId: newRequest.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Request submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const company = searchParams.get('company');

    const where: {
      status?: string;
      requestType?: string;
      companyId?: string;
    } = {};
    
    if (status) {
      where.status = status;
    }
    
    if (company === 'true') {
      const role = (session?.user as { role?: string } | undefined)?.role;
      const userCompanyId = (session?.user as { companyId?: string | null } | undefined)?.companyId ?? null;
      if (!session || role !== 'COMPANY') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!userCompanyId) {
        return NextResponse.json({ error: 'Company not linked to user' }, { status: 400 });
      }
      where.requestType = 'SPECIALIST';
      where.companyId = userCompanyId;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);

  } catch (error) {
    console.error('Fetch requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

