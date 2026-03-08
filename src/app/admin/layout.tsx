import Link from 'next/link';
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-primary border-b border-primary">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-lg font-bold text-secondary hover:text-accent-orange transition-colors"
          >
            명함 의뢰 관리
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/requests"
              className="text-sm text-secondary/60 hover:text-accent-orange transition-colors"
            >
              의뢰 목록
            </Link>
            <Link
              href="/admin/events"
              className="text-sm text-secondary/60 hover:text-accent-orange transition-colors"
            >
              이벤트 관리
            </Link>
            <Link
              href="/admin/themes"
              className="text-sm text-secondary/60 hover:text-accent-orange transition-colors"
            >
              테마 관리
            </Link>
            <Link
              href="/admin/questions"
              className="text-sm text-secondary/60 hover:text-accent-orange transition-colors"
            >
              질문 관리
            </Link>
            <Link
              href="/admin/members"
              className="text-sm text-secondary/60 hover:text-accent-orange transition-colors"
            >
              회원 관리
            </Link>
            <Link
              href="/admin/print"
              className="text-sm text-secondary/60 hover:text-accent-orange transition-colors"
            >
              인쇄 주문
            </Link>
            <AdminLogoutButton />
            <Link
              href="/"
              className="text-sm text-secondary/60 hover:text-accent-orange transition-colors"
            >
              사이트로 이동
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
