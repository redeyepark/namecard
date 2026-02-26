'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EventBadge } from '@/components/admin/EventBadge';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import type { MemberRequestDetail, RequestStatus } from '@/types/request';

interface Member {
  email: string;
  requestCount: number;
  latestRequestDate: string;
}

const THEME_LABELS: Record<string, string> = {
  classic: 'Classic',
  pokemon: 'Pokemon',
  hearthstone: 'Hearthstone',
  harrypotter: 'Harry Potter',
  tarot: 'Tarot',
};

function ThemeBadge({ theme }: { theme: string }) {
  const label = THEME_LABELS[theme] || theme;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
      {label}
    </span>
  );
}

export default function AdminMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  // Accordion state
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [memberRequests, setMemberRequests] = useState<MemberRequestDetail[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

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

  const fetchMemberRequests = useCallback(async (email: string) => {
    setRequestsLoading(true);
    setRequestsError(null);
    setMemberRequests([]);
    try {
      const res = await fetch(`/api/admin/members/${encodeURIComponent(email)}/requests`);
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setMemberRequests(data.requests);
    } catch {
      setRequestsError('의뢰 목록을 불러오는데 실패했습니다.');
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const handleToggleExpand = (email: string) => {
    if (expandedEmail === email) {
      // Collapse
      setExpandedEmail(null);
      setMemberRequests([]);
      setRequestsError(null);
    } else {
      // Expand and fetch
      setExpandedEmail(email);
      fetchMemberRequests(email);
    }
  };

  const handleDelete = async (e: React.MouseEvent, email: string, requestCount: number) => {
    e.stopPropagation();
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
      if (expandedEmail === email) {
        setExpandedEmail(null);
        setMemberRequests([]);
      }
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
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60 w-8"></th>
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
                  const isExpanded = expandedEmail === member.email;

                  return (
                    <MemberRow
                      key={member.email}
                      member={member}
                      formatted={formatted}
                      isExpanded={isExpanded}
                      deletingEmail={deletingEmail}
                      requestsLoading={requestsLoading}
                      requestsError={requestsError}
                      memberRequests={memberRequests}
                      onToggleExpand={handleToggleExpand}
                      onDelete={handleDelete}
                      onRequestClick={(id) => router.push(`/admin/${id}`)}
                    />
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

interface MemberRowProps {
  member: Member;
  formatted: string;
  isExpanded: boolean;
  deletingEmail: string | null;
  requestsLoading: boolean;
  requestsError: string | null;
  memberRequests: MemberRequestDetail[];
  onToggleExpand: (email: string) => void;
  onDelete: (e: React.MouseEvent, email: string, requestCount: number) => void;
  onRequestClick: (id: string) => void;
}

function MemberRow({
  member,
  formatted,
  isExpanded,
  deletingEmail,
  requestsLoading,
  requestsError,
  memberRequests,
  onToggleExpand,
  onDelete,
  onRequestClick,
}: MemberRowProps) {
  return (
    <>
      <tr
        className={`border-b border-[rgba(2,9,18,0.08)] hover:bg-[#e4f6ff]/50 transition-colors cursor-pointer ${
          isExpanded ? 'bg-[#e4f6ff]/30' : ''
        }`}
        onClick={() => onToggleExpand(member.email)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand(member.email);
          }
        }}
      >
        <td className="py-3 px-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-[#020912]/40 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </td>
        <td className="py-3 px-4 text-[#020912]">{member.email}</td>
        <td className="py-3 px-4 text-[#020912]/70">{member.requestCount}건</td>
        <td className="py-3 px-4 text-[#020912]/50">{formatted}</td>
        <td className="py-3 px-4">
          <button
            type="button"
            onClick={(e) => onDelete(e, member.email, member.requestCount)}
            disabled={deletingEmail === member.email}
            className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {deletingEmail === member.email ? '삭제 중...' : '삭제'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="p-0">
            <div className="bg-[#f8fafb] border-b border-[rgba(2,9,18,0.08)]">
              {requestsLoading ? (
                <div className="text-center py-6 text-gray-500">
                  <svg
                    className="animate-spin h-5 w-5 mx-auto mb-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs">의뢰 목록 로딩 중...</span>
                </div>
              ) : requestsError ? (
                <div className="text-center py-6">
                  <p className="text-red-500 text-xs">{requestsError}</p>
                </div>
              ) : memberRequests.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-xs">의뢰 내역이 없습니다</p>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-[#020912]/50">사진</th>
                        <th className="text-left py-2 px-3 font-medium text-[#020912]/50">이름</th>
                        <th className="text-left py-2 px-3 font-medium text-[#020912]/50">테마</th>
                        <th className="text-left py-2 px-3 font-medium text-[#020912]/50">이벤트</th>
                        <th className="text-left py-2 px-3 font-medium text-[#020912]/50">상태</th>
                        <th className="text-left py-2 px-3 font-medium text-[#020912]/50">제출일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberRequests.map((req) => {
                        const reqDate = new Date(req.submittedAt);
                        const reqFormatted = reqDate.toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr
                            key={req.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestClick(req.id);
                            }}
                            className="border-b border-[rgba(2,9,18,0.05)] hover:bg-[#e4f6ff]/60 cursor-pointer transition-colors"
                            role="link"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onRequestClick(req.id);
                              }
                            }}
                          >
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <div className="w-8 h-10 rounded border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {req.originalAvatarUrl ? (
                                    <img
                                      src={req.originalAvatarUrl}
                                      alt="Avatar thumbnail"
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      crossOrigin="anonymous"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-[10px] text-gray-300">--</span>
                                  )}
                                </div>
                                {req.illustrationUrl && (
                                  <div className="w-8 h-10 rounded border border-purple-200 bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img
                                      src={convertGoogleDriveUrl(req.illustrationUrl) || req.illustrationUrl}
                                      alt="Illustration thumbnail"
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      crossOrigin="anonymous"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-[#020912] font-medium">
                              {req.displayName}
                            </td>
                            <td className="py-2 px-3">
                              <ThemeBadge theme={req.theme} />
                            </td>
                            <td className="py-2 px-3">
                              <EventBadge eventName={req.eventName || undefined} />
                            </td>
                            <td className="py-2 px-3">
                              <StatusBadge status={req.status as RequestStatus} />
                            </td>
                            <td className="py-2 px-3 text-[#020912]/50">
                              {reqFormatted}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
