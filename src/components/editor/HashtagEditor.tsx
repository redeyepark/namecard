'use client';

import { useState, useCallback } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import { Button } from '@/components/ui';

export function HashtagEditor() {
  const hashtags = useCardStore((state) => state.card.back.hashtags);
  const addHashtag = useCardStore((state) => state.addHashtag);
  const removeHashtag = useCardStore((state) => state.removeHashtag);
  const [input, setInput] = useState('');

  const handleAdd = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const tag = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    addHashtag(tag);
    setInput('');
  }, [input, addHashtag]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Hashtags
      </label>

      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-bg text-text-primary rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeHashtag(index)}
                className="text-text-tertiary hover:text-error focus-visible:text-error transition-colors p-0.5"
                aria-label={`Remove ${tag}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="#NewTag"
          maxLength={30}
          className="flex-1 px-3 py-2.5 border border-border-medium rounded-radius-md text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[44px]"
          aria-label="Add hashtag"
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleAdd}
          className="min-h-[44px]"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
