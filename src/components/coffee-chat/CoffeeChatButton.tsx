'use client';

import Link from 'next/link';

interface CoffeeChatButtonProps {
  targetUserId: string;
  targetDisplayName: string;
  isAuthenticated: boolean;
  isPublicProfile: boolean;
  isSelf: boolean;
  existingChatId?: string;
  onRequestClick: () => void;
}

export default function CoffeeChatButton({
  targetUserId,
  targetDisplayName,
  isAuthenticated,
  isPublicProfile,
  isSelf,
  existingChatId,
  onRequestClick,
}: CoffeeChatButtonProps) {
  if (isSelf) return null;
  if (!isPublicProfile) return null;

  // Unauthenticated user
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          disabled
          className="border border-[#020912]/30 bg-transparent text-[#020912]/40 px-4 py-2 text-sm font-medium cursor-not-allowed"
        >
          ☕ 커피챗 신청
        </button>
        <Link
          href="/login"
          className="text-xs text-[#020912]/60 underline underline-offset-2 hover:text-[#020912] transition-colors"
        >
          로그인 후 커피챗을 신청하세요
        </Link>
      </div>
    );
  }

  // Already has a pending/accepted chat
  if (existingChatId) {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          disabled
          className="border border-[#6b7280] bg-transparent text-[#6b7280] px-4 py-2 text-sm font-medium cursor-not-allowed"
        >
          이미 요청된 커피챗이 있습니다
        </button>
        <Link
          href="/community/coffee-chat/my"
          className="text-xs text-[#020912]/60 underline underline-offset-2 hover:text-[#020912] transition-colors"
        >
          내 커피챗 보기
        </Link>
      </div>
    );
  }

  // Default: active request button
  return (
    <button
      type="button"
      onClick={onRequestClick}
      className="border border-[#020912] bg-transparent hover:bg-[#020912] hover:text-[#fcfcfc] text-[#020912] px-4 py-2 text-sm font-medium transition-all"
    >
      ☕ 커피챗 신청
    </button>
  );
}
