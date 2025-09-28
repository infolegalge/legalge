import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session: session ? {
        user: {
          id: (session.user as any)?.id,
          name: session.user?.name,
          email: session.user?.email,
          role: (session.user as any)?.role,
        },
        expires: (session as any).expires,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ error: 'Failed to get session info' }, { status: 500 });
  }
}
