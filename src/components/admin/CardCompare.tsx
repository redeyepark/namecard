'use client';

interface CardCompareProps {
  originalAvatarUrl: string | null;
  illustrationUrl: string | null;
  illustrationPreview: string | null; // Local preview before saving
}

export function CardCompare({
  originalAvatarUrl,
  illustrationUrl,
  illustrationPreview,
}: CardCompareProps) {
  const illustrationSrc = illustrationPreview || illustrationUrl;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Original avatar */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 text-center">
          원본 사진
        </p>
        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          {originalAvatarUrl ? (
            <img
              src={originalAvatarUrl}
              alt="Original avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-xs text-gray-400 text-center px-2">
              업로드된 사진 없음
            </p>
          )}
        </div>
      </div>

      {/* Illustration */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 text-center">
          일러스트
        </p>
        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          {illustrationSrc ? (
            <img
              src={illustrationSrc}
              alt="Illustration"
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-xs text-gray-400 text-center px-2">
              아직 없음
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
