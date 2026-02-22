import Link from 'next/link';
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-lg font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            명함 의뢰 관리
          </Link>
          <div className="flex items-center gap-4">
            <AdminLogoutButton />
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
