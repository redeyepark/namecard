'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MeetingPreference } from '@/types/coffee-chat';
import { MEETING_PREFERENCE_LABELS } from '@/types/coffee-chat';
import { Modal, Button } from '@/components/ui';

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

  return (
    <Modal open={isOpen} onClose={onClose} title="커피챗 신청" size="md">
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
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {targetDisplayName.charAt(0)}
          </div>
        )}
        <span className="text-sm text-primary">
          {targetDisplayName} 님에게
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Message textarea */}
        <div className="mb-4">
          <label
            htmlFor="coffee-chat-message"
            className="block text-sm font-medium text-primary mb-1"
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
            className="w-full border border-border-medium bg-transparent px-3 py-2 text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex justify-end mt-1">
            <span
              className={`text-xs ${
                attempted && isMessageTooShort
                  ? 'text-error'
                  : 'text-primary/40'
              }`}
            >
              {message.length}/{MESSAGE_MAX}자
            </span>
          </div>
          {attempted && isMessageTooShort && (
            <p className="text-xs text-error mt-0.5">
              최소 {MESSAGE_MIN}자 이상 작성해주세요
            </p>
          )}
        </div>

        {/* Meeting preference */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-primary mb-2">
            만남 방식 선호
          </legend>
          <div className="flex gap-4">
            {MEETING_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex items-center gap-1.5 cursor-pointer text-sm text-primary"
              >
                <input
                  type="radio"
                  name="meetingPreference"
                  value={option}
                  checked={meetingPreference === option}
                  onChange={() => setMeetingPreference(option)}
                  className="accent-primary"
                />
                {MEETING_PREFERENCE_LABELS[option]}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={submitting}
            disabled={submitting || (attempted && !isValid)}
          >
            신청하기
          </Button>
        </div>
      </form>
    </Modal>
  );
}
