import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionCard } from '../QuestionCard';
import type { QuestionWithAuthor } from '@/types/question';

// ---------------------------------------------------------------------------
// Mock Next.js modules
// ---------------------------------------------------------------------------

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('../HashtagChip', () => ({
  HashtagChip: ({ tag, onClick }: { tag: string; onClick?: (tag: string) => void }) => (
    <button data-testid={`hashtag-${tag}`} onClick={() => onClick?.(tag)}>
      #{tag}
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function createMockQuestion(overrides: Partial<QuestionWithAuthor> = {}): QuestionWithAuthor {
  return {
    id: 'q-001',
    authorId: 'user-001',
    content: 'What is the best way to learn React in 2026?',
    hashtags: ['react', 'frontend', 'learning'],
    thoughtCount: 12,
    isActive: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    author: {
      id: 'user-001',
      displayName: 'Jane Developer',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    isOwner: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('QuestionCard', () => {
  it('renders author name', () => {
    render(<QuestionCard question={createMockQuestion()} />);

    expect(screen.getByText('Jane Developer')).toBeInTheDocument();
  });

  it('renders author avatar image when avatarUrl is provided', () => {
    render(<QuestionCard question={createMockQuestion()} />);

    const avatar = screen.getByAltText('Jane Developer');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders avatar fallback with first character when no avatarUrl', () => {
    const question = createMockQuestion({
      author: {
        id: 'user-001',
        displayName: 'Jane Developer',
        avatarUrl: null,
      },
    });

    render(<QuestionCard question={question} />);

    // The fallback displays first character of displayName
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders question content preview', () => {
    render(<QuestionCard question={createMockQuestion()} />);

    expect(screen.getByText('What is the best way to learn React in 2026?')).toBeInTheDocument();
  });

  it('renders hashtags', () => {
    render(<QuestionCard question={createMockQuestion()} />);

    expect(screen.getByTestId('hashtag-react')).toBeInTheDocument();
    expect(screen.getByTestId('hashtag-frontend')).toBeInTheDocument();
    expect(screen.getByTestId('hashtag-learning')).toBeInTheDocument();
  });

  it('does not render hashtags section when hashtags array is empty', () => {
    const question = createMockQuestion({ hashtags: [] });

    render(<QuestionCard question={question} />);

    expect(screen.queryByTestId('hashtag-react')).not.toBeInTheDocument();
  });

  it('renders thought count', () => {
    render(<QuestionCard question={createMockQuestion({ thoughtCount: 12 })} />);

    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('renders thought count with zero', () => {
    render(<QuestionCard question={createMockQuestion({ thoughtCount: 0, content: 'Simple question' })} />);

    expect(screen.getByText(/답변 0개/)).toBeInTheDocument();
  });

  it('renders relative time', () => {
    // The question was created 1 hour ago
    render(<QuestionCard question={createMockQuestion()} />);

    // Should show "1시간 전" for 1 hour ago
    expect(screen.getByText(/시간 전/)).toBeInTheDocument();
  });

  it('shows "내 질문" badge when user is the owner', () => {
    const question = createMockQuestion({ isOwner: true });

    render(<QuestionCard question={question} />);

    expect(screen.getByText('내 질문')).toBeInTheDocument();
  });

  it('does not show "내 질문" badge when user is not the owner', () => {
    const question = createMockQuestion({ isOwner: false });

    render(<QuestionCard question={question} />);

    expect(screen.queryByText('내 질문')).not.toBeInTheDocument();
  });

  it('links to question detail page', () => {
    render(<QuestionCard question={createMockQuestion({ id: 'q-test-123' })} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/community/questions/q-test-123');
  });
});
