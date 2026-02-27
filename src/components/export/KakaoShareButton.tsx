'use client';

import { useCallback } from 'react';
import { useKakao } from '@/components/providers/KakaoProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { getCardPublicURL } from '@/lib/qrcode';

interface KakaoShareButtonProps {
  cardId: string;
  displayName: string;
  title: string;
  hashtags: string[];
  illustrationUrl?: string | null;
  disabled?: boolean;
}

/**
 * Button that triggers a KakaoTalk share using the Kakao JS SDK Feed template.
 * Requires KakaoProvider to be mounted higher in the component tree.
 */
export function KakaoShareButton({
  cardId,
  displayName,
  title,
  hashtags,
  illustrationUrl,
  disabled = false,
}: KakaoShareButtonProps) {
  const { isInitialized } = useKakao();
  const toast = useToast();

  const isDisabled = disabled || !isInitialized;

  const handleClick = useCallback(() => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      toast.error('카카오 SDK가 초기화되지 않았습니다.');
      return;
    }

    const publicUrl = getCardPublicURL(cardId);
    const description = [title, ...hashtags.map((h) => `#${h}`)].join(' ');

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: displayName,
          description,
          imageUrl: illustrationUrl || '',
          link: {
            webUrl: publicUrl,
            mobileWebUrl: publicUrl,
          },
        },
        buttons: [
          {
            title: '명함 보기',
            link: {
              webUrl: publicUrl,
              mobileWebUrl: publicUrl,
            },
          },
        ],
      });
    } catch (err) {
      console.error('Kakao share failed:', err);
      toast.error('카카오톡 공유에 실패했습니다.');
    }
  }, [cardId, displayName, title, hashtags, illustrationUrl, toast]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="카카오톡으로 공유"
      className="inline-flex items-center justify-center gap-2 rounded-none bg-[#FEE500] px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-[#F5DC00] focus-visible:ring-2 focus-visible:ring-[#FEE500] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]"
    >
      {/* KakaoTalk speech bubble icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M9 1C4.58 1 1 3.8 1 7.2c0 2.17 1.45 4.08 3.63 5.18l-.93 3.42c-.08.3.26.54.52.37L8.06 13.5c.31.03.62.05.94.05 4.42 0 8-2.8 8-6.25S13.42 1 9 1Z"
          fill="currentColor"
        />
      </svg>
      카카오톡
    </button>
  );
}
