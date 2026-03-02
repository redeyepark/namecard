import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CoffeeChatStatusBadge from '../CoffeeChatStatusBadge';
import CoffeeChatBadge from '../CoffeeChatBadge';
import CoffeeChatActions from '../CoffeeChatActions';

// ---------------------------------------------------------------------------
// CoffeeChatStatusBadge tests
// ---------------------------------------------------------------------------

describe('CoffeeChatStatusBadge', () => {
  it('renders "대기중" for pending status', () => {
    render(<CoffeeChatStatusBadge status="pending" />);
    expect(screen.getByText('대기중')).toBeInTheDocument();
  });

  it('renders "수락됨" for accepted status', () => {
    render(<CoffeeChatStatusBadge status="accepted" />);
    expect(screen.getByText('수락됨')).toBeInTheDocument();
  });

  it('renders "거절됨" for declined status', () => {
    render(<CoffeeChatStatusBadge status="declined" />);
    expect(screen.getByText('거절됨')).toBeInTheDocument();
  });

  it('renders "취소됨" for cancelled status', () => {
    render(<CoffeeChatStatusBadge status="cancelled" />);
    expect(screen.getByText('취소됨')).toBeInTheDocument();
  });

  it('renders "완료됨" for completed status', () => {
    render(<CoffeeChatStatusBadge status="completed" />);
    expect(screen.getByText('완료됨')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// CoffeeChatBadge tests
// ---------------------------------------------------------------------------

describe('CoffeeChatBadge', () => {
  it('renders count number when count > 0', () => {
    render(<CoffeeChatBadge count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders nothing when count is 0', () => {
    const { container } = render(<CoffeeChatBadge count={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when count is negative', () => {
    const { container } = render(<CoffeeChatBadge count={-1} />);
    expect(container.innerHTML).toBe('');
  });
});

// ---------------------------------------------------------------------------
// CoffeeChatActions tests
// ---------------------------------------------------------------------------

describe('CoffeeChatActions', () => {
  it('renders accept and decline buttons for pending + receiver', () => {
    render(
      <CoffeeChatActions
        status="pending"
        isRequester={false}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );

    expect(screen.getByText('수락')).toBeInTheDocument();
    expect(screen.getByText('정중히 거절')).toBeInTheDocument();
  });

  it('renders cancel button for pending + requester', () => {
    render(
      <CoffeeChatActions
        status="pending"
        isRequester={true}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('renders complete button for accepted + requester', () => {
    render(
      <CoffeeChatActions
        status="accepted"
        isRequester={true}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('만남 완료')).toBeInTheDocument();
  });

  it('renders complete button for accepted + receiver', () => {
    render(
      <CoffeeChatActions
        status="accepted"
        isRequester={false}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('만남 완료')).toBeInTheDocument();
  });

  it('renders nothing for declined status', () => {
    const { container } = render(
      <CoffeeChatActions status="declined" isRequester={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for cancelled status', () => {
    const { container } = render(
      <CoffeeChatActions status="cancelled" isRequester={true} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for completed status', () => {
    const { container } = render(
      <CoffeeChatActions status="completed" isRequester={true} />
    );
    expect(container.innerHTML).toBe('');
  });
});
