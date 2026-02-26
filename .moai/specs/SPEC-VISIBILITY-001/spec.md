---
id: SPEC-VISIBILITY-001
version: "1.0.0"
status: planned
created: "2026-02-26"
updated: "2026-02-26"
author: MoAI
priority: high
---

## HISTORY

| Version | Date       | Author | Description           |
|---------|------------|--------|-----------------------|
| 1.0.0   | 2026-02-26 | MoAI   | Initial SPEC creation |

---

# SPEC-VISIBILITY-001: 명함 공개/비공개 설정

## 요약

현재 모든 명함 카드 요청은 비공개 상태로 존재하며, 생성자와 관리자만 조회할 수 있다. 본 SPEC은 사용자가 확정(confirmed) 또는 전달(delivered) 상태인 카드에 대해 공개/비공개를 토글할 수 있는 기능을 추가한다. 공개된 카드는 인증 없이 `/cards/[id]` 경로를 통해 읽기 전용으로 접근 가능하며, 비공개 카드는 공개 URL 접근 시 404를 반환한다. SPEC-SHARE-001(클라이언트 사이드 내보내기/공유)과 상호보완적인 관계로, 본 SPEC은 서버 사이드 영구 링크 공유를 담당한다.

---

## Environment (환경)

- **프레임워크**: Next.js 16.1.6 (App Router), React 19, TypeScript 5
- **데이터베이스**: Supabase PostgreSQL
- **스타일링**: Tailwind CSS 4
- **상태 관리**: Zustand 5
- **인증**: Supabase Auth (사용자), Cookie 기반 인증 (관리자)
- **배포**: Cloudflare Workers (@opennextjs/cloudflare)
- **기존 테이블**: `card_requests` (is_public 컬럼 미존재)
- **기존 미들웨어**: `/admin`, `/create`, `/dashboard` 경로 보호 중
- **관련 SPEC**: SPEC-SHARE-001 (클라이언트 사이드 내보내기/공유, DRAFT)

## Assumptions (가정)

- `card_requests` 테이블에 `is_public BOOLEAN DEFAULT FALSE` 컬럼을 추가할 수 있다.
- 공개/비공개 토글은 카드 상태가 `confirmed` 또는 `delivered`인 경우에만 허용된다.
- 공개 카드 조회(`/cards/[id]`)는 인증이 필요하지 않으며, 미들웨어에서 해당 경로를 공개 경로로 등록해야 한다.
- 기존 `card_requests` 테이블의 모든 레코드는 마이그레이션 후 `is_public = false`로 초기화된다.
- 공개 카드 페이지에서는 카드 앞면/뒷면의 읽기 전용 뷰만 제공하며, 편집 기능은 포함하지 않는다.
- 공개 카드 URL 형식은 `{BASE_URL}/cards/{request_id}`이다.
- 관리자는 모든 카드의 공개/비공개 상태를 변경할 수 있다.

---

## Requirements (요구사항)

### Ubiquitous (항상 활성)

#### REQ-U-001: 카드별 공개/비공개 상태 관리

시스템은 **항상** 각 카드 요청(card_request)에 대해 공개/비공개 상태(`is_public`)를 저장하고 관리해야 한다.

- `card_requests` 테이블에 `is_public BOOLEAN NOT NULL DEFAULT FALSE` 컬럼 존재
- 모든 카드 조회 시 `is_public` 필드가 포함되어 반환됨
- `CardRequest` TypeScript 인터페이스에 `isPublic: boolean` 필드 포함

#### REQ-U-002: 신규 카드 요청 기본 비공개

시스템은 **항상** 새로 생성되는 카드 요청의 공개 상태를 비공개(`is_public = false`)로 설정해야 한다.

- `saveRequest()` 함수에서 `is_public: false`를 명시적으로 설정
- 데이터베이스 DEFAULT 제약조건과 애플리케이션 로직 양쪽에서 보장

---

### Event-Driven (이벤트 기반)

#### REQ-E-001: 사용자 공개/비공개 토글

**WHEN** 사용자가 대시보드 요청 상세 페이지(`/dashboard/[id]`)에서 공개/비공개 토글 스위치를 클릭 **THEN** 시스템은 해당 카드의 `is_public` 상태를 반전시키고, UI에 변경된 상태를 즉시 반영하며, 공개로 전환된 경우 공유 URL을 표시해야 한다.

- API: `PATCH /api/requests/my/[id]/visibility` with body `{ isPublic: boolean }`
- 성공 응답: `200 OK` with `{ isPublic: boolean, shareUrl: string | null }`
- 권한: 해당 카드의 소유자(created_by)만 토글 가능

#### REQ-E-002: 공개 카드 URL 접근

**WHEN** 방문자(인증 여부 무관)가 `/cards/[id]` 경로에 접근 **THEN** 시스템은 해당 카드가 공개 상태이고 `confirmed` 또는 `delivered` 상태인 경우 카드 앞면/뒷면을 읽기 전용으로 렌더링해야 한다.

- 페이지: `src/app/cards/[id]/page.tsx` (Server Component)
- 카드 테마에 따라 적절한 카드 컴포넌트(Classic, Pokemon, Hearthstone, Harrypotter, Tarot) 렌더링
- 카드 플립 애니메이션 지원
- 메타데이터(Open Graph, Twitter Card) 포함하여 소셜 미디어 공유 최적화

#### REQ-E-003: 관리자 공개/비공개 변경

**WHEN** 관리자가 관리자 요청 상세 페이지(`/admin/[id]`)에서 공개/비공개 토글을 클릭 **THEN** 시스템은 해당 카드의 `is_public` 상태를 변경하고 변경 결과를 관리자 UI에 반영해야 한다.

- API: `PATCH /api/admin/requests/[id]/visibility` with body `{ isPublic: boolean }`
- 성공 응답: `200 OK` with `{ isPublic: boolean }`
- 권한: 관리자 토큰(admin-token cookie) 인증 필요
- 관리자는 카드 상태와 무관하게 공개/비공개 변경 가능

#### REQ-E-004: 공개 전환 시 공유 URL 생성

**WHEN** 사용자가 카드를 공개로 설정 **THEN** 시스템은 `{BASE_URL}/cards/{request_id}` 형식의 공유 URL을 생성하여 표시하고, 클립보드 복사 버튼을 함께 제공해야 한다.

- URL 형식: `{window.location.origin}/cards/{id}`
- 클립보드 복사 시 성공 피드백(toast 또는 아이콘 변경) 제공
- 비공개로 전환 시 공유 URL 표시 영역 숨김

---

### State-Driven (상태 기반)

#### REQ-S-001: 비공개 카드 공개 URL 접근 차단

**IF** 카드가 비공개(`is_public = false`) 상태인 경우 **THEN** `/cards/[id]` 공개 URL 접근 시 404 Not Found 페이지를 반환해야 한다.

- `notFound()` 함수를 호출하여 Next.js 404 페이지 렌더링
- 비공개 카드의 존재 여부를 외부에 노출하지 않음 (403이 아닌 404 반환)

#### REQ-S-002: 비확정 카드 토글 비활성화

**IF** 카드 상태가 `confirmed` 또는 `delivered`가 아닌 경우 **THEN** 공개/비공개 토글 스위치를 비활성화(disabled)하고, "확정 또는 전달 완료된 카드만 공개할 수 있습니다"라는 안내 메시지를 툴팁으로 표시해야 한다.

- 비활성 상태에서는 API 호출 자체를 차단 (프론트엔드)
- API 레벨에서도 상태 검증 수행 (서버 사이드 방어)
- 비활성 토글은 시각적으로 구분 가능하도록 회색 처리

---

### Unwanted (금지 행위)

#### REQ-N-001: 비공개 카드 데이터 노출 금지

시스템은 비공개 카드의 데이터를 인증되지 않은 사용자에게 노출**하지 않아야 한다**.

- 공개 API(`/api/cards/[id]`)에서 `is_public = false`인 카드 데이터 반환 금지
- 공개 카드 갤러리 페이지에서 비공개 카드 목록 포함 금지
- API 응답에서 비공개 카드의 존재 여부 유추 가능한 정보 반환 금지 (404 반환, 403 아님)
- 공개 카드 조회 API에서 `created_by`(사용자 이메일) 필드 제외

---

### Optional (선택 사항)

#### REQ-O-001: 공개 카드 갤러리 페이지

**가능하면** `/cards` 경로에 모든 공개 카드를 그리드 형태로 표시하는 갤러리 페이지를 제공한다.

- 페이지네이션 또는 무한 스크롤 지원
- 카드 앞면 썸네일로 표시
- 카드 클릭 시 `/cards/[id]` 상세 페이지로 이동
- 테마별 필터링 기능 (선택적)

---

## Specifications (기술 명세)

### 1. 데이터베이스 변경

#### card_requests 테이블 마이그레이션

```sql
ALTER TABLE card_requests
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- Performance index for public card queries
CREATE INDEX idx_card_requests_is_public
ON card_requests (is_public)
WHERE is_public = TRUE;

-- Composite index for public gallery queries
CREATE INDEX idx_card_requests_public_status
ON card_requests (is_public, status)
WHERE is_public = TRUE AND status IN ('confirmed', 'delivered');
```

### 2. TypeScript 타입 변경

#### CardRequest 인터페이스 확장

```typescript
// src/types/request.ts
export interface CardRequest {
  // ... existing fields ...
  isPublic: boolean; // New field: public/private visibility
}
```

#### 공개 카드 전용 타입

```typescript
// src/types/card.ts (추가)
export interface PublicCardData {
  id: string;
  card: CardData;
  originalAvatarUrl: string | null;
  illustrationUrl: string | null;
  theme: CardTheme;
  // Note: created_by is intentionally excluded for privacy
}
```

### 3. API 엔드포인트

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/api/requests/my/[id]/visibility` | Supabase Auth (owner) | User toggles visibility |
| PATCH | `/api/admin/requests/[id]/visibility` | Admin Token | Admin changes visibility |
| GET | `/api/cards/[id]` | None (public) | Get public card data |
| GET | `/api/cards` | None (public) | List public cards (Optional) |

### 4. 미들웨어 변경

```typescript
// src/middleware.ts
const publicRoutes = ['/', '/login', '/signup', '/callback', '/confirm'];
const publicPrefixes = ['/_next/', '/favicon.ico', '/api/auth/', '/cards', '/api/cards'];
// Add '/cards' and '/api/cards' to public prefixes
```

### 5. 컴포넌트 아키텍처

| Component | Path | Description |
|-----------|------|-------------|
| `VisibilityToggle` | `src/components/visibility/VisibilityToggle.tsx` | Toggle switch with disabled state and tooltip |
| `ShareUrlDisplay` | `src/components/visibility/ShareUrlDisplay.tsx` | URL display with clipboard copy button |
| `PublicCardView` | `src/app/cards/[id]/page.tsx` | Read-only card page (Server Component) |
| `PublicCardGallery` | `src/app/cards/page.tsx` | Public card gallery (Optional) |

### 6. 기술적 제약사항

- **보안**: 모든 공개 API에서 `created_by` 필드 제외, RLS(Row Level Security) 정책 고려
- **성능**: 공개 카드 조회는 캐싱 적용 가능 (ISR/revalidate)
- **SEO**: 공개 카드 페이지에 Open Graph / Twitter Card 메타데이터 포함
- **접근성**: 토글 스위치에 `role="switch"`, `aria-checked`, `aria-label` 적용
- **호환성**: SPEC-SHARE-001의 클라이언트 사이드 공유 기능과 독립적으로 동작

---

## Traceability (추적성)

| 요구사항 ID | 구현 파일 (예상) | 테스트 시나리오 |
|-------------|------------------|-----------------|
| REQ-U-001 | `storage.ts`, `request.ts`, DB migration | AC-001 |
| REQ-U-002 | `storage.ts` (saveRequest) | AC-002 |
| REQ-E-001 | `VisibilityToggle.tsx`, `/api/requests/my/[id]/visibility` | AC-003 |
| REQ-E-002 | `PublicCardView` (`/cards/[id]/page.tsx`), `/api/cards/[id]` | AC-004 |
| REQ-E-003 | Admin detail page, `/api/admin/requests/[id]/visibility` | AC-005 |
| REQ-E-004 | `ShareUrlDisplay.tsx` | AC-006 |
| REQ-S-001 | `/cards/[id]/page.tsx`, `/api/cards/[id]` | AC-007 |
| REQ-S-002 | `VisibilityToggle.tsx`, visibility API | AC-008 |
| REQ-N-001 | All public APIs, `/api/cards/[id]` | AC-009 |
| REQ-O-001 | `/cards/page.tsx`, `/api/cards` | AC-010 |
