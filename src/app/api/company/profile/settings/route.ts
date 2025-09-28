import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

type NotificationChannel = 'EMAIL' | 'IN_APP';

type SessionUser = {
  id: string
  role?: 'SUPER_ADMIN' | 'COMPANY' | 'SPECIALIST' | 'SUBSCRIBER'
  companyId?: string | null
  companySlug?: string | null
  email?: string | null
}

function resolveSessionUser(value: unknown): SessionUser {
  const user = value as SessionUser | undefined
  return {
    id: user?.id ?? '',
    role: user?.role,
    companyId: user?.companyId ?? null,
    companySlug: user?.companySlug ?? null,
    email: user?.email ?? null,
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = resolveSessionUser(session.user)
    const role = sessionUser.role
    let companyId = sessionUser.companyId

    if (role !== 'COMPANY' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!companyId && role === 'COMPANY') {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { companyId: true },
      });
      companyId = user?.companyId ?? null;
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const settings = await prisma.companySettings.findUnique({
      where: { companyId },
      select: {
        id: true,
        companyId: true,
        suspendSubmissions: true,
        autoApproveSpecialists: true,
        notificationEmail: true,
        notifyOnRequest: true,
        notifyOnPost: true,
        notifyChannel: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      settings: settings ?? {
        companyId,
        suspendSubmissions: false,
        autoApproveSpecialists: false,
        notificationEmail: sessionUser.email ?? null,
        notifyOnRequest: true,
        notifyOnPost: true,
        notifyChannel: 'EMAIL' as NotificationChannel,
      },
    });
  } catch (error) {
    console.error('Company profile settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = resolveSessionUser(session.user)
    const role = sessionUser.role
    let companyId = sessionUser.companyId

    if (role !== 'COMPANY' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!companyId && role === 'COMPANY') {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { companyId: true },
      });
      companyId = user?.companyId ?? null;
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      suspendSubmissions,
      autoApproveSpecialists,
      notificationEmail,
      notifyOnRequest,
      notifyOnPost,
      notifyChannel,
    } = body as {
      suspendSubmissions?: boolean;
      autoApproveSpecialists?: boolean;
      notificationEmail?: string | null;
      notifyOnRequest?: boolean;
      notifyOnPost?: boolean;
      notifyChannel?: NotificationChannel;
    };

    if (notificationEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(notificationEmail)) {
      return NextResponse.json({ error: 'Invalid notification email' }, { status: 400 });
    }

    const updated = await prisma.companySettings.upsert({
      where: { companyId },
      update: {
        suspendSubmissions,
        autoApproveSpecialists,
        notificationEmail,
        notifyOnRequest,
        notifyOnPost,
        notifyChannel,
      },
      create: {
        companyId,
        suspendSubmissions: suspendSubmissions ?? false,
        autoApproveSpecialists: autoApproveSpecialists ?? false,
        notificationEmail: notificationEmail ?? sessionUser.email ?? null,
        notifyOnRequest: notifyOnRequest ?? true,
        notifyOnPost: notifyOnPost ?? true,
        notifyChannel: notifyChannel ?? 'EMAIL',
      },
      select: {
        companyId: true,
        suspendSubmissions: true,
        autoApproveSpecialists: true,
        notificationEmail: true,
        notifyOnRequest: true,
        notifyOnPost: true,
        notifyChannel: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Company profile settings PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}


