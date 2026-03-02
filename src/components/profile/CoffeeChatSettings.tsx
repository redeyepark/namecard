'use client';

import { useState } from 'react';
import type {
  CoffeeChatPreferences,
  CoffeeChatMethod,
  CoffeeChatDay,
  CoffeeChatTime,
} from '@/types/profile';

const METHOD_LABELS: Record<CoffeeChatMethod, string> = {
  online: '온라인',
  offline: '오프라인',
  any: '상관없음',
};

const DAY_LABELS: Record<CoffeeChatDay, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
};

const TIME_LABELS: Record<CoffeeChatTime, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

const TIME_DESCRIPTIONS: Record<CoffeeChatTime, string> = {
  morning: '09-12시',
  afternoon: '12-18시',
  evening: '18-21시',
};

const METHODS: CoffeeChatMethod[] = ['online', 'offline', 'any'];
const DAYS: CoffeeChatDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIMES: CoffeeChatTime[] = ['morning', 'afternoon', 'evening'];

interface CoffeeChatSettingsProps {
  preferences: CoffeeChatPreferences | null;
  onSave: (prefs: CoffeeChatPreferences) => Promise<void>;
}

export function CoffeeChatSettings({ preferences, onSave }: CoffeeChatSettingsProps) {
  const [method, setMethod] = useState<CoffeeChatMethod>(preferences?.method ?? 'any');
  const [region, setRegion] = useState(preferences?.region ?? '');
  const [days, setDays] = useState<CoffeeChatDay[]>(preferences?.days ?? []);
  const [times, setTimes] = useState<CoffeeChatTime[]>(preferences?.times ?? []);
  const [intro, setIntro] = useState(preferences?.intro ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleDay = (day: CoffeeChatDay) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleTime = (time: CoffeeChatTime) => {
    setTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      await onSave({
        method,
        region,
        days,
        times,
        intro,
      });
      setFeedback({ type: 'success', message: '커피챗 설정이 저장되었습니다.' });
    } catch {
      setFeedback({ type: 'error', message: '저장에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6">
      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-4 p-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      )}

      {/* Method Selection */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#020912]/70 mb-2">
          만남 방식
        </label>
        <div className="flex gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                method === m
                  ? 'bg-[#020912] text-[#fcfcfc]'
                  : 'border border-[#020912]/20 text-[#020912]/70 hover:bg-[#020912]/5'
              }`}
            >
              {METHOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Region Input */}
      {(method === 'offline' || method === 'any') && (
        <div className="mb-5">
          <label
            htmlFor="coffee-chat-region"
            className="block text-sm font-medium text-[#020912]/70 mb-2"
          >
            선호 지역
          </label>
          <input
            id="coffee-chat-region"
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 서울 강남, 판교"
            className="w-full px-4 py-2.5 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent transition-all duration-200"
          />
        </div>
      )}

      {/* Day Checkboxes */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#020912]/70 mb-2">
          선호 요일
        </label>
        <div className="flex gap-1.5">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`flex-1 px-1 py-2 text-sm font-medium transition-colors ${
                days.includes(d)
                  ? 'bg-[#020912] text-[#fcfcfc]'
                  : 'border border-[#020912]/20 text-[#020912]/70 hover:bg-[#020912]/5'
              }`}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Time Checkboxes */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#020912]/70 mb-2">
          선호 시간대
        </label>
        <div className="flex gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTime(t)}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                times.includes(t)
                  ? 'bg-[#020912] text-[#fcfcfc]'
                  : 'border border-[#020912]/20 text-[#020912]/70 hover:bg-[#020912]/5'
              }`}
            >
              {TIME_LABELS[t]}
              <span className="block text-xs opacity-60 mt-0.5">{TIME_DESCRIPTIONS[t]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intro Textarea */}
      <div className="mb-5">
        <label
          htmlFor="coffee-chat-intro"
          className="block text-sm font-medium text-[#020912]/70 mb-2"
        >
          소개 메시지
        </label>
        <textarea
          id="coffee-chat-intro"
          value={intro}
          onChange={(e) => {
            if (e.target.value.length <= 100) {
              setIntro(e.target.value);
            }
          }}
          placeholder="어떤 주제로 대화하고 싶은지 알려주세요"
          rows={3}
          className="w-full px-4 py-2.5 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent resize-none transition-all duration-200"
        />
        <p className="mt-1 text-xs text-[#020912]/40 text-right">
          {intro.length}/100
        </p>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3 bg-[#020912] text-[#fcfcfc] text-sm font-semibold hover:bg-[#020912]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isSaving ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
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
            저장 중...
          </span>
        ) : (
          '커피챗 설정 저장'
        )}
      </button>
    </div>
  );
}
