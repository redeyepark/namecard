'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { QuestionWithAuthor } from '@/types/question';
import { QuestionDetail } from '@/components/community/QuestionDetail';

interface QuestionDetailActionsProps {
  question: QuestionWithAuthor;
  isAuthenticated: boolean;
}

export function QuestionDetailActions({
  question,
  isAuthenticated,
}: QuestionDetailActionsProps) {
  const router = useRouter();

  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/community/questions');
      }
    } catch {
      // Error handled silently
    }
  }, [question.id, router]);

  return (
    <QuestionDetail
      question={question}
      isAuthenticated={isAuthenticated}
      onDelete={handleDelete}
    />
  );
}
