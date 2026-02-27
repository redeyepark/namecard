'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { exportCardAsPng, exportCardAsBlob } from '@/lib/export';
import {
  canShare,
  canCopyImageToClipboard,
  copyTextToClipboard,
  copyImageToClipboard,
  createCompositeImage,
} from '@/lib/share-utils';
import { useToast } from '@/components/ui/ToastProvider';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import { ExportBottomSheet } from '@/components/export/ExportBottomSheet';
import { KakaoShareButton } from '@/components/export/KakaoShareButton';
import { SocialShareButtons } from '@/components/export/SocialShareButtons';
import { getCardPublicURL } from '@/lib/qrcode';

// ── Inline SVG Icons ──────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="3" width="14" height="14" rx="0" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
      <path d="M3 14l4-4 3 3 2-2 5 5H3v-2z" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 2l7 4-7 4-7-4 7-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 10l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 14l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="6" width="10" height="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 14V4h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8.5 11.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 13l1.5-1.5a3 3 0 000-4.24l-.76-.76a3 3 0 00-4.24 0L6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 7L7.5 8.5a3 3 0 000 4.24l.76.76a3 3 0 004.24 0L14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="14" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.8 9l4.4-3M7.8 11l4.4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────

interface ExportPanelProps {
  cardId?: string;
  isPublic?: boolean;
  illustrationUrl?: string;
  displayName?: string;
  title?: string;
  hashtags?: string[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: () => React.JSX.Element;
  onClick: () => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}

// ── Component ─────────────────────────────────────────────────────────

export function ExportPanel({
  cardId,
  isPublic = false,
  illustrationUrl,
  displayName,
  title: cardTitle,
  hashtags = [],
}: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  // Detect viewport size for responsive layout
  useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mql.matches);

    function handleChange(e: MediaQueryListEvent) {
      setIsDesktop(e.matches);
      // Close panel on layout change to prevent misaligned UI
      setIsOpen(false);
    }

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  // ── Action handlers ───────────────────────────────────────────────

  // Wrapper to handle loading state and error catching for all actions
  const runAction = useCallback(
    async (id: string, fn: () => Promise<void>) => {
      setActionLoading(id);
      try {
        await fn();
      } catch (err) {
        console.error(`Export action "${id}" failed:`, err);
        toast.error('작업 중 오류가 발생했습니다');
      } finally {
        setActionLoading(null);
      }
    },
    [toast]
  );

  const handleDownloadFront = useCallback(async () => {
    const el = document.getElementById('card-front');
    if (!el) {
      toast.error('카드 앞면을 찾을 수 없습니다');
      return;
    }
    await exportCardAsPng(el, 'namecard-front.png');
    toast.success('앞면 이미지가 다운로드되었습니다');
  }, [toast]);

  const handleDownloadBack = useCallback(async () => {
    const el = document.getElementById('card-back');
    if (!el) {
      toast.error('카드 뒷면을 찾을 수 없습니다');
      return;
    }
    await exportCardAsPng(el, 'namecard-back.png');
    toast.success('뒷면 이미지가 다운로드되었습니다');
  }, [toast]);

  const handleDownloadComposite = useCallback(async () => {
    const frontEl = document.getElementById('card-front');
    const backEl = document.getElementById('card-back');
    if (!frontEl || !backEl) {
      toast.error('카드를 찾을 수 없습니다');
      return;
    }
    const [frontBlob, backBlob] = await Promise.all([
      exportCardAsBlob(frontEl),
      exportCardAsBlob(backEl),
    ]);
    const composite = await createCompositeImage(frontBlob, backBlob);
    const url = URL.createObjectURL(composite);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'namecard-composite.png';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('합성 이미지가 다운로드되었습니다');
  }, [toast]);

  const handleCopyImage = useCallback(async () => {
    const el = document.getElementById('card-front');
    if (!el) {
      toast.error('카드 앞면을 찾을 수 없습니다');
      return;
    }
    const blob = await exportCardAsBlob(el);
    const ok = await copyImageToClipboard(blob);
    if (ok) {
      toast.success('이미지가 복사되었습니다');
    } else {
      toast.error('이미지 복사에 실패했습니다');
    }
  }, [toast]);

  const handleCopyLink = useCallback(async () => {
    const url = cardId
      ? `${window.location.origin}/cards/${cardId}`
      : window.location.href;
    const ok = await copyTextToClipboard(url);
    if (ok) {
      toast.success('링크가 복사되었습니다');
    } else {
      toast.error('링크 복사에 실패했습니다');
    }
  }, [cardId, toast]);

  const handleShare = useCallback(async () => {
    const url = cardId
      ? `${window.location.origin}/cards/${cardId}`
      : window.location.href;
    try {
      await navigator.share({ title: 'My Namecard', url });
    } catch (err) {
      // User cancelled the share dialog - not an error
      if (err instanceof Error && err.name === 'AbortError') return;
      throw err;
    }
  }, [cardId]);

  // ── Menu items ────────────────────────────────────────────────────

  const downloadItems: MenuItem[] = [
    {
      id: 'download-front',
      label: '앞면 PNG 다운로드',
      icon: DownloadIcon,
      onClick: handleDownloadFront,
    },
    {
      id: 'download-back',
      label: '뒷면 PNG 다운로드',
      icon: ImageIcon,
      onClick: handleDownloadBack,
    },
    {
      id: 'download-composite',
      label: '앞/뒤 합성 PNG 다운로드',
      icon: LayersIcon,
      onClick: handleDownloadComposite,
    },
  ];

  const etcItems: MenuItem[] = [
    {
      id: 'copy-image',
      label: '이미지 복사',
      icon: CopyIcon,
      onClick: handleCopyImage,
      disabled: !canCopyImageToClipboard(),
      disabledReason: '이 브라우저에서는 이미지 복사를 지원하지 않습니다',
    },
    {
      id: 'copy-link',
      label: '링크 복사',
      icon: LinkIcon,
      onClick: handleCopyLink,
    },
    {
      id: 'share',
      label: '공유하기',
      icon: ShareIcon,
      onClick: handleShare,
      disabled: !canShare(),
      disabledReason: '이 브라우저에서는 공유 기능을 지원하지 않습니다',
    },
  ];

  // ── Menu item renderer ────────────────────────────────────────────

  function renderMenuItem(item: MenuItem) {
    const Icon = item.icon;
    const isLoading = actionLoading === item.id;
    const isDisabled = item.disabled || isLoading;

    return (
      <button
        key={item.id}
        type="button"
        role="menuitem"
        disabled={isDisabled}
        title={item.disabled ? item.disabledReason : undefined}
        onClick={async () => {
          await runAction(item.id, item.onClick);
          setIsOpen(false);
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-3 text-sm text-left
          min-h-[44px] transition-colors
          ${isDisabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-800 hover:bg-gray-50 active:bg-gray-100'
          }
        `}
      >
        <span className="shrink-0 w-5 h-5">
          <Icon />
        </span>
        <span className="flex-1">{item.label}</span>
        {isLoading && (
          <span className="shrink-0 w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        )}
      </button>
    );
  }

  // ── Section renderer ──────────────────────────────────────────────

  function renderSectionLabel(label: string) {
    return (
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
    );
  }

  // ── Menu content (shared between dropdown and bottom sheet) ────────

  const menuContent = (
    <>
      {/* Download section */}
      {renderSectionLabel('다운로드')}
      {downloadItems.map(renderMenuItem)}

      <div className="my-1 border-t border-gray-100" />

      {/* Social share section */}
      {renderSectionLabel('소셜 공유')}
      {!isPublic && cardId && (
        <div className="mx-4 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 text-xs text-amber-800">
          이 카드는 비공개 상태입니다. 소셜 공유를 사용하려면 먼저 공개로 변경하세요.
        </div>
      )}
      <div className="px-4 py-2 space-y-3">
        {cardId && (
          <KakaoShareButton
            cardId={cardId}
            displayName={displayName || ''}
            title={cardTitle || ''}
            hashtags={hashtags}
            illustrationUrl={illustrationUrl}
            disabled={!isPublic}
          />
        )}
        <SocialShareButtons
          url={cardId ? getCardPublicURL(cardId) : (typeof window !== 'undefined' ? window.location.href : '')}
          title={displayName || ''}
          disabled={!isPublic && !!cardId}
        />
      </div>

      <div className="my-1 border-t border-gray-100" />

      {/* Misc section */}
      {renderSectionLabel('기타')}
      {etcItems.map(renderMenuItem)}

      {/* Bottom padding for mobile safe area */}
      <div className="h-2" />
    </>
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="내보내기 및 공유 메뉴 열기"
        className="
          w-full px-4 py-3 bg-gray-900 text-white font-medium
          hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-900
          focus-visible:ring-offset-2 transition-colors min-h-[44px]
          flex items-center justify-center gap-2
        "
      >
        <ShareIcon />
        <span>내보내기 / 공유</span>
        <ChevronDownIcon />
      </button>

      {/* Panel: portal-rendered dropdown or bottom sheet */}
      {isOpen && mounted && createPortal(
        isDesktop ? (
          <ExportDropdown
            onClose={() => setIsOpen(false)}
            triggerRef={triggerRef}
          >
            {menuContent}
          </ExportDropdown>
        ) : (
          <ExportBottomSheet onClose={() => setIsOpen(false)}>
            {menuContent}
          </ExportBottomSheet>
        ),
        document.body
      )}
    </div>
  );
}
