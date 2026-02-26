'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CardData } from '@/types/card';
import { generateVCard, generateQRDataURL, getCardPublicURL } from '@/lib/qrcode';
import { AdminCardPreview } from '@/components/admin/AdminCardPreview';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  card: CardData;
  illustrationUrl?: string | null;
  /** When false, shows a notice that the card is private (admin context). */
  isPublic?: boolean;
}

/**
 * Modal displaying two QR codes for a card:
 * 1. vCard QR - scanning saves contact info
 * 2. URL QR - scanning opens the public card page
 *
 * Includes download buttons for both QR codes and a vCard (.vcf) download.
 */
export function QRCodeModal({
  isOpen,
  onClose,
  cardId,
  card,
  illustrationUrl,
  isPublic,
}: QRCodeModalProps) {
  const [vcardQR, setVcardQR] = useState<string | null>(null);
  const [urlQR, setUrlQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const vcard = generateVCard(card);
      const publicURL = getCardPublicURL(cardId);

      const [vcardDataURL, urlDataURL] = await Promise.all([
        generateQRDataURL(vcard, 256),
        generateQRDataURL(publicURL, 256),
      ]);

      setVcardQR(vcardDataURL);
      setUrlQR(urlDataURL);
    } catch {
      // QR generation failed silently; images remain null
    } finally {
      setLoading(false);
    }
  }, [card, cardId]);

  useEffect(() => {
    if (isOpen) {
      generate();
    } else {
      setVcardQR(null);
      setUrlQR(null);
    }
  }, [isOpen, generate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const downloadImage = (dataURL: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadVCardFile = () => {
    const vcard = generateVCard(card);
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${card.front.displayName || 'contact'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayName = card.front.displayName || 'namecard';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="QR 코드"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="relative bg-white w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-lg border border-[rgba(2,9,18,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#020912]">
            QR 코드
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#020912]/60 hover:text-[#020912] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Private card notice */}
        {isPublic === false && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-sm text-amber-800">
            이 카드는 비공개 상태입니다. URL QR 코드로 접근해도 카드가 표시되지 않을 수 있습니다.
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-6 w-6 text-[#020912]/40"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="ml-2 text-sm text-[#020912]/60">
              QR 코드 생성 중...
            </span>
          </div>
        )}

        {/* QR code grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* vCard QR */}
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-[#020912] mb-1">
                명함정보 QR
              </h3>
              <p className="text-xs text-[#020912]/50 mb-3 text-center">
                스캔하면 연락처가 저장됩니다
              </p>
              {vcardQR ? (
                <img
                  src={vcardQR}
                  alt="vCard QR 코드"
                  width={256}
                  height={256}
                  className="border border-[rgba(2,9,18,0.15)]"
                />
              ) : (
                <div className="w-[256px] h-[256px] border border-[rgba(2,9,18,0.15)] bg-[#fcfcfc] flex items-center justify-center">
                  <span className="text-xs text-[#020912]/30">
                    생성 실패
                  </span>
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2 w-full">
                <button
                  type="button"
                  disabled={!vcardQR}
                  onClick={() =>
                    vcardQR &&
                    downloadImage(vcardQR, `${displayName}-vcard-qr.png`)
                  }
                  className="w-full min-h-[44px] px-4 py-2 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다운로드
                </button>
                <button
                  type="button"
                  onClick={downloadVCardFile}
                  className="w-full min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-[#020912] hover:bg-[#020912]/90 transition-colors"
                >
                  vCard 다운로드 (.vcf)
                </button>
              </div>
            </div>

            {/* URL QR */}
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-[#020912] mb-1">
                명함 URL QR
              </h3>
              <p className="text-xs text-[#020912]/50 mb-3 text-center">
                스캔하면 명함 페이지로 이동합니다
              </p>
              {urlQR ? (
                <img
                  src={urlQR}
                  alt="URL QR 코드"
                  width={256}
                  height={256}
                  className="border border-[rgba(2,9,18,0.15)]"
                />
              ) : (
                <div className="w-[256px] h-[256px] border border-[rgba(2,9,18,0.15)] bg-[#fcfcfc] flex items-center justify-center">
                  <span className="text-xs text-[#020912]/30">
                    생성 실패
                  </span>
                </div>
              )}
              <div className="mt-3 w-full">
                <button
                  type="button"
                  disabled={!urlQR}
                  onClick={() =>
                    urlQR &&
                    downloadImage(urlQR, `${displayName}-url-qr.png`)
                  }
                  className="w-full min-h-[44px] px-4 py-2 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다운로드
                </button>
              </div>

              {/* Card preview when public */}
              {isPublic && (
                <div className="mt-4 w-full">
                  <p className="text-xs text-[#020912]/50 mb-2 text-center">
                    명함 미리보기
                  </p>
                  <div className="w-full max-w-[180px] mx-auto">
                    <AdminCardPreview
                      card={card}
                      illustrationUrl={illustrationUrl ?? null}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
