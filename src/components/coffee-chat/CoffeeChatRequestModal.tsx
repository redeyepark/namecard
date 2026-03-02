'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MeetingPreference } from '@/types/coffee-chat';
import { MEETING_PREFERENCE_LABELS } from '@/types/coffee-chat';

interface CoffeeChatRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetDisplayName: string;
  targetAvatarUrl: string | null;
  onSubmit: (data: {
    receiverId: string;
    message: string;
    meetingPreference: MeetingPreference;
  }) => Promise<void>;
}

const MEETING_OPTIONS: MeetingPreference[] = ['online', 'offline', 'any'];

const MESSAGE_MIN = 20;
const MESSAGE_MAX = 500;

export default function CoffeeChatRequestModal({
  isOpen,
  onClose,
  targetUserId,
  targetDisplayName,
  targetAvatarUrl,
  onSubmit,
}: CoffeeChatRequestModalProps) {
  const [message, setMessage] = useState('');
  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference>('any');
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  if (!isOpen) return null;

  const isMessageTooShort = message.length < MESSAGE_MIN;
  const isMessageTooLong = message.length > MESSAGE_MAX;
  const isValid = !isMessageTooShort && !isMessageTooLong;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (!isValid) return;

    setSubmitting(true);
    try {
      await onSubmit({
        receiverId: targetUserId,
        message: message.trim(),
        meetingPreference,
      });
      // Reset form on success
      setMessage('');
      setMeetingPreference('any');
      setAttempted(false);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-[#fcfcfc] max-w-[480px] w-full mx-4 p-6">
        {/* Title */}
        <h2 className="text-lg font-semibold font-[family-name:var(--font-figtree),sans-serif] text-[var(--color-primary)] mb-4">
          커피챗 신청
        </h2>

        {/* Target info */}
        <div className="flex items-center gap-2 mb-5">
          {targetAvatarUrl ? (
            <Image
              src={targetAvatarUrl}
              alt={targetDisplayName}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#020912]/10 flex items-center justify-center text-xs font-medium text-[#020912]">
              {targetDisplayName.charAt(0)}
            </div>
          )}
          <span className="text-sm text-[var(--color-primary)]">
            {targetDisplayName} 님에게
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Message textarea */}
          <div className="mb-4">
            <label
              htmlFor="coffee-chat-message"
              className="block text-sm font-medium text-[var(--color-primary)] mb-1"
            >
              메시지 *
            </label>
            <textarea
              id="coffee-chat-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="자기소개와 만남 목적을 작성해주세요..."
              maxLength={MESSAGE_MAX}
              rows={5}
              className="w-full border border-[#020912]/20 bg-transparent px-3 py-2 text-sm text-[var(--color-primary)] placeholder:text-[#020912]/30 focus:outline-none focus:border-[#020912] resize-none"
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  attempted && isMessageTooShort
                    ? 'text-red-500'
                    : 'text-[#020912]/40'
                }`}
              >
                {message.length}/{MESSAGE_MAX}자
              </span>
            </div>
            {attempted && isMessageTooShort && (
              <p className="text-xs text-red-500 mt-0.5">
                최소 {MESSAGE_MIN}자 이상 작성해주세요
              </p>
            )}
          </div>

          {/* Meeting preference */}
          <fieldset className="mb-6">
            <legend className="block text-sm font-medium text-[var(--color-primary)] mb-2">
              만남 방식 선호
            </legend>
            <div className="flex gap-4">
              {MEETING_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-1.5 cursor-pointer text-sm text-[var(--color-primary)]"
                >
                  <input
                    type="radio"
                    name="meetingPreference"
                    value={option}
                    checked={meetingPreference === option}
                    onChange={() => setMeetingPreference(option)}
                    className="accent-[#020912]"
                  />
                  {MEETING_PREFERENCE_LABELS[option]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="border border-[#020912] bg-transparent text-[#020912] hover:bg-[#020912]/5 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || (attempted && !isValid)}
              className="bg-[#020912] text-[#fcfcfc] hover:opacity-90 px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 border border-[#fcfcfc] border-t-transparent rounded-full animate-spin" />
                  신청중...
                </span>
              ) : (
                '신청하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
