import Link from 'next/link';
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <header className="bg-[#020912] border-b border-[#020912]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-lg font-bold text-[#fcfcfc] hover:text-[#ffa639] transition-colors"
          >
            명함 의뢰 관리
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/requests"
              className="text-sm text-[#fcfcfc]/60 hover:text-[#ffa639] transition-colors"
            >
              의뢰 목록
            </Link>
            <Link
              href="/admin/events"
              className="text-sm text-[#fcfcfc]/60 hover:text-[#ffa639] transition-colors"
            >
              이벤트 관리
            </Link>
            <Link
              href="/admin/themes"
              className="text-sm text-[#fcfcfc]/60 hover:text-[#ffa639] transition-colors"
            >
              테마 관리
            </Link>
            <Link
              href="/admin/members"
              className="text-sm text-[#fcfcfc]/60 hover:text-[#ffa639] transition-colors"
            >
              회원 관리
            </Link>
            <Link
              href="/admin/print"
              className="text-sm text-[#fcfcfc]/60 hover:text-[#ffa639] transition-colors"
            >
              인쇄 주문
            </Link>
            <AdminLogoutButton />
            <Link
              href="/"
              className="text-sm text-[#fcfcfc]/60 hover:text-[#ffa639] transition-colors"
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
