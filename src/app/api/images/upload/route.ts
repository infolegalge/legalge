import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const alt = (form.get('alt') as string) || '';
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const image = await prisma.image.create({
      data: {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        data: dataUrl,
        alt,
        uploadedBy: (session.user as any).id,
      },
      select: { id: true },
    });

    const url = `/api/images/${image.id}`;
    return NextResponse.json({ image: { id: image.id, url } });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ ok: true });
}

