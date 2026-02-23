'use client';

import { useState, useRef, useCallback } from 'react';
import { convertGoogleDriveUrl } from '@/lib/url-utils';

type UploadMode = 'file' | 'url';

interface IllustrationUploaderProps {
  currentImage: string | null;
  onImageSelect: (base64: string) => void;
  onUrlInput?: (url: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function IllustrationUploader({
  currentImage,
  onImageSelect,
  onUrlInput,
  disabled = false,
}: IllustrationUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('file');
  const [urlValue, setUrlValue] = useState('');
  const [urlPreviewError, setUrlPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('PNG, JPG, WebP 형식만 지원합니다.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`파일 크기가 10MB를 초과합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onImageSelect(reader.result as string);
      };
      reader.onerror = () => {
        setError('파일을 읽는데 실패했습니다.');
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setUrlValue(url);
      setUrlPreviewError(false);
      onUrlInput?.(convertGoogleDriveUrl(url) || url);
    },
    [onUrlInput]
  );

  const handleModeSwitch = useCallback(
    (mode: UploadMode) => {
      setUploadMode(mode);
      setError(null);
      if (mode === 'file') {
        setUrlValue('');
        setUrlPreviewError(false);
        onUrlInput?.('');
      }
    },
    [onUrlInput]
  );

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      {!disabled && (
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => handleModeSwitch('file')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors min-h-[44px] ${
              uploadMode === 'file'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            파일 업로드
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('url')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors min-h-[44px] ${
              uploadMode === 'url'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            URL 입력
          </button>
        </div>
      )}

      {uploadMode === 'file' ? (
        <>
          {currentImage ? (
            <div className="space-y-2">
              <div className="relative w-full aspect-[29/45] max-w-[200px] rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={currentImage}
                  alt="Uploaded illustration"
                  className="w-full h-full object-cover"
                />
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium py-1 min-h-[44px]"
                >
                  다른 이미지 선택
                </button>
              )}
            </div>
          ) : (
            <div
              role="button"
              tabIndex={disabled ? -1 : 0}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => {
                if (!disabled) fileInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`w-full aspect-[29/45] max-w-[200px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                disabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : isDragging
                    ? 'border-blue-500 bg-blue-50 cursor-pointer'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
              }`}
              aria-label="Upload illustration image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gray-400 mb-2"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-xs text-gray-500 text-center px-2">
                {disabled ? '편집 불가' : '일러스트 업로드'}
              </p>
              {!disabled && (
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP</p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <input
            type="url"
            value={urlValue}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.png"
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[44px]"
            aria-label="Illustration image URL"
          />
          {urlValue && (
            <div className="relative w-full aspect-[29/45] max-w-[200px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {urlPreviewError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-xs text-gray-400 text-center px-2">
                    미리보기를 불러올 수 없습니다
                  </p>
                </div>
              ) : (
                <img
                  src={convertGoogleDriveUrl(urlValue) || urlValue}
                  alt="URL image preview"
                  className="w-full h-full object-cover"
                  onError={() => setUrlPreviewError(true)}
                />
              )}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
        aria-label="Upload illustration file"
      />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
