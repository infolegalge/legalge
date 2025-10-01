'use client';

import { useState, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, convertToWebP } from '@/lib/image-utils';

interface ImageUploadProps {
  onImageUploaded: (imageData: {
    id: string;
    url: string;
    webpUrl: string;
    filename: string;
    width: number;
    height: number;
    alt: string;
  }) => void;
  onError?: (error: string) => void;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  defaultAlt?: string;
  altLabel?: string;
  altValue?: string;
  onAltChange?: (alt: string) => void;
}

export default function ImageUpload({
  onImageUploaded,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  className = '',
  disabled = false,
  defaultAlt = '',
  altLabel = 'Alt text',
  altValue,
  onAltChange,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [internalAlt, setInternalAlt] = useState(defaultAlt);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const altInputId = useId();

  const currentAlt = altValue ?? internalAlt;
  const updateAlt = (value: string) => {
    if (onAltChange) {
      onAltChange(value);
    } else {
      setInternalAlt(value);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Process and upload image
      const processedImage = await convertToWebP(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
      });

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', currentAlt.trim() || file.name);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onImageUploaded({
          id: data.image.id,
          url: data.image.url,
          webpUrl: data.image.webpUrl,
          filename: data.image.filename,
          width: data.image.width,
          height: data.image.height,
          alt: currentAlt.trim() || data.image.alt || file.name,
        });
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    updateAlt(defaultAlt || "");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor={altInputId}>{altLabel}</Label>
        <Input
          id={altInputId}
          value={currentAlt}
          onChange={(e) => updateAlt(e.target.value)}
          placeholder="Describe the image"
          disabled={disabled || uploading}
        />
      </div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? 'border-muted bg-muted/50 cursor-not-allowed'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={preview}
                alt={currentAlt || 'Preview'}
                className="max-w-full max-h-48 rounded-lg shadow-sm"
                loading="lazy"
                decoding="async"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  clearPreview();
                }}
                disabled={uploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing and uploading image...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP, GIF up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}




