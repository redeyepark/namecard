'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginButton } from '@/components/auth/LoginButton';
import { UserHome } from '@/components/home/UserHome';

const features = [
  {
    title: '간편한 입력',
    description: '단계별 위저드로 쉽게 정보를 입력하세요',
    icon: (
      <svg
        className="w-8 h-8 text-[#020912]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    ),
  },
  {
    title: '실시간 미리보기',
    description: '입력하는 동안 명함이 어떻게 보이는지 즉시 확인',
    icon: (
      <svg
        className="w-8 h-8 text-[#020912]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: 'PNG 내보내기',
    description: '완성된 명함을 고화질 이미지로 다운로드',
    icon: (
      <svg
        className="w-8 h-8 text-[#020912]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
    ),
  },
];

export function LandingPage() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !isLoading && !!user;

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020912]">
        <svg
          className="animate-spin h-6 w-6 text-white/40"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Authenticated users see their home page
  if (isAuthenticated) {
    return <UserHome />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#020912] text-[#fcfcfc]">
        {/* Top-right login area */}
        <div className="relative max-w-5xl mx-auto px-4 pt-4 flex justify-end">
          <LoginButton />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 md:py-32 text-center">
          <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            나만의 명함을
            <br />
            만들어보세요
          </h1>
          <p className="font-[family-name:var(--font-anonymous-pro),monospace] mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-[#fcfcfc]/70 max-w-2xl mx-auto leading-relaxed">
            간단한 5단계로 전문적인 디지털 명함을 완성하세요
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 border border-[#fcfcfc] text-[#fcfcfc] text-base sm:text-lg font-semibold hover:bg-[#fcfcfc] hover:text-[#020912] transition-all duration-200"
            >
              로그인하여 시작하기
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 bg-[#ffa639] text-[#020912] text-base sm:text-lg font-semibold hover:bg-[#ffa639]/90 transition-all duration-200"
            >
              둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="flex-1 bg-[#fcfcfc] py-16 sm:py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-[family-name:var(--font-figtree),sans-serif] text-xl sm:text-2xl md:text-3xl font-bold text-[#020912]">
              주요 기능
            </h2>
            <p className="font-[family-name:var(--font-anonymous-pro),monospace] mt-2 text-sm sm:text-base text-[#020912]/50">
              누구나 쉽게 사용할 수 있는 명함 편집기
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-[#fcfcfc] p-6 sm:p-8 border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-colors duration-200"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-semibold text-[#020912] mb-2">
                  {feature.title}
                </h3>
                <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm sm:text-base text-[#020912]/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020912] border-t border-[rgba(2,9,18,0.15)] py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#fcfcfc]/40">Namecard Editor</p>
        </div>
      </footer>
    </div>
  );
}
