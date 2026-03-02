import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThoughtForm } from '../ThoughtForm';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ThoughtForm', () => {
  describe('unauthenticated state', () => {
    it('shows login prompt when not authenticated', () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={false}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      expect(screen.getByText(/로그인 후 생각을 공유해 보세요/)).toBeInTheDocument();
    });

    it('does not show textarea when not authenticated', () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={false}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('authenticated state', () => {
    it('shows textarea when authenticated', () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      expect(screen.getByPlaceholderText(/나의 생각을 공유해 주세요/)).toBeInTheDocument();
    });

    it('shows character count', () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      // Initial state: 0/1000
      expect(screen.getByText('0/1000')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText(/나의 생각을 공유해 주세요/);
      await user.type(textarea, 'Hello');

      expect(screen.getByText('5/1000')).toBeInTheDocument();
    });

    it('validates minimum length (5 chars) on submit', async () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText(/나의 생각을 공유해 주세요/);
      fireEvent.change(textarea, { target: { value: 'Hi' } });

      // The submit button is disabled when content < 5 chars,
      // so we submit the form directly to trigger validation
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('답변은 최소 5자 이상 입력해주세요.')).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates maximum length (1000 chars) on submit', async () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText(/나의 생각을 공유해 주세요/);

      // Simulate pasting content over 1000 chars
      const longText = 'a'.repeat(1001);
      fireEvent.change(textarea, { target: { value: longText } });

      const submitButton = screen.getByRole('button', { name: /보내기/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('답변은 최대 1000자까지 입력 가능합니다.')).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit with trimmed content on valid submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText(/나의 생각을 공유해 주세요/);
      await user.type(textarea, '  This is a valid thought  ');

      const submitButton = screen.getByRole('button', { name: /보내기/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('This is a valid thought');
      });
    });

    it('clears form after successful submit', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText(/나의 생각을 공유해 주세요/) as HTMLTextAreaElement;
      await user.type(textarea, 'This is a valid thought');

      const submitButton = screen.getByRole('button', { name: /보내기/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('shows error message on submission failure', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Server error occurred'));
      const user = userEvent.setup();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText(/나의 생각을 공유해 주세요/);
      await user.type(textarea, 'This is a valid thought');

      const submitButton = screen.getByRole('button', { name: /보내기/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument();
      });
    });

    it('shows generic error message when error is not an Error instance', async () => {
      const onSubmit = vi.fn().mockRejectedValue('unknown error');
      const user = userEvent.setup();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText(/나의 생각을 공유해 주세요/);
      await user.type(textarea, 'This is a valid thought');

      const submitButton = screen.getByRole('button', { name: /보내기/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('답변 작성에 실패했습니다.')).toBeInTheDocument();
      });
    });

    it('disables submit button while isCreating is true', () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={true}
          onSubmit={onSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /보내는 중/ });
      expect(submitButton).toBeDisabled();
    });

    it('shows "보내는 중..." text while isCreating is true', () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={true}
          onSubmit={onSubmit}
        />
      );

      expect(screen.getByText('보내는 중...')).toBeInTheDocument();
    });

    it('shows "보내기" text when not creating', () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      expect(screen.getByText('보내기')).toBeInTheDocument();
    });

    it('disables submit button when content is less than 5 chars', () => {
      const onSubmit = vi.fn();

      render(
        <ThoughtForm
          isAuthenticated={true}
          isCreating={false}
          onSubmit={onSubmit}
        />
      );

      // With empty content, button should be disabled
      const submitButton = screen.getByRole('button', { name: /보내기/ });
      expect(submitButton).toBeDisabled();
    });
  });
});
