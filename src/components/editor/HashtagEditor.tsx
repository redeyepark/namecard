'use client';

import { useState, useCallback } from 'react';
import { useCardStore } from '@/stores/useCardStore';

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
      <label className="block text-sm font-medium text-gray-700">
        Hashtags
      </label>

      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeHashtag(index)}
                className="text-gray-400 hover:text-red-500 focus-visible:text-red-500 transition-colors p-0.5"
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
          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-label="Add hashtag"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2 transition-colors min-h-[44px]"
        >
          Add
        </button>
      </div>
    </div>
  );
}
