import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const image = await prisma.image.findUnique({
      where: { id },
      select: {
        webpData: true,
        filename: true,
      },
    });

    if (!image || !image.webpData) {
      return NextResponse.json({ error: 'WebP version not found' }, { status: 404 });
    }

    // Convert base64 to buffer
    const base64Data = image.webpData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const headers = new Headers();
    headers.set('Content-Type', 'image/webp');
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving webp image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
