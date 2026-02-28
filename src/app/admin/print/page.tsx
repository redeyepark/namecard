'use client';

import { PrintOrderManager } from '@/components/admin/PrintOrderManager';

export default function AdminPrintPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#020912]">인쇄 주문 관리</h1>
        <p className="mt-1 text-sm text-[#020912]/50">
          명함 인쇄 주문을 생성하고 관리합니다.
        </p>
      </div>
      <PrintOrderManager />
    </div>
  );
}
