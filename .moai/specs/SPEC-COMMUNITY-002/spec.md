---
id: SPEC-COMMUNITY-002
title: Like + Bookmark System
version: 1.0.0
status: completed
created: 2026-02-27
updated: 2026-02-27
author: MoAI
priority: medium
depends_on:
  - SPEC-COMMUNITY-001
tags: [community, like, bookmark, engagement, social]
---

# SPEC-COMMUNITY-002: Like + Bookmark System (좋아요 + 북마크 시스템)

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2026-02-27 | MoAI | 초기 SPEC 작성 |

## 의존성

- **SPEC-COMMUNITY-001** (User Profiles + Feed Enhancement): 사용자 프로필 시스템, `user_profiles` 테이블, `card_requests.user_id` (UUID) 컬럼, `card_requests.like_count` (INTEGER) 컬럼이 선행 구현되어 있어야 함.

---

## 1. Environment (환경)

### 1.1 기술 스택

| 구분 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 16.1.6 (App Router) | Server Components + Client Components |
| 언어 | TypeScript 5.x | strict 모드 |
| 데이터베이스 | Supabase PostgreSQL | RLS 정책 적용 |
| 인증 | Supabase Auth (@supabase/ssr 0.8.0) | 이메일/비밀번호 + Google OAuth |
| 상태 관리 | Zustand 5.0.11 | 클라이언트 상태 관리 |
| 스타일링 | Tailwind CSS 4.x | 유틸리티 기반 CSS |
| 배포 | Cloudflare Workers | @opennextjs/cloudflare |
| 테스트 | Vitest 4.0.18 + Testing Library 16.3.2 | 단위/컴포넌트 테스트 |

### 1.2 기존 시스템 컨텍스트

- `card_requests` 테이블: 명함 제작 요청 데이터 (SPEC-COMMUNITY-001 이후 `user_id` UUID 컬럼, `like_count` INTEGER 컬럼 추가됨)
- `user_profiles` 테이블: 사용자 프로필 정보 (SPEC-COMMUNITY-001에서 생성)
- `GalleryCardThumbnail` 컴포넌트: 갤러리 그리드 카드 썸네일 (`src/components/gallery/GalleryCardThumbnail.tsx`)
- `/cards/[id]` 페이지: 공개 명함 상세 페이지 (Server Component + `PublicCardView` Client Component)
- `/dashboard` 페이지: 사용자 대시보드
- `useAuth` 훅: 클라이언트 컴포넌트에서 인증 상태 접근 (`AuthProvider` 기반)
- Supabase Auth: `auth.users` 테이블에서 사용자 UUID 관리

---

## 2. Assumptions (가정)

### 2.1 기술적 가정

- A-01: SPEC-COMMUNITY-001이 완료되어 `user_profiles` 테이블과 `card_requests.user_id`, `card_requests.like_count` 컬럼이 존재한다.
- A-02: Supabase Auth의 `auth.users.id` (UUID)가 모든 사용자 식별의 기준이다.
- A-03: Supabase RLS 정책이 `anon` 키 수준에서 적절히 제한되어 있다 (SPEC-COMMUNITY-001에서 개선됨).
- A-04: Cloudflare Workers 환경에서 Supabase SDK의 기본 CRUD 작업이 정상 동작한다.
- A-05: 프론트엔드에서 `useAuth` 훅을 통해 현재 로그인 사용자의 UUID를 즉시 접근할 수 있다.

### 2.2 비즈니스 가정

- A-06: 좋아요는 공개 정보이며, 누구나 좋아요 수를 볼 수 있다.
- A-07: 북마크는 비공개 정보이며, 오직 북마크한 본인만 자신의 북마크 목록을 볼 수 있다.
- A-08: 한 사용자는 하나의 카드에 최대 1번만 좋아요할 수 있다 (토글 방식).
- A-09: 삭제된 카드의 좋아요/북마크는 CASCADE로 자동 삭제된다.

---

## 3. Requirements (요구사항)

### 3.1 데이터베이스 요구사항

#### REQ-DB-001: card_likes 테이블 생성 [Ubiquitous]

시스템은 **항상** `card_likes` 테이블을 다음 스키마로 유지해야 한다:

- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `card_id` UUID NOT NULL REFERENCES card_requests(id) ON DELETE CASCADE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- PRIMARY KEY (user_id, card_id)
- INDEX: `idx_card_likes_card_id` ON card_likes(card_id)

#### REQ-DB-002: card_bookmarks 테이블 생성 [Ubiquitous]

시스템은 **항상** `card_bookmarks` 테이블을 다음 스키마로 유지해야 한다:

- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `card_id` UUID NOT NULL REFERENCES card_requests(id) ON DELETE CASCADE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- PRIMARY KEY (user_id, card_id)
- INDEX: `idx_card_bookmarks_user_id` ON card_bookmarks(user_id)

#### REQ-DB-003: like_count 동기화 [Event-Driven]

**WHEN** 사용자가 좋아요를 추가 또는 제거하면 **THEN** `card_requests.like_count`가 실제 `card_likes` 레코드 수와 동기화되어야 한다.

구현 방식: 애플리케이션 레벨 로직 (API Route에서 INSERT/DELETE 후 COUNT 업데이트)

#### REQ-DB-004: RLS 정책 [Ubiquitous]

시스템은 **항상** 다음 RLS 정책을 적용해야 한다:

**card_likes 테이블:**
- SELECT: 모든 사용자 (anon 포함) 가능 - 좋아요 수는 공개 정보
- INSERT: 인증된 사용자만 가능, `auth.uid() = user_id` 조건
- DELETE: 인증된 사용자만 가능, `auth.uid() = user_id` 조건

**card_bookmarks 테이블:**
- SELECT: 인증된 사용자만 가능, `auth.uid() = user_id` 조건 - 본인 북마크만 조회
- INSERT: 인증된 사용자만 가능, `auth.uid() = user_id` 조건
- DELETE: 인증된 사용자만 가능, `auth.uid() = user_id` 조건

### 3.2 좋아요 기능 요구사항

#### REQ-LIKE-001: 좋아요 토글 [Event-Driven]

**WHEN** 인증된 사용자가 하트 아이콘을 탭하면 **THEN** 좋아요 상태가 토글된다 (좋아요 -> 좋아요 취소, 좋아요 취소 -> 좋아요).

#### REQ-LIKE-002: 좋아요 카운트 표시 [Ubiquitous]

시스템은 **항상** 하트 아이콘 옆에 좋아요 카운트를 표시해야 한다.

#### REQ-LIKE-003: Optimistic UI 업데이트 [Event-Driven]

**WHEN** 사용자가 좋아요를 토글하면 **THEN** UI가 즉시 업데이트되고, 서버 요청 실패 시 이전 상태로 롤백된다.

#### REQ-LIKE-004: 비인증 사용자 제한 [State-Driven]

**IF** 사용자가 인증되지 않은 상태 **THEN** 좋아요 카운트는 표시하되 하트 아이콘 클릭 시 로그인 페이지로 안내한다.

#### REQ-LIKE-005: Rate Limiting [Unwanted]

시스템은 사용자당 시간당 100회를 초과하는 좋아요 요청을 허용**하지 않아야 한다**.

구현 방식: 서버 측 애플리케이션 레벨 카운터 (in-memory 또는 Supabase 쿼리 기반)

#### REQ-LIKE-006: 좋아요 애니메이션 [Event-Driven]

**WHEN** 사용자가 좋아요를 누르면 **THEN** 하트 아이콘에 짧은 burst 애니메이션 효과가 표시된다.

### 3.3 북마크 기능 요구사항

#### REQ-BOOKMARK-001: 북마크 토글 [Event-Driven]

**WHEN** 인증된 사용자가 북마크 아이콘을 탭하면 **THEN** 북마크 상태가 토글된다.

#### REQ-BOOKMARK-002: 북마크 비공개 [Ubiquitous]

시스템은 **항상** 북마크를 비공개로 유지해야 한다. 북마크 목록은 오직 본인만 접근할 수 있다.

#### REQ-BOOKMARK-003: Optimistic UI 업데이트 [Event-Driven]

**WHEN** 사용자가 북마크를 토글하면 **THEN** UI가 즉시 업데이트되고, 서버 요청 실패 시 이전 상태로 롤백된다.

#### REQ-BOOKMARK-004: 북마크 목록 페이지 [Event-Driven]

**WHEN** 인증된 사용자가 `/dashboard/bookmarks` 페이지에 접근하면 **THEN** 사용자의 북마크된 카드가 그리드 형태로 표시된다.

#### REQ-BOOKMARK-005: 비인증 사용자 제한 [State-Driven]

**IF** 사용자가 인증되지 않은 상태 **THEN** 북마크 아이콘을 표시하지 않는다.

### 3.4 API 요구사항

#### REQ-API-001: 좋아요 토글 API [Event-Driven]

**WHEN** `POST /api/cards/[id]/like` 요청이 들어오면 **THEN** 좋아요 상태를 토글하고 `{ liked: boolean, likeCount: number }`를 반환한다.

- 인증 필수: `requireAuth`
- 이미 좋아요한 경우: 좋아요 해제 (DELETE)
- 좋아요하지 않은 경우: 좋아요 추가 (INSERT)
- `card_requests.like_count` 동기화

#### REQ-API-002: 좋아요 상태 조회 API [Event-Driven]

**WHEN** `GET /api/cards/[id]/like` 요청이 들어오면 **THEN** 현재 사용자의 좋아요 상태와 전체 좋아요 카운트를 `{ liked: boolean, likeCount: number }`로 반환한다.

- 비인증 사용자: `{ liked: false, likeCount: number }` 반환 (카운트만)

#### REQ-API-003: 북마크 토글 API [Event-Driven]

**WHEN** `POST /api/cards/[id]/bookmark` 요청이 들어오면 **THEN** 북마크 상태를 토글하고 `{ bookmarked: boolean }`을 반환한다.

- 인증 필수: `requireAuth`

#### REQ-API-004: 북마크 상태 조회 API [Event-Driven]

**WHEN** `GET /api/cards/[id]/bookmark` 요청이 들어오면 **THEN** 현재 사용자의 북마크 상태를 `{ bookmarked: boolean }`로 반환한다.

- 인증 필수: `requireAuth`

#### REQ-API-005: 북마크 목록 API [Event-Driven]

**WHEN** `GET /api/bookmarks` 요청이 들어오면 **THEN** 현재 사용자의 북마크된 카드 목록을 페이지네이션으로 반환한다.

- 인증 필수: `requireAuth`
- 응답 형식: `{ cards: GalleryCardData[], total: number, page: number, pageSize: number }`
- 기본 pageSize: 20
- 정렬: 북마크 추가 시간 내림차순 (최신순)

### 3.5 UI 컴포넌트 요구사항

#### REQ-UI-001: LikeButton 컴포넌트 [Ubiquitous]

시스템은 **항상** `LikeButton` 컴포넌트를 다음 사양으로 제공해야 한다:

- 하트 아이콘 (SVG): 비활성 상태는 outline, 활성 상태는 filled (빨간색)
- 좋아요 카운트 숫자 표시
- 클릭 시 토글 동작
- 좋아요 시 burst 애니메이션 (scale + opacity transition, CSS keyframes)
- 인증 상태에 따른 조건부 동작 (비인증 시 로그인 안내)
- Props: `cardId: string`, `initialLiked: boolean`, `initialCount: number`

#### REQ-UI-002: BookmarkButton 컴포넌트 [State-Driven]

**IF** 사용자가 인증된 상태 **THEN** `BookmarkButton` 컴포넌트를 다음 사양으로 표시한다:

- 북마크 아이콘 (SVG): 비활성 상태는 outline, 활성 상태는 filled
- 클릭 시 토글 동작
- Optimistic UI 업데이트
- Props: `cardId: string`, `initialBookmarked: boolean`

#### REQ-UI-003: GalleryCardThumbnail 통합 [Event-Driven]

**WHEN** `GalleryCardThumbnail`이 렌더링되면 **THEN** 카드 하단에 `LikeButton`이 표시된다.

- 기존 레이아웃 보존
- 하트 아이콘과 카운트를 하단 gradient overlay 영역에 배치

#### REQ-UI-004: 카드 상세 페이지 통합 [Event-Driven]

**WHEN** `/cards/[id]` 페이지가 렌더링되면 **THEN** `LikeButton`과 `BookmarkButton`이 카드 하단에 표시된다.

#### REQ-UI-005: 프로필 페이지 총 좋아요 표시 [Event-Driven]

**WHEN** `/profile/[id]` 페이지가 렌더링되면 **THEN** 해당 사용자의 전체 카드에 대한 총 좋아요 수가 표시된다.

#### REQ-UI-006: 대시보드 네비게이션 [Event-Driven]

**WHEN** 대시보드 네비게이션이 렌더링되면 **THEN** "북마크" 링크가 사이드바/네비게이션에 포함된다.

- 링크 대상: `/dashboard/bookmarks`

---

## 4. Specifications (세부 사양)

### 4.1 데이터베이스 마이그레이션

**파일**: `supabase/migrations/008_add_likes_bookmarks.sql`

```sql
-- card_likes table
CREATE TABLE card_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES card_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_id)
);

CREATE INDEX idx_card_likes_card_id ON card_likes(card_id);

-- card_bookmarks table
CREATE TABLE card_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES card_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_id)
);

CREATE INDEX idx_card_bookmarks_user_id ON card_bookmarks(user_id);

-- RLS for card_likes
ALTER TABLE card_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON card_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON card_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON card_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for card_bookmarks
ALTER TABLE card_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON card_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark"
  ON card_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own bookmarks"
  ON card_bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.2 API Route 사양

#### POST /api/cards/[id]/like

- 인증: `requireAuth` (401 Unauthorized)
- Rate Limit: 시간당 100회 (429 Too Many Requests)
- 존재하지 않는 카드: 404 Not Found
- 로직: card_likes에서 기존 레코드 확인 -> 있으면 DELETE, 없으면 INSERT -> card_requests.like_count UPDATE
- 응답: `{ liked: boolean, likeCount: number }`

#### GET /api/cards/[id]/like

- 인증: 선택적 (비인증 시 liked=false)
- 로직: card_likes 조회 + card_requests.like_count 조회
- 응답: `{ liked: boolean, likeCount: number }`

#### POST /api/cards/[id]/bookmark

- 인증: `requireAuth` (401 Unauthorized)
- 존재하지 않는 카드: 404 Not Found
- 로직: card_bookmarks에서 기존 레코드 확인 -> 있으면 DELETE, 없으면 INSERT
- 응답: `{ bookmarked: boolean }`

#### GET /api/cards/[id]/bookmark

- 인증: `requireAuth` (401 Unauthorized)
- 로직: card_bookmarks 조회
- 응답: `{ bookmarked: boolean }`

#### GET /api/bookmarks

- 인증: `requireAuth` (401 Unauthorized)
- Query Params: `page` (기본 1), `pageSize` (기본 20, 최대 50)
- 로직: card_bookmarks JOIN card_requests로 북마크된 카드 목록 조회
- 정렬: `card_bookmarks.created_at DESC`
- 응답: `{ cards: GalleryCardData[], total: number, page: number, pageSize: number }`

### 4.3 컴포넌트 사양

#### LikeButton (`src/components/social/LikeButton.tsx`)

```typescript
interface LikeButtonProps {
  cardId: string;
  initialLiked: boolean;
  initialCount: number;
  size?: 'sm' | 'md';  // sm for thumbnail, md for detail page
}
```

- **비활성 상태**: outline 하트, 좋아요 수 회색 텍스트
- **활성 상태**: filled 빨간색 하트 (#EF4444), 좋아요 수 빨간색 텍스트
- **애니메이션**: 좋아요 시 scale(1.3) -> scale(1.0) transition (300ms, ease-out)
- **비인증 사용자**: 클릭 시 `router.push('/login')` 또는 toast 알림

#### BookmarkButton (`src/components/social/BookmarkButton.tsx`)

```typescript
interface BookmarkButtonProps {
  cardId: string;
  initialBookmarked: boolean;
}
```

- **비활성 상태**: outline 북마크 아이콘
- **활성 상태**: filled 북마크 아이콘 (#020912)
- **비인증 사용자**: 컴포넌트 자체를 렌더링하지 않음

### 4.4 통합 지점

#### GalleryCardThumbnail 수정

- 하단 gradient overlay 영역 우측에 LikeButton(size="sm") 추가
- 기존 status badge와 겹치지 않도록 레이아웃 조정 (status badge: bottom-left, like button: bottom-right)

#### PublicCardView 수정

- 카드 하단 "명함 저장" 버튼 영역에 LikeButton(size="md")과 BookmarkButton 추가
- flex 레이아웃으로 좌측 좋아요/북마크, 우측 명함 저장 버튼 배치

#### GalleryCardData 타입 확장

```typescript
export interface GalleryCardData {
  // ...existing fields
  likeCount: number;  // 추가
}
```

### 4.5 성능 요구사항

| 항목 | 목표 |
|------|------|
| 좋아요 토글 API 응답 시간 | P95 < 300ms |
| 북마크 토글 API 응답 시간 | P95 < 200ms |
| 북마크 목록 API 응답 시간 | P95 < 500ms (20개 기준) |
| Optimistic UI 반영 시간 | < 50ms (즉시) |
| LikeButton 렌더링 | 추가 번들 크기 < 3KB |

### 4.6 보안 요구사항

| 항목 | 설명 |
|------|------|
| 인증 검증 | 모든 쓰기 API에 `requireAuth` 적용 |
| 소유권 검증 | RLS 정책으로 본인 데이터만 INSERT/DELETE 가능 |
| Rate Limiting | 시간당 100회 좋아요 제한 |
| 입력 검증 | card_id UUID 형식 검증 |
| CASCADE 삭제 | 카드/사용자 삭제 시 관련 좋아요/북마크 자동 삭제 |

---

## Traceability

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|-------------|----------|---------------|
| REQ-DB-001 | supabase/migrations/008_add_likes_bookmarks.sql | AC-DB-001 |
| REQ-DB-002 | supabase/migrations/008_add_likes_bookmarks.sql | AC-DB-001 |
| REQ-DB-003 | src/app/api/cards/[id]/like/route.ts | AC-LIKE-001 |
| REQ-DB-004 | supabase/migrations/008_add_likes_bookmarks.sql | AC-SEC-001 |
| REQ-LIKE-001 | src/components/social/LikeButton.tsx | AC-LIKE-001 |
| REQ-LIKE-002 | src/components/social/LikeButton.tsx | AC-LIKE-002 |
| REQ-LIKE-003 | src/components/social/LikeButton.tsx | AC-LIKE-003 |
| REQ-LIKE-004 | src/components/social/LikeButton.tsx | AC-LIKE-004 |
| REQ-LIKE-005 | src/app/api/cards/[id]/like/route.ts | AC-LIKE-005 |
| REQ-LIKE-006 | src/components/social/LikeButton.tsx | AC-LIKE-006 |
| REQ-BOOKMARK-001 | src/components/social/BookmarkButton.tsx | AC-BOOKMARK-001 |
| REQ-BOOKMARK-002 | RLS policies + API routes | AC-SEC-001 |
| REQ-BOOKMARK-003 | src/components/social/BookmarkButton.tsx | AC-BOOKMARK-002 |
| REQ-BOOKMARK-004 | src/app/dashboard/bookmarks/page.tsx | AC-BOOKMARK-003 |
| REQ-BOOKMARK-005 | src/components/social/BookmarkButton.tsx | AC-BOOKMARK-004 |
| REQ-API-001 | src/app/api/cards/[id]/like/route.ts | AC-LIKE-001 |
| REQ-API-002 | src/app/api/cards/[id]/like/route.ts | AC-LIKE-002 |
| REQ-API-003 | src/app/api/cards/[id]/bookmark/route.ts | AC-BOOKMARK-001 |
| REQ-API-004 | src/app/api/cards/[id]/bookmark/route.ts | AC-BOOKMARK-002 |
| REQ-API-005 | src/app/api/bookmarks/route.ts | AC-BOOKMARK-003 |
| REQ-UI-001 | src/components/social/LikeButton.tsx | AC-LIKE-001~006 |
| REQ-UI-002 | src/components/social/BookmarkButton.tsx | AC-BOOKMARK-001~004 |
| REQ-UI-003 | src/components/gallery/GalleryCardThumbnail.tsx | AC-UI-001 |
| REQ-UI-004 | src/app/cards/[id]/PublicCardView.tsx | AC-UI-002 |
| REQ-UI-005 | src/app/profile/[id]/page.tsx | AC-UI-003 |
| REQ-UI-006 | src/app/dashboard/layout.tsx 또는 네비게이션 컴포넌트 | AC-UI-004 |
