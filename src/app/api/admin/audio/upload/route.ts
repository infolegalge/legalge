import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File;
    const title = formData.get("title") as string;


    if (!file) {
      return NextResponse.json({ success: false, error: "No audio file provided" }, { status: 400 });
    }

    // Validate file type - be more flexible
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/webm", "audio/x-m4a"];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ["mp3", "wav", "ogg", "m4a", "webm"];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || "")) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid file type (${file.type}). Please upload MP3, WAV, OGG, M4A, or WebM files.` 
      }, { status: 400 });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: "File too large. Maximum size is 50MB." 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "audio");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `audio_${timestamp}.${fileExtension || 'mp3'}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const audioUrl = `/uploads/audio/${fileName}`;
    const audioRecord = await prisma.audioFile.create({
      data: {
        title: title && title.trim() ? title : '',
        fileName,
        filePath: audioUrl,
        fileSize: file.size,
        mimeType: file.type,
        duration: null, // Could be calculated later with audio processing
      },
    });

    return NextResponse.json({
      success: true,
      audio: {
        id: audioRecord.id,
        title: audioRecord.title || undefined,
        url: audioRecord.filePath,
        size: audioRecord.fileSize,
        type: audioRecord.mimeType,
      },
    });
  } catch (error: any) {
    console.error("Error uploading audio:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to upload audio file" 
    }, { status: 500 });
  }
}
