# SPEC-DASHBOARD-001: 구현 계획 (Implementation Plan)

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-DASHBOARD-001 |
| 제목 | User Dashboard - Implementation Plan |
| 관련 SPEC | SPEC-AUTH-001, SPEC-ADMIN-001, SPEC-FLOW-001 |

---

## 마일스톤

### Primary Goal: API 및 데이터 계층

**목표:** 사용자별 요청 조회 API와 데이터 접근 함수 구현

**작업 내역:**

1. `src/lib/storage.ts`에 `getRequestsByUser(email: string)` 함수 추가
   - `card_requests` 테이블에서 `created_by = email` 조건으로 필터링
   - `submitted_at` 기준 내림차순 정렬
   - `RequestSummary[]` 형태로 반환

2. `src/app/api/requests/my/route.ts` 생성
   - `requireAuth()`로 인증 검증
   - `getRequestsByUser(user.email)` 호출
   - `{ requests, total }` 형태로 응답

3. `src/app/api/requests/[id]/route.ts` GET 핸들러 수정
   - 기존 `requireAuth()` 이후 소유권 검증 추가
   - `isAdmin(user.email)` 확인: 관리자는 모든 요청 조회 가능
   - 일반 사용자: `cardRequest.createdBy === user.email` 검증
   - 불일치 시 403 Forbidden 반환

**완료 기준:**
- API 엔드포인트가 올바른 데이터를 반환한다
- 인증 및 소유권 검증이 정상 작동한다
- 다른 사용자의 요청에 접근 시 403이 반환된다

---

### Secondary Goal: 대시보드 페이지 및 컴포넌트

**목표:** 사용자 대시보드 UI 구현

**작업 내역:**

1. `src/components/dashboard/ProgressStepper.tsx` 생성
   - 3단계 수평 프로그레스 인디케이터
   - 상태별 색상: blue(submitted), amber(processing), green(confirmed)
   - 완료 단계 체크 아이콘, 현재 단계 강조, 미도달 단계 회색

2. `src/components/dashboard/RequestCard.tsx` 생성
   - 개별 요청 카드 (모바일 레이아웃용)
   - Display Name, StatusBadge, 제출일, ProgressStepper 포함
   - 클릭 시 `/dashboard/[id]`로 이동

3. `src/components/dashboard/MyRequestList.tsx` 생성
   - 반응형 요청 목록
   - 모바일: RequestCard 카드 리스트
   - 데스크톱: 테이블 레이아웃

4. `src/components/dashboard/EmptyState.tsx` 생성
   - 요청 없음 안내 메시지
   - `/create` 링크 버튼

5. `src/app/dashboard/page.tsx` 생성
   - `'use client'` 클라이언트 컴포넌트
   - `useAuth()` 훅으로 인증 상태 확인
   - `fetch('/api/requests/my')`로 요청 목록 조회
   - 로딩/에러/빈 상태 처리
   - 상단 "새 명함 만들기" 버튼 배치

**완료 기준:**
- 대시보드 페이지가 정상 렌더링된다
- 사용자의 요청 목록이 표시된다
- 빈 상태 UI가 표시된다
- 반응형 레이아웃이 작동한다

---

### Tertiary Goal: 요청 상세 페이지 및 네비게이션

**목표:** 요청 상세 뷰와 네비게이션 통합

**작업 내역:**

1. `src/components/dashboard/MyRequestDetail.tsx` 생성
   - 상태 이력: `StatusHistory` 컴포넌트 재사용
   - 이미지 비교: `CardCompare` 컴포넌트 재사용 (일러스트가 있는 경우)
   - 명함 정보 읽기 전용 표시 (앞면/뒷면 데이터)
   - 사용자 메모 표시
   - ProgressStepper로 현재 진행 상태 표시

2. `src/app/dashboard/[id]/page.tsx` 생성
   - `'use client'` 클라이언트 컴포넌트
   - `fetch('/api/requests/[id]')`로 상세 조회
   - 403 응답 시 대시보드로 리다이렉트
   - 로딩/에러 상태 처리
   - 뒤로가기 버튼 (`/dashboard`로 이동)

3. `src/middleware.ts` 수정
   - `protectedRoutes` 배열에 `'/dashboard'` 추가

4. `src/components/auth/UserMenu.tsx` 수정
   - "내 요청" 메뉴 항목 추가 (아이콘 + 텍스트)
   - `/dashboard` 링크

**완료 기준:**
- 요청 상세 페이지가 정상 렌더링된다
- 기존 컴포넌트(StatusHistory, CardCompare)가 재사용된다
- 네비게이션 메뉴에서 대시보드 접근이 가능하다
- 미들웨어 라우트 보호가 작동한다

---

### Optional Goal: UX 개선

**목표:** 사용자 경험 향상을 위한 추가 기능

**작업 내역:**

1. 요청 상태 변경 시 알림 표시 (향후 구현 고려)
2. 요청 목록 자동 새로고침 (polling 또는 realtime subscription)
3. 대시보드에서 요청 취소 기능 (submitted 상태에서만)
4. 요청 목록 필터링 (상태별)

---

## 기술적 접근

### 데이터 접근 전략

`src/lib/storage.ts`의 기존 `getAllRequests()` 패턴을 참고하여 `getRequestsByUser()` 함수를 구현한다.

```typescript
// src/lib/storage.ts에 추가
export async function getRequestsByUser(email: string): Promise<RequestSummary[]> {
  const supabase = getSupabase();
  const { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, status, submitted_at, illustration_url')
    .eq('created_by', email)
    .order('submitted_at', { ascending: false });

  if (error || !rows) return [];

  return rows.map((row) => ({
    id: row.id,
    displayName: (row.card_front as { displayName?: string })?.displayName || '',
    status: row.status,
    submittedAt: row.submitted_at,
    hasIllustration: row.illustration_url !== null,
  }));
}
```

### 소유권 검증 전략

`GET /api/requests/[id]` 핸들러에 소유권 검증 로직을 추가한다.

```typescript
// src/app/api/requests/[id]/route.ts GET 핸들러 수정
const user = await requireAuth();
const cardRequest = await getRequest(id);

if (!cardRequest) {
  return NextResponse.json({ error: 'Request not found' }, { status: 404 });
}

// Ownership verification: admin can access all, user can only access own
if (!isAdmin(user.email!) && cardRequest.createdBy !== user.email) {
  return NextResponse.json(
    { error: AUTH_ERRORS.FORBIDDEN },
    { status: 403 }
  );
}
```

### 컴포넌트 재사용 전략

| 기존 컴포넌트 | 위치 | 재사용 방법 |
|--------------|------|-------------|
| `StatusBadge` | `src/components/admin/StatusBadge.tsx` | 대시보드 요청 목록/상세에서 직접 import |
| `StatusHistory` | `src/components/admin/StatusHistory.tsx` | 사용자 요청 상세에서 직접 import |
| `CardCompare` | `src/components/admin/CardCompare.tsx` | 사용자 요청 상세에서 직접 import (일러스트 존재 시) |

기존 `admin` 디렉토리의 컴포넌트를 `dashboard`에서 import하여 사용한다. 향후 공통 컴포넌트로 분리가 필요하면 `src/components/shared/`로 이동을 고려한다.

### 클라이언트 데이터 페칭 전략

대시보드 페이지에서 `fetch` API를 사용하여 데이터를 로드한다. 현재 프로젝트에서 tanstack-query 등 데이터 페칭 라이브러리를 사용하지 않으므로, `useEffect` + `useState` 패턴으로 구현한다.

```typescript
// 대시보드 페이지 데이터 페칭 패턴
const [requests, setRequests] = useState<RequestSummary[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests/my');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data.requests);
    } catch (err) {
      setError('요청 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  fetchRequests();
}, []);
```

---

## 아키텍처 설계 방향

### 디렉토리 구조 (변경 후)

```
src/
├── app/
│   ├── dashboard/                    # [신규] 사용자 대시보드
│   │   ├── page.tsx                  # 요청 목록 페이지
│   │   └── [id]/
│   │       └── page.tsx              # 요청 상세 페이지
│   └── api/
│       └── requests/
│           ├── my/
│           │   └── route.ts          # [신규] 사용자 본인 요청 목록 API
│           ├── route.ts              # [기존] POST (생성), GET (관리자 전체 목록)
│           └── [id]/
│               └── route.ts          # [수정] GET에 소유권 검증 추가
├── components/
│   ├── dashboard/                    # [신규] 대시보드 컴포넌트
│   │   ├── MyRequestList.tsx
│   │   ├── ProgressStepper.tsx
│   │   ├── RequestCard.tsx
│   │   ├── MyRequestDetail.tsx
│   │   └── EmptyState.tsx
│   └── auth/
│       └── UserMenu.tsx              # [수정] "내 요청" 메뉴 추가
├── middleware.ts                     # [수정] /dashboard 라우트 보호 추가
└── lib/
    └── storage.ts                    # [수정] getRequestsByUser() 추가
```

---

## 위험 요소 및 대응

| 위험 | 영향도 | 대응 방안 |
|------|--------|----------|
| `created_by`가 null인 레거시 요청 | Low | null 필터링 처리, 해당 요청은 사용자 대시보드에 표시하지 않음 |
| 대량 요청으로 인한 성능 저하 | Low | 현재는 사용자당 소수 요청 예상, 필요 시 페이지네이션 추가 |
| admin 컴포넌트 import 경로 혼란 | Low | 향후 `shared/` 디렉토리로 공통 컴포넌트 분리 고려 |
| API 소유권 검증 누락 | High | 코드 리뷰에서 반드시 검증, 테스트 케이스 필수 |

---

## 전문가 상담 권장

### Frontend Expert (expert-frontend)

대시보드 UI 구현 시 다음 사항에 대해 expert-frontend 상담을 권장합니다:
- 반응형 레이아웃 전략 (카드 vs 테이블 전환)
- ProgressStepper 애니메이션 구현
- 기존 디자인 시스템과의 일관성 유지

### Backend Expert (expert-backend)

API 설계 및 보안 검증 시 다음 사항에 대해 expert-backend 상담을 권장합니다:
- `/api/requests/[id]` 소유권 검증 로직의 보안성
- `getRequestsByUser()` 쿼리 최적화
- Supabase RLS 정책 도입 필요성 평가
