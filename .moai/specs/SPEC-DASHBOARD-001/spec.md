# SPEC-DASHBOARD-001: 사용자 대시보드 (User Dashboard)

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-DASHBOARD-001 |
| 제목 | User Dashboard - My Requests & Progress Tracking |
| 생성일 | 2026-02-21 |
| 상태 | Completed |
| 우선순위 | High |
| 관련 SPEC | SPEC-AUTH-001 (인증), SPEC-ADMIN-001 (관리자 대시보드), SPEC-FLOW-001 (명함 제작 플로우) |

---

## Environment (환경)

### 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS | 4.x |
| 인증 | Supabase Auth (@supabase/ssr) | @supabase/ssr@0.8.0, @supabase/supabase-js@2.97.0 |
| 데이터베이스 | Supabase PostgreSQL | - |
| 상태 관리 | Zustand | 5.0.11 |
| 배포 | Cloudflare Pages (@opennextjs/cloudflare) | - |

### 현재 시스템 상태

- 인증 시스템 구현 완료: Supabase Auth 기반 이메일/비밀번호 + Google OAuth 인증 (SPEC-AUTH-001)
- 관리자 대시보드 구현 완료: `/admin` 경로에서 전체 요청 관리 (SPEC-ADMIN-001)
- 명함 제작 위저드 구현 완료: 6단계 위저드를 통한 명함 제작 요청 (SPEC-FLOW-001)
- 사용자 자신의 요청 조회 기능 미구현: 현재 요청 목록은 관리자만 조회 가능
- 기존 재사용 가능 컴포넌트: `StatusBadge`, `StatusHistory`, `CardCompare`

### 외부 의존성

- Supabase Auth (인증 및 사용자 관리)
- Supabase PostgreSQL (`card_requests` 테이블, `card_request_status_history` 테이블)
- Supabase Storage (`avatars`, `illustrations` 버킷)
- 기존 인증 유틸리티: `getServerUser()`, `requireAuth()`, `useAuth()` 훅

### 데이터베이스 스키마 (기존)

**card_requests 테이블:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 요청 고유 식별자 |
| card_front | JSONB | 명함 앞면 데이터 |
| card_back | JSONB | 명함 뒷면 데이터 |
| original_avatar_url | TEXT | 원본 아바타 이미지 URL |
| illustration_url | TEXT | 관리자 업로드 일러스트 URL |
| status | TEXT | 요청 상태 ('submitted', 'processing', 'confirmed') |
| submitted_at | TIMESTAMPTZ | 요청 제출 시각 |
| updated_at | TIMESTAMPTZ | 마지막 업데이트 시각 |
| note | TEXT | 사용자 메모 |
| created_by | TEXT | 요청 생성자 이메일 |

**card_request_status_history 테이블:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL | 이력 고유 식별자 |
| request_id | UUID (FK) | card_requests 참조 |
| status | TEXT | 상태 값 |
| created_at | TIMESTAMPTZ | 상태 변경 시각 |

---

## Assumptions (가정)

### 기술적 가정

- **A1**: `card_requests.created_by` 필드에 사용자 이메일이 정상적으로 저장되어 있다
- **A2**: Supabase RLS(Row Level Security) 없이 서버 사이드에서 `created_by` 필터링으로 접근 제어가 충분하다
- **A3**: 기존 `StatusBadge`, `StatusHistory` 컴포넌트를 사용자 대시보드에서 재사용할 수 있다
- **A4**: `/dashboard` 경로를 middleware.ts의 보호된 라우트에 추가하면 인증 검사가 적용된다
- **A5**: 사용자당 요청 수가 소규모이므로 페이지네이션 없이 전체 목록을 반환해도 성능 문제가 없다

### 비즈니스 가정

- **A6**: 일반 사용자는 자신의 요청만 조회할 수 있으며, 다른 사용자의 요청은 볼 수 없다
- **A7**: 사용자는 요청 상세에서 상태를 변경할 수 없다 (읽기 전용)
- **A8**: 사용자가 로그인 후 기존 요청이 있으면 대시보드로 안내하되, 강제 리다이렉트는 아닌 선택적 안내다
- **A9**: 관리자도 `/dashboard`에 접근할 수 있으나, 관리자 전용 기능은 `/admin`에서 제공한다

### 위험 요소

| 가정 | 신뢰도 | 오류 시 영향 | 검증 방법 |
|------|--------|-------------|----------|
| A1 | High | 일부 초기 요청에 created_by가 없을 수 있음 | DB 쿼리로 null 값 확인 |
| A2 | Medium | 보안 강화 필요 시 Supabase RLS 정책 추가 필요 | 보안 검토 시 평가 |
| A5 | High | 대량 요청 시 페이지네이션 추가 필요 | 운영 후 요청 수 모니터링 |

---

## Requirements (요구사항)

### REQ-DASH-001: 사용자 대시보드 페이지

**[Event-Driven]** **WHEN** 인증된 사용자가 `/dashboard` 경로에 접근하면 **THEN** 시스템은 해당 사용자가 제출한 명함 제작 요청 목록을 표시해야 한다.

- REQ-DASH-001.1: 대시보드 페이지는 `/dashboard` 경로에 위치한다
- REQ-DASH-001.2: 인증되지 않은 사용자가 접근하면 `/login?callbackUrl=/dashboard`로 리다이렉트한다
- REQ-DASH-001.3: 요청 목록은 `submitted_at` 기준 최신순으로 정렬한다
- REQ-DASH-001.4: 각 요청 항목은 Display Name, 상태 배지(StatusBadge), 제출일시를 표시한다
- REQ-DASH-001.5: 요청이 없는 경우 "아직 제작 요청이 없습니다" 안내 메시지와 함께 명함 제작하기 버튼(`/create` 링크)을 표시한다
- REQ-DASH-001.6: 페이지 상단에 "새 명함 만들기" 버튼을 배치하여 `/create`로 이동할 수 있게 한다

### REQ-DASH-002: 사용자 요청 조회 API

**[Event-Driven]** **WHEN** 인증된 사용자가 `GET /api/requests/my` 엔드포인트를 호출하면 **THEN** 시스템은 해당 사용자의 이메일(`created_by`)로 필터링된 요청 목록만 반환해야 한다.

- REQ-DASH-002.1: `GET /api/requests/my` 엔드포인트를 생성한다
- REQ-DASH-002.2: `requireAuth()`를 통해 인증을 검증하고, 인증 실패 시 401을 반환한다
- REQ-DASH-002.3: `card_requests` 테이블에서 `created_by = user.email` 조건으로 필터링한다
- REQ-DASH-002.4: 응답 형식은 `{ requests: RequestSummary[], total: number }` 이다
- REQ-DASH-002.5: `submitted_at` 기준 내림차순으로 정렬한다

### REQ-DASH-003: 진행 상태 시각화

**[State-Driven]** **IF** 사용자의 요청이 존재하면 **THEN** 시스템은 각 요청의 진행 상태를 단계별 프로그레스 인디케이터로 시각화해야 한다.

- REQ-DASH-003.1: 3단계 프로그레스 표시: submitted (의뢰됨) -> processing (작업중) -> confirmed (확정)
- REQ-DASH-003.2: 현재 상태 단계는 강조 색상으로 표시하고, 완료된 단계에는 체크 아이콘을 적용한다
- REQ-DASH-003.3: 아직 도달하지 않은 단계는 회색으로 비활성화 표시한다
- REQ-DASH-003.4: 기존 `StatusBadge` 컴포넌트와 색상 체계를 일관되게 유지한다 (blue=submitted, amber=processing, green=confirmed)

### REQ-DASH-004: 요청 상세 보기

**[Event-Driven]** **WHEN** 사용자가 대시보드에서 특정 요청을 클릭하면 **THEN** 시스템은 해당 요청의 상세 정보를 표시해야 한다.

- REQ-DASH-004.1: 사용자 요청 상세 페이지는 `/dashboard/[id]` 경로에 위치한다
- REQ-DASH-004.2: 기존 `GET /api/requests/[id]` 엔드포인트를 사용하되, 요청의 `created_by`가 현재 사용자의 이메일과 일치하는지 서버 사이드에서 검증한다
- REQ-DASH-004.3: 상태 이력 타임라인을 `StatusHistory` 컴포넌트로 표시한다
- REQ-DASH-004.4: 원본 아바타 이미지와 일러스트 이미지(있는 경우)를 `CardCompare` 컴포넌트로 비교 표시한다
- REQ-DASH-004.5: 명함 앞면/뒷면 정보(Display Name, Full Name, Title, Hashtags, Social Links)를 읽기 전용으로 표시한다
- REQ-DASH-004.6: 사용자 메모(note)가 있는 경우 표시한다
- REQ-DASH-004.7: 다른 사용자의 요청에 접근하려 하면 403 Forbidden을 반환하고 대시보드로 리다이렉트한다

### REQ-DASH-005: 로그인 후 네비게이션 플로우

**[Event-Driven]** **WHEN** 사용자가 로그인에 성공하면 **THEN** 시스템은 기존 요청 유무에 따라 적절한 페이지로 안내해야 한다.

- REQ-DASH-005.1: 로그인 페이지에 `callbackUrl`이 지정된 경우 해당 URL로 리다이렉트한다 (기존 동작 유지)
- REQ-DASH-005.2: `callbackUrl`이 없는 경우 기본 리다이렉트는 `/create`로 유지한다 (기존 동작 유지)
- REQ-DASH-005.3: 네비게이션 헤더에 "내 요청" 링크를 추가하여 `/dashboard`로 이동할 수 있게 한다
- REQ-DASH-005.4: `UserMenu` 컴포넌트에 "내 요청" 메뉴 항목을 추가한다

### REQ-DASH-006: 라우트 보호 및 접근 제어

**[State-Driven]** **IF** 사용자가 인증되지 않은 상태라면 **THEN** `/dashboard` 및 `/dashboard/[id]` 접근 시 로그인 페이지로 리다이렉트해야 한다.

- REQ-DASH-006.1: `middleware.ts`의 `protectedRoutes` 배열에 `/dashboard`를 추가한다
- REQ-DASH-006.2: 인증되지 않은 사용자가 접근하면 `/login?callbackUrl=/dashboard`로 리다이렉트한다
- REQ-DASH-006.3: 관리자와 일반 사용자 모두 `/dashboard`에 접근할 수 있다

### REQ-DASH-007: 반응형 디자인 및 접근성

**[Ubiquitous]** 시스템은 **항상** 사용자 대시보드를 모든 디바이스에서 최적화된 레이아웃으로 제공해야 한다.

- REQ-DASH-007.1: 모바일(< 768px): 카드형 리스트 레이아웃으로 요청 항목을 표시한다
- REQ-DASH-007.2: 데스크톱(>= 768px): 테이블형 리스트 레이아웃으로 요청 항목을 표시한다
- REQ-DASH-007.3: ARIA 속성을 적용한다 (`role`, `aria-label`, `aria-current`)
- REQ-DASH-007.4: 키보드 네비게이션을 지원한다 (Tab, Enter로 요청 상세 진입)
- REQ-DASH-007.5: 최소 터치 영역 44px를 보장한다

### REQ-DASH-008: 보안 요구사항

**[Unwanted]** 시스템은 다음 보안 위반이 발생**하지 않아야 한다**.

- REQ-DASH-008.1: 사용자는 자신의 요청만 조회할 수 있으며, `created_by` 필드가 일치하지 않는 요청에 접근할 수 없다
- REQ-DASH-008.2: `/api/requests/my` 엔드포인트는 서버 사이드에서 `requireAuth()`로 인증을 검증한다
- REQ-DASH-008.3: `/api/requests/[id]` GET 요청에서 사용자 소유권 검증을 추가한다 (관리자가 아닌 경우)
- REQ-DASH-008.4: 클라이언트에 다른 사용자의 이메일이나 개인 정보가 노출되지 않아야 한다

---

## Specifications (기술 명세)

### 아키텍처 개요

```
[Browser]
   |
   +--> middleware.ts (세션 갱신 + /dashboard 라우트 보호 추가)
   |
   +--> /dashboard (사용자 대시보드 페이지)
   |        |
   |        +--> GET /api/requests/my (사용자 본인 요청 목록)
   |        +--> RequestList (요청 목록 - 모바일: 카드 / 데스크톱: 테이블)
   |        +--> ProgressStepper (3단계 진행 상태 시각화)
   |        +--> EmptyState (요청 없을 때 안내)
   |
   +--> /dashboard/[id] (사용자 요청 상세 페이지)
   |        |
   |        +--> GET /api/requests/[id] (상세 조회 + 소유권 검증)
   |        +--> StatusHistory (상태 이력 타임라인 - 재사용)
   |        +--> CardCompare (아바타 vs 일러스트 비교 - 재사용)
   |        +--> CardInfoView (명함 정보 읽기 전용)
   |
   +--> UserMenu (기존 컴포넌트 - "내 요청" 메뉴 추가)
```

### 신규 파일 목록

| 파일 경로 | 설명 |
|-----------|------|
| `src/app/dashboard/page.tsx` | 사용자 대시보드 페이지 (요청 목록) |
| `src/app/dashboard/[id]/page.tsx` | 사용자 요청 상세 페이지 |
| `src/app/api/requests/my/route.ts` | 사용자 본인 요청 목록 API |
| `src/components/dashboard/MyRequestList.tsx` | 사용자 요청 목록 컴포넌트 (반응형) |
| `src/components/dashboard/ProgressStepper.tsx` | 3단계 진행 상태 인디케이터 |
| `src/components/dashboard/RequestCard.tsx` | 개별 요청 카드 컴포넌트 (모바일) |
| `src/components/dashboard/MyRequestDetail.tsx` | 사용자 요청 상세 뷰 (읽기 전용) |
| `src/components/dashboard/EmptyState.tsx` | 요청 없음 안내 컴포넌트 |
| `src/lib/user-storage.ts` | 사용자별 요청 조회 함수 (getMyRequests) |

### 수정 파일 목록

| 파일 경로 | 수정 내용 |
|-----------|----------|
| `src/middleware.ts` | `protectedRoutes`에 `/dashboard` 추가 |
| `src/components/auth/UserMenu.tsx` | "내 요청" 메뉴 항목 추가 |
| `src/app/api/requests/[id]/route.ts` | GET 핸들러에 사용자 소유권 검증 로직 추가 |
| `src/lib/storage.ts` | `getRequestsByUser(email)` 함수 추가 |

### API 명세

#### GET /api/requests/my

사용자 본인의 명함 제작 요청 목록을 반환한다.

**인증:** `requireAuth()` (인증 필수)

**요청:**
```
GET /api/requests/my
Authorization: Supabase session cookie
```

**성공 응답 (200):**
```json
{
  "requests": [
    {
      "id": "uuid-string",
      "displayName": "홍길동",
      "status": "processing",
      "submittedAt": "2026-02-20T10:30:00.000Z",
      "hasIllustration": false
    }
  ],
  "total": 1
}
```

**오류 응답:**
| 상태 코드 | 메시지 | 조건 |
|-----------|--------|------|
| 401 | 인증이 필요합니다 | 미인증 사용자 |
| 500 | Internal server error | 서버 오류 |

#### GET /api/requests/[id] (수정)

기존 동작에 사용자 소유권 검증을 추가한다.

**변경 사항:**
- 관리자가 아닌 일반 사용자의 경우, `cardRequest.createdBy`와 `user.email`이 일치하는지 검증
- 불일치 시 403 Forbidden 반환

**추가 오류 응답:**
| 상태 코드 | 메시지 | 조건 |
|-----------|--------|------|
| 403 | 접근 권한이 없습니다 | 다른 사용자의 요청 조회 시도 |

### 컴포넌트 명세

#### ProgressStepper

3단계 진행 상태를 수평으로 시각화하는 컴포넌트.

```typescript
interface ProgressStepperProps {
  currentStatus: RequestStatus; // 'submitted' | 'processing' | 'confirmed'
}
```

**시각적 표현:**
```
[1. 의뢰됨] ----> [2. 작업중] ----> [3. 확정]
   (blue)          (amber)          (green)
```

- 완료 단계: 체크 아이콘 + 해당 색상 배경
- 현재 단계: 강조 색상 + 펄스 애니메이션
- 미도달 단계: 회색 배경

#### MyRequestList

반응형 요청 목록 컴포넌트.

```typescript
interface MyRequestListProps {
  requests: RequestSummary[];
}
```

- 모바일: `RequestCard` 컴포넌트를 사용한 카드 리스트
- 데스크톱: 테이블 레이아웃 (ID, Display Name, 상태, 제출일, 진행도)

#### EmptyState

요청이 없는 경우의 안내 컴포넌트.

```typescript
// Props 없음 - 고정 메시지 및 CTA 표시
```

- 일러스트 또는 아이콘 (명함 관련 이미지)
- "아직 제작 요청이 없습니다" 텍스트
- "명함 만들기" 버튼 -> `/create`

### 데이터 흐름

```
[사용자 대시보드 흐름]
User Login -> /dashboard -> GET /api/requests/my -> Supabase DB (created_by 필터)
                                                 -> 요청 목록 렌더링

[요청 상세 흐름]
User -> /dashboard/[id] -> GET /api/requests/[id] -> 소유권 검증
                                                   -> 상세 정보 렌더링
                                                   -> StatusHistory + CardCompare 재사용
```

---

## Traceability (추적성)

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|------------|----------|---------------|
| REQ-DASH-001 | `src/app/dashboard/page.tsx`, `src/components/dashboard/MyRequestList.tsx` | 대시보드 페이지 로딩 및 요청 목록 표시 검증 |
| REQ-DASH-002 | `src/app/api/requests/my/route.ts`, `src/lib/user-storage.ts` | API 엔드포인트 인증 및 필터링 검증 |
| REQ-DASH-003 | `src/components/dashboard/ProgressStepper.tsx` | 각 상태별 프로그레스 시각화 검증 |
| REQ-DASH-004 | `src/app/dashboard/[id]/page.tsx`, `src/components/dashboard/MyRequestDetail.tsx` | 요청 상세 표시 및 소유권 검증 |
| REQ-DASH-005 | `src/components/auth/UserMenu.tsx` | 네비게이션 메뉴 항목 및 리다이렉트 검증 |
| REQ-DASH-006 | `src/middleware.ts` | 라우트 보호 및 리다이렉트 검증 |
| REQ-DASH-007 | 모든 대시보드 컴포넌트 | 반응형 레이아웃 및 접근성 검증 |
| REQ-DASH-008 | `src/app/api/requests/[id]/route.ts`, `src/app/api/requests/my/route.ts` | 보안 요구사항 (소유권, 인증) 검증 |
