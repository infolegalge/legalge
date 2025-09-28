import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      companies: companies.map(company => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        city: company.city,
      }))
    });

  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
