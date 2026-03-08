'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled
        >
          ☕ 커피챗 신청
        </Button>
        <Link
          href="/login"
          className="text-xs text-primary/60 underline underline-offset-2 hover:text-primary transition-colors"
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled
          className="border-text-secondary text-text-secondary"
        >
          이미 요청된 커피챗이 있습니다
        </Button>
        <Link
          href="/community/coffee-chat/my"
          className="text-xs text-primary/60 underline underline-offset-2 hover:text-primary transition-colors"
        >
          내 커피챗 보기
        </Link>
      </div>
    );
  }

  // Default: active request button
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onRequestClick}
      className="border-primary hover:bg-primary hover:text-secondary"
    >
      ☕ 커피챗 신청
    </Button>
  );
}
