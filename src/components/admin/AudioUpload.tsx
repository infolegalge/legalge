"use client";

import { useState, useRef } from "react";

interface AudioUploadProps {
  onAudioInsert: (audioUrl: string, title?: string) => void;
  onClose: () => void;
}

export default function AudioUpload({ onAudioInsert, onClose }: AudioUploadProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const title = titleInputRef.current?.value?.trim() || "";
    
    
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("title", title);

      const response = await fetch("/api/admin/audio/upload", {
        method: "POST",
        body: formData,
      });

      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        onAudioInsert(result.audio.url, result.audio.title || undefined);
        onClose();
      } else {
        setError(result.error || "Failed to upload audio");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError(err.message || "Failed to upload audio file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    const url = urlInputRef.current?.value?.trim();
    const title = titleInputRef.current?.value?.trim();
    
    if (!url) {
      setError("Please enter an audio URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
      onAudioInsert(url, title);
      onClose();
    } catch {
      setError("Please enter a valid URL");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Insert Audio</h3>
        
        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={`px-3 py-1 text-sm rounded ${mode === "upload" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setMode("upload")}
          >
            Upload File
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm rounded ${mode === "url" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setMode("url")}
          >
            Audio URL
          </button>
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Audio Title (optional)</label>
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Leave empty to hide title"
            className="w-full rounded border px-3 py-2"
            defaultValue=""
          />
        </div>

        {mode === "upload" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Audio File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="w-full rounded border px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported: MP3, WAV, OGG, M4A, WebM (max 50MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Audio URL</label>
              <input
                ref={urlInputRef}
                type="url"
                placeholder="https://example.com/audio.mp3"
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Insert Audio
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
            {error}
          </div>
        )}

        {isUploading && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
            Uploading audio file...
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
