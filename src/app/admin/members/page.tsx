'use client';

import { useState, useEffect } from 'react';

interface Member {
  email: string;
  requestCount: number;
  latestRequestDate: string;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch('/api/admin/members');
        if (!res.ok) throw new Error('Failed to fetch members');
        const data = await res.json();
        setMembers(data.members);
      } catch {
        setError('회원 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const handleDelete = async (email: string, requestCount: number) => {
    if (
      !window.confirm(
        `${email}의 모든 데이터(${requestCount}건의 명함의뢰)를 영구 삭제하시겠습니까?`
      )
    ) {
      return;
    }
    setDeletingEmail(email);
    try {
      const res = await fetch(`/api/admin/members/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '삭제에 실패했습니다.');
      }
      setMembers((prev) => prev.filter((m) => m.email !== email));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeletingEmail(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="animate-spin h-6 w-6 mx-auto mb-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" role="alert">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#020912]">
          회원 관리
        </h1>
        <span className="text-sm text-[#020912]/50">
          총 {members.length}명
        </span>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">등록된 회원이 없습니다</p>
        </div>
      ) : (
        <div className="bg-white border border-[rgba(2,9,18,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">이메일</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">의뢰 수</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">최근 활동</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const date = new Date(member.latestRequestDate);
                  const formatted = date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr
                      key={member.email}
                      className="border-b border-[rgba(2,9,18,0.08)] hover:bg-[#e4f6ff]/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-[#020912]">{member.email}</td>
                      <td className="py-3 px-4 text-[#020912]/70">{member.requestCount}건</td>
                      <td className="py-3 px-4 text-[#020912]/50">{formatted}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(member.email, member.requestCount)}
                          disabled={deletingEmail === member.email}
                          className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          {deletingEmail === member.email ? '삭제 중...' : '삭제'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
