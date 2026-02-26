---
id: SPEC-VISIBILITY-001
document: plan
version: "1.0.0"
created: "2026-02-26"
updated: "2026-02-26"
---

# SPEC-VISIBILITY-001 구현 계획: 명함 공개/비공개 설정

## 개요

명함 카드 요청에 대한 공개/비공개 설정 기능을 구현한다. 사용자가 확정 또는 전달 완료된 카드를 공개로 설정하면 영구 링크(`/cards/[id]`)를 통해 누구나 카드를 조회할 수 있다.

---

## 마일스톤

### Primary Goal: 데이터베이스 및 타입 시스템 변경

데이터 모델의 기반을 구축하여 공개/비공개 상태를 저장하고 처리할 수 있도록 한다.

**Task 1: 데이터베이스 마이그레이션**
- `card_requests` 테이블에 `is_public BOOLEAN NOT NULL DEFAULT FALSE` 컬럼 추가
- 공개 카드 조회 성능을 위한 인덱스 생성 (`idx_card_requests_is_public`, `idx_card_requests_public_status`)
- 기존 레코드 전체 `is_public = false` 확인 (DEFAULT 제약조건으로 보장)
- 파일: Supabase Dashboard SQL Editor 또는 마이그레이션 스크립트

**Task 2: TypeScript 타입 확장**
- `CardRequest` 인터페이스에 `isPublic: boolean` 필드 추가 (`src/types/request.ts`)
- `PublicCardData` 인터페이스 신규 생성 (`src/types/card.ts`)
- `RequestSummary` 인터페이스에 `isPublic: boolean` 필드 추가
- 파일: `src/types/request.ts`, `src/types/card.ts`

**Task 3: 데이터 액세스 레이어 수정**
- `saveRequest()`: `is_public: false` 명시적 설정 추가
- `getRequest()`: `is_public` 필드 매핑 (`row.is_public` -> `isPublic`)
- `getAllRequests()`: select 절에 `is_public` 추가, 매핑 추가
- `getRequestsByUser()`: select 절에 `is_public` 추가, 매핑 추가
- `updateRequest()`: `isPublic` 필드 업데이트 지원 추가
- 신규 함수 `getPublicCard(id)`: 공개 카드 단건 조회 (created_by 제외)
- 신규 함수 `getPublicCards()`: 공개 카드 목록 조회 (Optional, 갤러리용)
- 파일: `src/lib/storage.ts`

---

### Secondary Goal: API 엔드포인트 및 미들웨어

서버 사이드 비즈니스 로직을 구현하여 공개/비공개 토글과 공개 카드 조회를 지원한다.

**Task 4: 사용자 공개/비공개 토글 API**
- 경로: `src/app/api/requests/my/[id]/visibility/route.ts`
- Method: PATCH
- 인증: Supabase Auth (`requireAuth()`)
- 검증: 카드 소유권 확인 (`created_by === user.email`)
- 검증: 카드 상태 확인 (`status === 'confirmed' || status === 'delivered'`)
- 응답: `{ isPublic: boolean, shareUrl: string | null }`
- 에러: 401 (미인증), 403 (소유자 아님), 404 (카드 없음), 422 (상태 부적합)

**Task 5: 관리자 공개/비공개 변경 API**
- 경로: `src/app/api/admin/requests/[id]/visibility/route.ts`
- Method: PATCH
- 인증: Admin Token (`requireAdminToken()`)
- 검증: 카드 존재 확인
- 관리자는 상태와 무관하게 변경 가능
- 응답: `{ isPublic: boolean }`
- 에러: 401 (미인증), 404 (카드 없음)

**Task 6: 공개 카드 조회 API**
- 경로: `src/app/api/cards/[id]/route.ts`
- Method: GET
- 인증: 불필요 (public)
- 검증: `is_public = true` AND `status IN ('confirmed', 'delivered')`
- 응답: `PublicCardData` (created_by 필드 제외)
- 에러: 404 (카드 없음 또는 비공개)

**Task 7: 미들웨어 업데이트**
- `publicPrefixes`에 `/cards`, `/api/cards` 추가
- 기존 보호 경로(`/dashboard`, `/admin`)에 영향 없음 확인
- 파일: `src/middleware.ts`

---

### Tertiary Goal: 프론트엔드 컴포넌트

사용자/관리자 인터페이스에 공개/비공개 토글 UI와 공개 카드 뷰를 구현한다.

**Task 8: VisibilityToggle 컴포넌트**
- 경로: `src/components/visibility/VisibilityToggle.tsx`
- Props: `isPublic: boolean`, `disabled: boolean`, `disabledReason?: string`, `onToggle: (isPublic: boolean) => void`
- Toggle switch UI (Tailwind CSS)
- 비활성 시 회색 처리 + 툴팁 표시
- 접근성: `role="switch"`, `aria-checked`, `aria-label`

**Task 9: ShareUrlDisplay 컴포넌트**
- 경로: `src/components/visibility/ShareUrlDisplay.tsx`
- Props: `url: string`, `isVisible: boolean`
- URL 텍스트 표시 + 클립보드 복사 버튼
- 복사 성공 시 체크 아이콘으로 피드백 (2초 후 복원)
- `navigator.clipboard.writeText()` 사용

**Task 10: 대시보드 요청 상세 페이지 통합**
- 파일: `src/app/dashboard/[id]` 관련 컴포넌트 (MyRequestDetail.tsx)
- `VisibilityToggle` + `ShareUrlDisplay` 배치
- 카드 상태에 따른 토글 활성화/비활성화 로직
- API 호출 (`PATCH /api/requests/my/[id]/visibility`)
- optimistic update 또는 서버 응답 후 상태 갱신

**Task 11: 관리자 요청 상세 페이지 통합**
- 파일: `src/app/admin/[id]` 관련 컴포넌트 (RequestDetail.tsx)
- `VisibilityToggle` 배치 (관리자용: 항상 활성)
- API 호출 (`PATCH /api/admin/requests/[id]/visibility`)

**Task 12: 공개 카드 뷰 페이지**
- 경로: `src/app/cards/[id]/page.tsx` (Server Component)
- API 또는 직접 DB 호출로 공개 카드 데이터 조회
- 테마별 카드 컴포넌트 렌더링 (Classic, Pokemon, Hearthstone, Harrypotter, Tarot)
- 카드 플립 애니메이션 (클릭/탭으로 앞면-뒷면 전환)
- `generateMetadata()`: Open Graph 및 Twitter Card 메타데이터
- 비공개 또는 미확정 카드 접근 시 `notFound()` 호출

---

### Optional Goal: 공개 카드 갤러리

공개된 모든 카드를 탐색할 수 있는 갤러리 페이지를 구현한다.

**Task 13: 공개 카드 갤러리 API**
- 경로: `src/app/api/cards/route.ts`
- Method: GET
- Query: `?page=1&limit=12&theme=classic` (선택적 필터)
- 인증: 불필요 (public)
- 페이지네이션: offset-based
- 응답: `{ cards: PublicCardData[], total: number, page: number, limit: number }`

**Task 14: 공개 카드 갤러리 페이지**
- 경로: `src/app/cards/page.tsx`
- 카드 그리드 레이아웃 (반응형: 1/2/3/4열)
- 카드 앞면 썸네일 표시
- 클릭 시 `/cards/[id]` 이동
- 테마별 필터 (선택적)
- 페이지네이션 또는 무한 스크롤

---

## 기술적 접근 방식

### 아키텍처 설계 방향

```
[사용자/방문자]
    |
    v
[Middleware] -- /cards, /api/cards --> Public (인증 불필요)
    |
    v
[API Routes]
    |-- PATCH /api/requests/my/[id]/visibility (User auth)
    |-- PATCH /api/admin/requests/[id]/visibility (Admin auth)
    |-- GET /api/cards/[id] (Public)
    |-- GET /api/cards (Public, Optional)
    |
    v
[Storage Layer (storage.ts)]
    |-- updateRequest() (is_public update)
    |-- getPublicCard() (new)
    |-- getPublicCards() (new, Optional)
    |
    v
[Supabase PostgreSQL]
    |-- card_requests.is_public
    |-- Partial indexes for performance
```

### 보안 설계

1. **비공개 카드 보호**: 공개 API에서 `is_public = true` 조건 필수 적용
2. **정보 은닉**: 비공개 카드 접근 시 404 반환 (403 아님, 존재 여부 비노출)
3. **개인정보 보호**: 공개 카드 응답에서 `created_by`(이메일) 필드 완전 제외
4. **소유권 검증**: 사용자 토글 API에서 `created_by === user.email` 확인
5. **상태 검증**: 서버 사이드에서 카드 상태 검증 (프론트엔드 검증만으로 불충분)

### SEO 최적화

- Server Component로 공개 카드 페이지 구현 (SSR)
- `generateMetadata()`로 동적 메타데이터 생성
- Open Graph: `og:title`, `og:description`, `og:image` (카드 앞면 이미지)
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:image`

### 성능 고려사항

- Partial index (`WHERE is_public = TRUE`)로 공개 카드 쿼리 최적화
- 공개 카드 페이지에 ISR(Incremental Static Regeneration) 적용 가능
- 갤러리 페이지 페이지네이션으로 대량 데이터 처리

---

## 기술 의존성

| 의존성 | 용도 | 비고 |
|--------|------|------|
| Supabase PostgreSQL | is_public 컬럼 저장 | 기존 인프라 활용 |
| Next.js App Router | Server Component, generateMetadata | 기존 프레임워크 |
| Tailwind CSS 4 | Toggle switch, UI 스타일링 | 기존 스타일링 도구 |
| 기존 카드 컴포넌트 | PublicCardView에서 재사용 | CardFront, CardBack 등 |

- 신규 외부 라이브러리 의존성 없음
- 기존 프로젝트 의존성만으로 구현 가능

---

## 리스크 분석

### High Risk

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 비공개 카드 데이터 유출 | 사용자 개인정보 침해 | 서버 사이드 is_public 검증 필수, 404 반환, created_by 제외 |
| DB 마이그레이션 실패 | 서비스 중단 | DEFAULT FALSE로 무중단 마이그레이션, 롤백 SQL 준비 |

### Medium Risk

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 미들웨어 변경으로 기존 보호 경로 영향 | 인증 우회 가능성 | publicPrefixes에 /cards만 추가, 기존 경로 테스트 필수 |
| 공개 카드 페이지 성능 저하 | 사용자 경험 악화 | Partial index, ISR 캐싱 적용 |
| 카드 컴포넌트 재사용 시 의존성 문제 | 빌드 오류 | 기존 컴포넌트 props 호환성 검증 |

### Low Risk

| 리스크 | 영향 | 대응 |
|--------|------|------|
| SEO 메타데이터 누락 | 소셜 공유 시 미리보기 미표시 | generateMetadata 테스트 |
| 클립보드 API 미지원 브라우저 | 공유 URL 복사 불가 | 수동 복사 안내 fallback |

---

## SPEC-SHARE-001과의 관계

| 구분 | SPEC-VISIBILITY-001 (본 SPEC) | SPEC-SHARE-001 |
|------|-------------------------------|----------------|
| 범위 | 서버 사이드 공개 URL, 갤러리 | 클라이언트 사이드 내보내기/공유 |
| 인증 | 공개 경로 (인증 불필요) | 인증된 사용자 전용 |
| 데이터 | DB is_public 필드 | 클라이언트 메모리/Zustand |
| 출력 | 영구 웹 페이지 링크 | PNG 다운로드, 클립보드, Web Share |
| 의존성 | 없음 (독립적) | 없음 (독립적) |
| 통합 | 공개 카드 페이지에 SHARE 기능 포함 가능 | 공유 URL을 QR 코드로 생성 가능 |
