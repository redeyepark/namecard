'use client';

import { useState, useRef, useCallback } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import { validateImageFile, fileToBase64 } from '@/lib/validation';

export function ImageUploader() {
  const avatarImage = useCardStore((state) => state.card.front.avatarImage);
  const updateFront = useCardStore((state) => state.updateFront);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid file.');
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        updateFront({ avatarImage: base64 });
      } catch {
        setError('Failed to read image file.');
      }
    },
    [updateFront]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    updateFront({ avatarImage: null });
    setError(null);
  }, [updateFront]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Avatar Image
      </label>

      {avatarImage ? (
        <div className="space-y-2">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border-light">
            <img
              src={avatarImage}
              alt="Uploaded avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-error hover:text-error/80 focus-visible:text-error/80 font-medium py-1 min-h-[44px]"
            aria-label="Remove uploaded avatar image"
          >
            Remove Image
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`w-full border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all duration-200 min-h-[80px] flex flex-col items-center justify-center ${
            isDragging
              ? 'border-focus-ring bg-accent-blue/20 scale-[1.01]'
              : 'border-border-medium hover:border-primary/40 hover:bg-bg'
          }`}
          aria-label="Upload avatar image by drag and drop or click"
        >
          <p className="text-sm text-text-secondary">
            Drag &amp; drop or click to upload
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            PNG, JPG, WebP (max 5MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload avatar image"
      />

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
