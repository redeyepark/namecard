# SPEC-COMMUNITY-001: User Profiles + Community Feed

---
id: SPEC-COMMUNITY-001
version: 1.0.0
status: draft
created: 2026-02-27
updated: 2026-02-27
author: MoAI
priority: high
lifecycle: spec-anchored
---

## HISTORY

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2026-02-27 | 초기 SPEC 작성 |

---

## 1. 개요

기존 명함 제작 서비스를 "부캐그림(Secondary Character Illustration)" 커뮤니티로 진화시키기 위한 첫 단계. 사용자 프로필 시스템과 커뮤니티 피드를 도입하여, 개인 포트폴리오 페이지와 Instagram 스타일의 탐색 경험을 제공한다.

### 사용자 스토리

- **일반 사용자로서**, 나만의 프로필 페이지를 갖고 싶다. 내가 만든 명함(부캐그림)들을 한곳에서 보여줄 수 있기 때문이다.
- **방문자로서**, 다른 사람의 프로필을 둘러보고 어떤 테마의 카드를 주로 만드는지 보고 싶다.
- **일반 사용자로서**, 갤러리에서 최신순 또는 인기순으로 카드를 탐색하고 싶다.
- **일반 사용자로서**, 특정 테마(Pokemon, Tarot 등)의 카드만 필터링해서 보고 싶다.
- **일반 사용자로서**, 스크롤만 하면 자동으로 더 많은 카드가 로딩되는 무한 스크롤 경험을 원한다.

---

## 2. 환경 (Environment)

### 기존 시스템 컨텍스트

- **공개 갤러리** (`/cards`): Server Component 페이지, `getGalleryCards()` 함수로 이벤트별 그룹화된 카드 조회, `GalleryClient` 클라이언트 컴포넌트로 렌더링
- **카드 상세** (`/cards/[id]`): Server Component, OG metadata 자동 생성, `PublicCardView` 컴포넌트
- **갤러리 썸네일** (`GalleryCardThumbnail`): `GalleryCardData` 타입 기반, 테마별 스타일링, 상태 뱃지, 테마 뱃지 포함
- **인증 시스템**: Supabase Auth (email + Google OAuth), `AuthProvider` hook, `useAuth()` 훅
- **사용자 설정** (`/dashboard/settings`): 현재 비밀번호 변경만 지원
- **데이터베이스**: `card_requests` 테이블 (card_front JSONB, card_back JSONB, theme, is_public, event_id, status, created_by email)
- **API**: `GET /api/cards` (paginated + gallery view), `GET /api/cards/[id]` (단일 카드)
- **디자인 시스템**: Deep navy `#020912`, Off-white `#fcfcfc`, 0px border-radius, Tailwind CSS 4, Figtree + Anonymous Pro + Nanum Myeongjo 폰트

### 기술 스택

- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript 5.x
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS 4.x
- Zustand 5.0.11
- Cloudflare Workers 배포

---

## 3. 가정 (Assumptions)

| 가정 | 신뢰도 | 근거 | 틀릴 경우 영향 |
|------|--------|------|----------------|
| Supabase Auth의 `auth.users` 테이블에서 user_id (UUID)를 FK로 참조 가능 | High | Supabase 공식 문서 지원 패턴 | user_profiles 테이블 설계 변경 필요 |
| `card_requests.created_by` (email)에서 `auth.users.email`로 매핑하여 user_id backfill 가능 | High | 기존 데이터에 email 필드 존재 확인 | 수동 매핑 또는 email 기반 유지 |
| react-intersection-observer 라이브러리가 Cloudflare Workers SSR과 호환 | High | 클라이언트 전용 hook이므로 SSR 영향 없음 | 네이티브 IntersectionObserver API 직접 사용 |
| 기존 `GalleryCardThumbnail` 컴포넌트를 확장하여 사용자 정보 오버레이 추가 가능 | High | 현재 컴포넌트가 props 기반 구조 | 별도 `CommunityCardThumbnail` 컴포넌트 생성 |
| `like_count`는 초기에 서버 사이드 카운트 컬럼으로 충분 (별도 likes 테이블은 Phase 2) | Medium | MVP 범위에서 좋아요 표시만 필요, 좋아요 기능 자체는 Phase 2 | like_count 컬럼 불필요, likes 테이블 즉시 도입 |

---

## 4. 요구사항 (Requirements)

### 4.1 데이터베이스 마이그레이션

#### R-DB-001: user_profiles 테이블 생성 [Ubiquitous]

시스템은 **항상** 다음 스키마의 `user_profiles` 테이블을 유지해야 한다:

| 컬럼 | 타입 | 제약조건 |
|------|------|----------|
| `id` | UUID | PK, FK -> `auth.users(id)` ON DELETE CASCADE |
| `display_name` | VARCHAR(100) | NOT NULL |
| `bio` | VARCHAR(200) | DEFAULT '' |
| `avatar_url` | TEXT | NULLABLE |
| `is_public` | BOOLEAN | DEFAULT true |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

#### R-DB-002: card_requests 테이블에 user_id 컬럼 추가 [Event-Driven]

**WHEN** 마이그레이션이 실행될 때, **THEN** `card_requests` 테이블에 `user_id` (UUID, FK -> `auth.users(id)`) 컬럼이 추가되어야 한다.

#### R-DB-003: card_requests 테이블에 like_count 컬럼 추가 [Event-Driven]

**WHEN** 마이그레이션이 실행될 때, **THEN** `card_requests` 테이블에 `like_count` (INTEGER, DEFAULT 0) 컬럼이 추가되어야 한다.

#### R-DB-004: 피드 쿼리 최적화 인덱스 생성 [Ubiquitous]

시스템은 **항상** 다음 composite index를 유지해야 한다:
- `idx_card_requests_feed`: `(is_public, status, submitted_at DESC)`
- `idx_card_requests_user`: `(user_id)`
- `idx_card_requests_theme_feed`: `(is_public, status, theme)`

#### R-DB-005: user_id backfill [Event-Driven]

**WHEN** 마이그레이션이 실행될 때, **THEN** 기존 `card_requests.created_by` (email)를 `auth.users.email`과 매칭하여 `card_requests.user_id`를 채워야 한다.

#### R-DB-006: RLS 정책 설정 [Ubiquitous]

시스템은 **항상** `user_profiles` 테이블에 다음 RLS 정책을 적용해야 한다:
- SELECT: `is_public = true` 또는 `auth.uid() = id` 인 경우 허용
- INSERT: `auth.uid() = id` 인 경우 허용
- UPDATE: `auth.uid() = id` 인 경우 허용
- DELETE: `auth.uid() = id` 인 경우 허용

### 4.2 사용자 프로필 페이지

#### R-PROFILE-001: 프로필 페이지 라우트 [Ubiquitous]

시스템은 **항상** `/profile/[id]` 경로에서 사용자 프로필 페이지를 Server Component로 제공해야 한다.

#### R-PROFILE-002: 프로필 정보 표시 [Ubiquitous]

시스템은 **항상** 프로필 페이지에서 다음 정보를 표시해야 한다:
- 아바타 이미지 (없으면 이니셜 기반 placeholder)
- display_name
- bio (최대 200자)
- 공개 카드 수
- 총 받은 좋아요 수 (like_count 합계)

#### R-PROFILE-003: 사용자 공개 카드 그리드 [Ubiquitous]

시스템은 **항상** 프로필 페이지에서 해당 사용자의 공개 카드를 `GalleryCardThumbnail` 컴포넌트 기반 반응형 그리드로 표시해야 한다.

#### R-PROFILE-004: 테마 분포 인디케이터 [Optional]

**가능하면** 프로필 페이지에서 해당 사용자가 가장 많이 사용하는 테마 Top 3를 시각적 뱃지로 제공해야 한다.

#### R-PROFILE-005: 프로필 자동 생성 [Event-Driven]

**WHEN** 사용자가 처음 로그인할 때, **THEN** `user_profiles` 레코드가 자동 생성되어야 한다. display_name은 해당 사용자의 가장 최근 card_request의 `card_front.displayName` 값으로 설정하고, 없으면 auth.users의 email 앞부분을 사용한다.

#### R-PROFILE-006: OG 메타데이터 [Ubiquitous]

시스템은 **항상** 프로필 페이지에 Open Graph 및 Twitter Card 메타데이터를 생성해야 한다 (display_name, bio, avatar_url 기반).

#### R-PROFILE-007: 비공개 프로필 [State-Driven]

**IF** `user_profiles.is_public`이 `false`이고 방문자가 프로필 소유자가 아닌 경우, **THEN** "비공개 프로필입니다" 메시지를 표시해야 한다.

### 4.3 피드 개선

#### R-FEED-001: 기본 뷰를 시간순 피드로 변경 [Ubiquitous]

시스템은 **항상** `/cards` 페이지의 기본 뷰를 이벤트별 그룹 대신 시간순(최신순) 카드 피드로 표시해야 한다.

#### R-FEED-002: 테마 필터 탭 [Event-Driven]

**WHEN** 사용자가 갤러리 페이지 상단의 테마 필터 탭을 클릭할 때, **THEN** 해당 테마의 카드만 필터링하여 표시해야 한다. 탭 목록: All, Classic, Pokemon, Hearthstone, Harry Potter, Tarot, Nametag, SNS Profile.

#### R-FEED-003: 무한 스크롤 [Event-Driven]

**WHEN** 사용자가 피드 하단에 도달할 때, **THEN** 다음 페이지의 카드를 cursor 기반 pagination으로 자동 로딩해야 한다. `react-intersection-observer` (^9.15.0)의 `InView` 컴포넌트 또는 `useInView` hook을 사용한다.

#### R-FEED-004: 정렬 토글 [Event-Driven]

**WHEN** 사용자가 정렬 토글을 변경할 때, **THEN** "Newest" (submitted_at DESC, 기본값) 또는 "Popular" (like_count DESC) 순서로 피드를 재정렬해야 한다.

#### R-FEED-005: 이벤트별 뷰 유지 [Optional]

**가능하면** 기존 이벤트별 그룹화 뷰를 선택적 필터 모드("이벤트별 보기")로 제공해야 한다.

#### R-FEED-006: 공개 카드 필터링 [Ubiquitous]

시스템은 **항상** 피드에서 `is_public = true AND status IN ('confirmed', 'delivered')` 조건을 충족하는 카드만 표시해야 한다.

### 4.4 카드 썸네일 개선

#### R-THUMB-001: 사용자 정보 오버레이 [Event-Driven]

**WHEN** `GalleryCardThumbnail`이 피드에서 렌더링될 때, **THEN** 카드 하단에 작성자의 작은 아바타(24px 원형)와 display_name을 오버레이로 표시해야 한다.

#### R-THUMB-002: 프로필 네비게이션 [Event-Driven]

**WHEN** 사용자가 카드 썸네일의 사용자 정보 영역을 클릭할 때, **THEN** `/profile/[userId]` 페이지로 네비게이션해야 한다. 카드 본문 클릭과 이벤트 버블링이 충돌하지 않아야 한다.

#### R-THUMB-003: 좋아요 수 표시 [Ubiquitous]

시스템은 **항상** 카드 썸네일에 하트 아이콘과 함께 like_count를 표시해야 한다. like_count가 0이면 아이콘만 표시한다.

### 4.5 API 라우트

#### R-API-001: 피드 API [Ubiquitous]

시스템은 **항상** `GET /api/feed` 엔드포인트를 제공해야 한다.

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `cursor` | string | N | 마지막 카드의 submitted_at ISO 문자열 |
| `limit` | number | N | 페이지 크기 (기본: 12, 최대: 50) |
| `theme` | string | N | 테마 필터 (all = 전체) |
| `sort` | string | N | 정렬 기준 (newest / popular, 기본: newest) |

응답 형식:
```json
{
  "cards": [FeedCardData],
  "nextCursor": "2026-02-27T12:00:00Z" | null,
  "hasMore": true | false
}
```

#### R-API-002: 프로필 조회 API [Ubiquitous]

시스템은 **항상** `GET /api/profiles/[id]` 엔드포인트를 제공해야 한다. 공개 프로필 정보 + 카드 수 + 총 좋아요 수를 반환한다.

#### R-API-003: 프로필 수정 API [Event-Driven]

**WHEN** 인증된 사용자가 `PUT /api/profiles/me` 요청을 보낼 때, **THEN** 해당 사용자의 프로필(display_name, bio, avatar_url, is_public)을 업데이트해야 한다. 본인 프로필만 수정 가능하며, bio는 200자를 초과할 수 없다.

#### R-API-004: 사용자 카드 목록 API [Ubiquitous]

시스템은 **항상** `GET /api/profiles/[id]/cards` 엔드포인트를 제공해야 한다. 해당 사용자의 공개 카드를 최신순으로 반환한다.

### 4.6 프로필 설정

#### R-SETTINGS-001: 프로필 편집 섹션 추가 [Ubiquitous]

시스템은 **항상** `/dashboard/settings` 페이지에서 프로필 편집 섹션(display_name, bio, avatar 업로드, 공개/비공개 토글)을 제공해야 한다. 기존 비밀번호 변경 섹션 위에 위치한다.

#### R-SETTINGS-002: 아바타 업로드 [Event-Driven]

**WHEN** 사용자가 프로필 아바타를 업로드할 때, **THEN** Supabase Storage의 `avatars` 버킷에 `profiles/{userId}/avatar.{ext}` 경로로 저장하고 public URL을 `user_profiles.avatar_url`에 반영해야 한다.

#### R-SETTINGS-003: 프로필 미리보기 [Optional]

**가능하면** 설정 페이지에서 프로필 편집 시 실시간 미리보기를 제공해야 한다.

### 4.7 금지 사항

#### R-UNWANTED-001: 비공개 카드 노출 금지 [Unwanted]

시스템은 `is_public = false`인 카드를 피드 또는 다른 사용자의 프로필 페이지에 표시**하지 않아야 한다**.

#### R-UNWANTED-002: 타인 프로필 수정 금지 [Unwanted]

시스템은 `auth.uid() != profile.id`인 경우 프로필 수정 요청을 허용**하지 않아야 한다**.

#### R-UNWANTED-003: 사용자 이메일 노출 금지 [Unwanted]

시스템은 프로필 페이지, 피드, API 응답에서 사용자의 `created_by` (email)를 노출**하지 않아야 한다**. user_id (UUID)만 사용한다.

---

## 5. 사양 (Specifications)

### 5.1 새로운 타입 정의

```typescript
// src/types/profile.ts
export interface UserProfile {
  id: string;            // UUID, auth.users FK
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePageData {
  profile: UserProfile;
  cardCount: number;
  totalLikes: number;
  themeDistribution: { theme: string; count: number }[];
}

// src/types/card.ts (확장)
export interface FeedCardData extends GalleryCardData {
  userId: string | null;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  likeCount: number;
}

export interface FeedResponse {
  cards: FeedCardData[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### 5.2 데이터베이스 마이그레이션 SQL

```sql
-- 1. user_profiles 테이블 생성
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  bio VARCHAR(200) DEFAULT '',
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS 활성화 및 정책
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = id);

-- 3. card_requests 테이블 확장
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- 4. user_id backfill
UPDATE card_requests cr
SET user_id = au.id
FROM auth.users au
WHERE cr.created_by = au.email
  AND cr.user_id IS NULL;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_card_requests_feed
  ON card_requests (is_public, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_requests_user
  ON card_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_card_requests_theme_feed
  ON card_requests (is_public, status, theme);

CREATE INDEX IF NOT EXISTS idx_card_requests_like_count
  ON card_requests (like_count DESC);
```

### 5.3 파일 구조 변경 (신규 + 수정)

**신규 파일:**
- `src/types/profile.ts` - UserProfile, ProfilePageData, FeedCardData 타입
- `src/app/profile/[id]/page.tsx` - 프로필 페이지 (Server Component)
- `src/app/profile/[id]/ProfileClient.tsx` - 프로필 클라이언트 컴포넌트
- `src/app/api/feed/route.ts` - 피드 API (cursor-based pagination)
- `src/app/api/profiles/[id]/route.ts` - 프로필 조회 API
- `src/app/api/profiles/me/route.ts` - 프로필 수정 API
- `src/app/api/profiles/[id]/cards/route.ts` - 사용자 카드 목록 API
- `src/lib/profile-storage.ts` - 프로필 관련 DB 함수
- `src/components/feed/FeedContainer.tsx` - 피드 컨테이너 (무한 스크롤)
- `src/components/feed/FeedFilters.tsx` - 테마 필터 탭 + 정렬 토글
- `src/components/feed/FeedCardThumbnail.tsx` - 피드용 확장 카드 썸네일
- `src/components/profile/ProfileHeader.tsx` - 프로필 헤더 (아바타, 이름, bio, 통계)
- `src/components/profile/ProfileEditForm.tsx` - 프로필 편집 폼
- `src/components/profile/ThemeDistribution.tsx` - 테마 분포 표시

**수정 파일:**
- `src/app/cards/page.tsx` - 피드 기본 뷰로 변경
- `src/app/cards/GalleryClient.tsx` - FeedContainer 통합, 이벤트 뷰 옵션 유지
- `src/app/dashboard/settings/page.tsx` - 프로필 편집 섹션 추가
- `src/types/card.ts` - FeedCardData, FeedResponse 타입 추가
- `src/lib/storage.ts` - getFeedCards() 함수 추가, getGalleryCards() 유지
- `src/components/gallery/GalleryCardThumbnail.tsx` - 사용자 정보 오버레이 + 좋아요 수 추가 (optional props)
- `src/middleware.ts` - `/profile/[id]` 라우트는 공개 접근 허용
- `src/components/auth/AuthProvider.tsx` - 프로필 자동 생성 트리거 추가

### 5.4 라우트 접근 수준

| 라우트 | 접근 수준 | 설명 |
|--------|-----------|------|
| `/profile/[id]` | 공개 | 사용자 프로필 페이지 (비공개 프로필은 제한 메시지) |
| `/cards` | 공개 | 커뮤니티 피드 (기본: 시간순) |
| `/api/feed` | 공개 | 피드 데이터 API |
| `/api/profiles/[id]` | 공개 | 프로필 조회 API |
| `/api/profiles/me` | 인증 필요 | 프로필 수정 API |
| `/api/profiles/[id]/cards` | 공개 | 사용자 카드 목록 API |

---

## 6. 제약 사항 (Constraints)

### 기술적 제약

- Cloudflare Workers 엣지 런타임 호환 필수: `node:*` 모듈 사용 불가, Buffer 대신 Uint8Array
- Supabase service_role 키는 서버 사이드(API Routes)에서만 사용
- 이미지 최적화 불가 (`next/image` unoptimized 설정 유지)
- 기존 `created_by` (email) 기반 소유권 검증 로직은 `user_id` 기반으로 점진적 전환 (하위 호환성 유지)

### 성능 제약

- 피드 API 응답 시간: P95 < 500ms
- 무한 스크롤 한 번에 로딩하는 카드 수: 12개 (기본값)
- 프로필 페이지 카드 그리드: 초기 로딩 최대 20개, 이후 pagination

### 디자인 제약

- 기존 디자인 시스템 준수: Deep navy, Off-white, 0px border-radius
- 프로필 페이지는 기존 갤러리 헤더 스타일과 일관성 유지
- 모바일 우선(Mobile-first) 반응형 디자인

---

## 7. Traceability

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|-------------|-----------|-----------------|
| R-DB-001 | SQL migration | AC-DB-001 |
| R-DB-002 | SQL migration | AC-DB-002 |
| R-DB-005 | SQL migration | AC-DB-003 |
| R-PROFILE-001 | `src/app/profile/[id]/page.tsx` | AC-PROFILE-001 |
| R-PROFILE-002 | `ProfileHeader.tsx` | AC-PROFILE-002 |
| R-PROFILE-005 | `AuthProvider.tsx`, `profile-storage.ts` | AC-PROFILE-003 |
| R-FEED-001 | `src/app/cards/page.tsx`, `FeedContainer.tsx` | AC-FEED-001 |
| R-FEED-002 | `FeedFilters.tsx` | AC-FEED-002 |
| R-FEED-003 | `FeedContainer.tsx` | AC-FEED-003 |
| R-FEED-004 | `FeedFilters.tsx` | AC-FEED-004 |
| R-THUMB-001 | `FeedCardThumbnail.tsx` | AC-THUMB-001 |
| R-API-001 | `src/app/api/feed/route.ts` | AC-API-001 |
| R-API-003 | `src/app/api/profiles/me/route.ts` | AC-API-002 |
| R-SETTINGS-001 | `src/app/dashboard/settings/page.tsx` | AC-SETTINGS-001 |
