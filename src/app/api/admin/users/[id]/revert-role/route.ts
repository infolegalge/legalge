import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { newRole } = await request.json();

            if (!newRole || !['SUBSCRIBER', 'SPECIALIST', 'COMPANY'].includes(newRole)) {
              return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
            }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRole = user.role;

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: newRole }
    });

    // Handle role-specific profile management
    if (oldRole !== 'SPECIALIST' && newRole === 'SPECIALIST') {
      // If changing to specialist, create profile if it doesn't exist
      const specialistProfile = await prisma.specialistProfile.findFirst({
        where: { contactEmail: user.email }
      });
      
      if (!specialistProfile) {
        await prisma.specialistProfile.create({
          data: {
            slug: `${user.name?.toLowerCase().replace(/\s+/g, '-') || 'specialist'}-${user.id.slice(-6)}`,
            name: user.name || 'Specialist',
            contactEmail: user.email || ''
          }
        });
      }
    }

    // Check if there's already a recent ROLE_CHANGE request for this user
            const existingRoleChangeRequest = await prisma.request.findFirst({
              where: {
                userId: user.id,
                requestType: 'ROLE_CHANGE',
                status: 'APPROVED',
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
                }
              },
              orderBy: { createdAt: 'desc' }
            });

            if (!existingRoleChangeRequest) {
              // Only create a new request if there isn't a recent one
              await prisma.request.create({
                data: {
                  email: user.email || '',
                  phone: '',
                  message: `Role changed from ${oldRole} to ${newRole} by Super Admin`,
                  requestType: 'ROLE_CHANGE',
                  status: 'APPROVED',
                  userId: user.id
                }
              });
            } else {
              // Update the existing request message instead of creating a new one
              await prisma.request.update({
                where: { id: existingRoleChangeRequest.id },
                data: {
                  message: `Role changed from ${oldRole} to ${newRole} by Super Admin`,
                  updatedAt: new Date()
                }
              });
            }

    return NextResponse.json({
      message: `User role successfully changed from ${oldRole} to ${newRole}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Role change error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
