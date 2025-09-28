import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'original';

    const image = await prisma.image.findUnique({
      where: { id },
      select: {
        data: true,
        webpData: true,
        mimeType: true,
        filename: true,
        alt: true,
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Determine which data to serve
    let imageData: string;
    let contentType: string;

    if (format === 'webp' && image.webpData) {
      imageData = image.webpData;
      contentType = 'image/webp';
    } else {
      imageData = image.data;
      contentType = image.mimeType;
    }

    // Convert base64 to buffer
    const base64Data = imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    headers.set('ETag', `"${id}-${format}"`);
    
    if (image.alt) {
      headers.set('X-Alt-Text', image.alt);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if image exists
    const image = await prisma.image.findUnique({
      where: { id },
      select: { uploadedBy: true },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete the image
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
