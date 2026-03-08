'use client';

import { useRouter } from 'next/navigation';

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
    >
      로그아웃
    </button>
  );
}
