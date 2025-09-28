import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is super admin or company admin
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role;
  if (!['SUPER_ADMIN', 'COMPANY'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    console.log('Updating request:', { id, status });

    if (!['PENDING', 'APPROVED', 'DENIED', 'HANGING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the request
    const requestRecord = await prisma.request.findUnique({
      where: { id },
      include: {
        company: true
      }
    });

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updateData = { status } as const;

    // Handle role upgrade requests
    if (requestRecord.requestType === 'ROLE_UPGRADE' && status === 'APPROVED') {
      if (!requestRecord.userId) {
        return NextResponse.json({ error: 'User not found for role upgrade request' }, { status: 404 });
      }

      // Parse the message to get requested role and company info
      let requestedRole, targetCompanyId;
      try {
        const parsedMessage = JSON.parse(requestRecord.message);
        requestedRole = parsedMessage.requestedRole;
        targetCompanyId = parsedMessage.targetCompanyId;
      } catch {
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
      }

      if (!requestedRole || !['SPECIALIST', 'COMPANY'].includes(requestedRole)) {
        return NextResponse.json({ error: 'Invalid requested role' }, { status: 400 });
      }

      // Update user role and company if applicable
      const userUpdateData: any = { role: requestedRole, companySlug: null };
      if (requestedRole === 'SPECIALIST' && targetCompanyId) {
        userUpdateData.companyId = targetCompanyId;
      }

      await prisma.user.update({
        where: { id: requestRecord.userId },
        data: userUpdateData
      });

      // If upgrading to specialist, create specialist profile if it doesn't exist
      if (requestedRole === 'SPECIALIST') {
        const user = await prisma.user.findUnique({
          where: { id: requestRecord.userId }
        });

        if (user) {
          const existingProfile = await prisma.specialistProfile.findFirst({
            where: { contactEmail: user.email }
          });

          if (!existingProfile) {
            // Create basic specialist profile
            await prisma.specialistProfile.create({
              data: {
                slug: `${user.name?.toLowerCase().replace(/\s+/g, '-') || 'specialist'}-${user.id.slice(-6)}`,
                name: user.name || 'Specialist',
                contactEmail: user.email || '',
                companyId: targetCompanyId || null,
                status: 'ACTIVE'
              }
            });
          }
        }
      }

      // If upgrading to company, create company profile if it doesn't exist
      if (requestedRole === 'COMPANY') {
        const user = await prisma.user.findUnique({
          where: { id: requestRecord.userId }
        });

        if (user) {
          const existingCompany = await prisma.company.findFirst({
            where: { OR: [ { email: user.email || '' }, { users: { some: { id: user.id } } } ] }
          }) as any;

          if (!existingCompany) {
            // Create basic company profile
            const created = await prisma.company.create({
              data: {
                slug: `${user.name?.toLowerCase().replace(/\s+/g, '-') || 'company'}-${user.id.slice(-6)}`,
                name: user.name || 'Legal Company',
                email: user.email || '',
                description: 'Legal services company'
              }
            });
            await prisma.user.update({ where: { id: user.id }, data: { companyId: created.id, companySlug: created.slug } });
          } else {
            await prisma.user.update({ where: { id: user.id }, data: { companyId: existingCompany.id, companySlug: existingCompany.slug } });
          }
        }
      }
    }

    // Handle simple COMPANY/SPECIALIST requests (new model)
    if (status === 'APPROVED' && (requestRecord.requestType === 'COMPANY' || requestRecord.requestType === 'SPECIALIST')) {
      const user = await prisma.user.findUnique({ where: { email: requestRecord.email } });
      if (!user) {
        return NextResponse.json({ error: 'User not found for this request' }, { status: 404 });
      }

      if (requestRecord.requestType === 'COMPANY') {
        // Ensure a company exists (created earlier on submission or create now)
        let companyId = requestRecord.companyId || null;
        let companySlug: string | null = null;
        if (companyId) {
          const c = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, slug: true } });
          if (c) {
            companySlug = c.slug;
          } else {
            companyId = null;
          }
        }
        if (!companyId) {
          const fallbackSlug = `${(user.name || 'company').toLowerCase().replace(/\s+/g, '-')}-${user.id.slice(-6)}`;
          let unique = fallbackSlug;
          let i = 1;
          while (await prisma.company.findUnique({ where: { slug: unique } })) {
            unique = `${fallbackSlug}-${i++}`;
          }
          const created = await prisma.company.create({ data: { name: user.name || 'Legal Company', slug: unique, email: user.email || '' } });
          companyId = created.id;
          companySlug = created.slug;
        }

        await prisma.user.update({ where: { id: user.id }, data: { role: 'COMPANY', companyId: companyId!, companySlug } });
      }

      if (requestRecord.requestType === 'SPECIALIST') {
        // Approve as specialist (optionally linked to a company)
        const newData: any = { role: 'SPECIALIST' };
        if (requestRecord.companyId) {
          newData.companyId = requestRecord.companyId;
        }
        await prisma.user.update({ where: { id: user.id }, data: newData });

        // Ensure specialist profile exists
        const existingProfile = await prisma.specialistProfile.findFirst({ where: { contactEmail: user.email || '' } });
        if (!existingProfile) {
          await prisma.specialistProfile.create({
            data: {
              slug: `${(user.name || 'specialist').toLowerCase().replace(/\s+/g, '-')}-${user.id.slice(-6)}`,
              name: user.name || 'Specialist',
              contactEmail: user.email || '',
              companyId: requestRecord.companyId || null,
              status: 'ACTIVE',
            },
          });
        }
      }
    }

    // Update the request
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Prepare response
    const response: any = {
      message: 'Request updated successfully',
      request: updatedRequest
    };

    // If this was a role upgrade approval, add redirect information
    if (status === 'APPROVED') {
      try {
        if (requestRecord.requestType === 'ROLE_UPGRADE') {
          const parsedMessage = JSON.parse(requestRecord.message);
          const requestedRole = parsedMessage.requestedRole;
          if (requestedRole === 'SPECIALIST') {
            response.redirectUrl = '/specialist';
            response.message = 'Role upgrade approved! Redirecting to Specialist dashboard...';
          } else if (requestedRole === 'COMPANY') {
            response.redirectUrl = '/company';
            response.message = 'Role upgrade approved! Redirecting to Company dashboard...';
          }
        } else if (requestRecord.requestType === 'SPECIALIST') {
          response.redirectUrl = '/specialist';
          response.message = 'Request approved! Redirecting to Specialist dashboard...';
        } else if (requestRecord.requestType === 'COMPANY') {
          response.redirectUrl = '/company';
          response.message = 'Request approved! Redirecting to Company dashboard...';
        }
      } catch (error) {
        // If parsing fails, just return the basic response
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Update request error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is super admin
  if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.request.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Request deleted successfully' });

  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

