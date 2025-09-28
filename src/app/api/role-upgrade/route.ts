import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestedRole, targetCompanyId, message } = body;

    // Validate input
    if (!requestedRole || !['SPECIALIST', 'COMPANY'].includes(requestedRole)) {
      return NextResponse.json(
        { error: 'Invalid requested role' },
        { status: 400 }
      );
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: (session.user as any).email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.request.findFirst({
      where: {
        email: (session.user as any).email,
        requestType: 'ROLE_UPGRADE',
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending role upgrade request' },
        { status: 400 }
      );
    }

    // Create the role upgrade request
    const roleUpgradeRequest = await prisma.request.create({
      data: {
        email: (session.user as any).email,
        phone: '',
        message: JSON.stringify({
          requestedRole,
          targetCompanyId,
          userMessage: message || ''
        }),
        requestType: 'ROLE_UPGRADE', // Use consistent requestType
        companyId: targetCompanyId || null,
        status: 'PENDING',
        userId: user.id
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Role upgrade request submitted successfully',
      request: roleUpgradeRequest
    });

  } catch (error) {
    console.error('Role upgrade request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all role upgrade requests for this user
    const requests = await prisma.request.findMany({
      where: {
        email: (session.user as any).email,
        requestType: 'ROLE_UPGRADE'
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      requests: requests.map(req => {
        let parsedMessage;
        try {
          parsedMessage = JSON.parse(req.message);
        } catch {
          parsedMessage = { userMessage: req.message };
        }
        
        return {
          id: req.id,
          requestedRole: parsedMessage.requestedRole || 'SPECIALIST', // Extract from message
          currentRole: 'SUBSCRIBER', // Current role is SUBSCRIBER
          status: req.status,
          message: parsedMessage.userMessage || req.message,
          company: req.company,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt
        };
      })
    });

  } catch (error) {
    console.error('Error fetching role upgrade requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}