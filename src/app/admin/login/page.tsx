'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-lg shadow-sm border border-divider p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-6">
            관리자 로그인
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-1"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호를 입력하세요"
                className="w-full px-3 py-2 border border-border-medium rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus:border-transparent"
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-error">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primary text-secondary rounded-md font-medium hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
