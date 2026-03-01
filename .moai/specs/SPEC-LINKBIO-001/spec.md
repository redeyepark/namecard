---
id: SPEC-LINKBIO-001
title: Link-in-Bio Profile Redesign Phase 1
version: "1.0.0"
status: approved
created: "2026-03-01"
updated: "2026-03-01"
author: MoAI
priority: high
tags: [profile, linkbio, mobile-first, social, links, portfolio]
related_specs: [SPEC-COMMUNITY-001, SPEC-COMMUNITY-002]
lifecycle: spec-anchored
---

# SPEC-LINKBIO-001: Link-in-Bio 프로필 리디자인 (Phase 1)

## HISTORY

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-03-01 | 1.0.0 | 초기 SPEC 작성 - Phase 1 핵심 레이아웃 및 API |

## 1. Environment (환경)

### 1.1 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| UI | React | 19.x |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS | 4.x |
| 상태 관리 | Zustand | 5.0.11 |
| 인증 | Supabase Auth (@supabase/ssr) | 0.8.0 |
| DB | Supabase PostgreSQL (supabase-js) | 2.97.0 |
| 아이콘 | lucide-react | 기존 설치 버전 |
| 배포 | Cloudflare Workers | - |

### 1.2 디자인 시스템

- 색상: 딥 네이비(`#020912`) + 오프 화이트(`#fcfcfc`)
- 모서리: 0px border-radius (날카로운 모서리)
- 폰트: Figtree (제목/헤딩) + Anonymous Pro (본문/모노)
- 스타일: 미니멀리스트 갤러리

### 1.3 영향 범위

- Route: `/profile/[id]`
- Server Component: `src/app/profile/[id]/page.tsx`
- Client Component: `src/app/profile/[id]/ProfileClient.tsx`
- Components: `src/components/profile/`
- Types: `src/types/profile.ts`
- Storage: `src/lib/profile-storage.ts`
- API: `src/app/api/profiles/`

### 1.4 현재 상태 (Before)

현재 프로필 페이지는 SPEC-COMMUNITY-001에서 구현된 기본 구조:
- ProfileHeader: 아바타(120px, 원형) + 이름 + 카드 수 + Bio + QR/공유 버튼
- 카드 그리드: 2-4열 반응형 그리드로 사용자 카드 표시
- ThemeDistribution: 테마별 필터 칩
- 커스텀 링크 기능 없음, 소셜 아이콘 없음
- 가로형 레이아웃 (max-width: 7xl)

## 2. Assumptions (가정)

- A01: `user_profiles` 테이블에 `social_links JSONB` 컬럼 추가가 가능하다 (Supabase 대시보드 또는 SQL 마이그레이션)
- A02: `user_links` 테이블 신규 생성이 가능하다
- A03: lucide-react 패키지가 이미 설치되어 있어 소셜 아이콘 렌더링에 활용할 수 있다
- A04: 기존 `getProfile`, `getUserCards` 함수는 하위 호환성을 유지하며 확장한다
- A05: 프로필 소유자 판별은 Supabase Auth 세션의 user.id와 profile.id 비교로 수행한다
- A06: 모바일 사용자가 전체 트래픽의 70% 이상을 차지하므로 모바일 퍼스트 설계가 필수이다

## 3. Requirements (요구사항)

### 3.1 Ubiquitous (항상 적용)

**REQ-U01: 모바일 퍼스트 세로 레이아웃**
시스템은 **항상** 프로필 페이지를 모바일 퍼스트 세로 단일 컬럼 중앙 정렬 레이아웃(max-width: 680px)으로 렌더링해야 한다.

**REQ-U02: 디자인 시스템 일관성**
시스템은 **항상** 기존 디자인 시스템을 적용해야 한다: 딥 네이비(`#020912`), 오프 화이트(`#fcfcfc`), 0px border-radius, Figtree/Anonymous Pro 폰트.

**REQ-U03: 서버 사이드 OG 메타데이터**
시스템은 **항상** `generateMetadata` 함수를 통해 서버 사이드에서 Open Graph 메타데이터를 생성해야 한다.

### 3.2 Event-Driven (이벤트 기반)

**REQ-E01: 프로필 접근 시 세로 섹션 레이아웃**
**WHEN** 사용자가 `/profile/[id]` 경로에 접근 **THEN** 다음 순서의 세로 섹션이 표시된다:
1. 프로필 헤더 (아바타 80px + 이름 + Bio)
2. 소셜 아이콘 행
3. 커스텀 링크 버튼 목록
4. 카드 포트폴리오 섹션
5. QR/공유 버튼

**REQ-E02: 프로필 소유자 편집 버튼**
**WHEN** 프로필 소유자(인증된 사용자 ID === 프로필 ID)가 자신의 프로필을 방문 **THEN** 화면 하단에 "프로필 편집" 플로팅 버튼이 표시된다.

**REQ-E03: 커스텀 링크 CRUD**
**WHEN** 프로필 소유자가 링크를 추가 **THEN** title(필수, 최대 100자), url(필수, 유효한 URL) 입력 후 `user_links` 테이블에 저장된다.
**WHEN** 프로필 소유자가 링크를 수정 **THEN** 해당 링크의 title, url, is_active 필드가 업데이트된다.
**WHEN** 프로필 소유자가 링크를 삭제 **THEN** 해당 링크가 `user_links` 테이블에서 제거된다.

**REQ-E04: 방문자 링크 클릭**
**WHEN** 방문자가 커스텀 링크 버튼을 클릭 **THEN** 해당 URL이 새 탭(`target="_blank"`, `rel="noopener noreferrer"`)으로 열린다.

**REQ-E05: 소셜 링크 편집**
**WHEN** 프로필 소유자가 소셜 링크를 편집(플랫폼: instagram, facebook, linkedin, email, website 등) **THEN** `user_profiles.social_links` JSONB 필드에 `[{ platform, url }]` 형태로 저장된다.

### 3.3 State-Driven (상태 기반)

**REQ-S01: 비공개 프로필 잠금**
**IF** `is_public = false` **AND** 접근자가 프로필 소유자가 아닌 경우 **THEN** 잠금 화면(자물쇠 아이콘 + "비공개 프로필입니다" 메시지)을 표시한다.

**REQ-S02: 카드 없음 상태**
**IF** 사용자의 공개 카드가 0장 **THEN** 카드 포트폴리오 섹션을 숨긴다.

**REQ-S03: 링크 없음 상태**
**IF** 커스텀 링크가 0개 **AND** 접근자가 소유자 **THEN** "링크를 추가하세요" 안내 메시지를 표시한다.
**IF** 커스텀 링크가 0개 **AND** 접근자가 방문자 **THEN** 링크 섹션을 숨긴다.

**REQ-S04: 소셜 링크 아이콘 행**
**IF** 소셜 링크가 1개 이상 존재 **THEN** 프로필 헤더 아래에 소셜 아이콘 행을 표시한다.
**IF** 소셜 링크가 0개 **THEN** 소셜 아이콘 행을 숨긴다(방문자), 소유자에게는 "소셜 링크 추가" 안내를 표시한다.

### 3.4 Unwanted (금지 사항)

**REQ-N01: XSS URL 차단**
시스템은 `javascript:` 프로토콜 URL을 **저장하지 않아야 한다**. URL 저장 시 프로토콜 검증(http/https만 허용)을 수행한다.

**REQ-N02: 미인증 데이터 수정 차단**
시스템은 미인증 사용자의 프로필 및 링크 데이터 수정 요청을 **허용하지 않아야 한다**. API 레벨에서 `requireAuth` 검증을 수행한다.

**REQ-N03: 타인 링크 수정/삭제 차단**
시스템은 다른 사용자의 링크 수정/삭제 요청을 **허용하지 않아야 한다**. API 레벨에서 소유권 검증(`link.user_id === session.user.id`)을 수행한다.

## 4. Specifications (명세)

### 4.1 데이터베이스 변경

#### 4.1.1 신규 테이블: `user_links`

```sql
CREATE TABLE user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient user lookup
CREATE INDEX idx_user_links_user_id ON user_links(user_id);

-- RLS policies
ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;

-- Public read for active links
CREATE POLICY "user_links_select_public" ON user_links
  FOR SELECT USING (is_active = true);

-- Owner full access
CREATE POLICY "user_links_insert_owner" ON user_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_links_update_owner" ON user_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_links_delete_owner" ON user_links
  FOR DELETE USING (auth.uid() = user_id);
```

#### 4.1.2 테이블 변경: `user_profiles`

```sql
ALTER TABLE user_profiles
  ADD COLUMN social_links JSONB NOT NULL DEFAULT '[]';
```

`social_links` JSONB 스키마:
```json
[
  { "platform": "instagram", "url": "https://instagram.com/username" },
  { "platform": "linkedin", "url": "https://linkedin.com/in/username" },
  { "platform": "email", "url": "mailto:user@example.com" },
  { "platform": "website", "url": "https://example.com" }
]
```

지원 플랫폼: `instagram`, `facebook`, `linkedin`, `email`, `website`, `github`, `youtube`, `twitter`

### 4.2 API 설계

#### 4.2.1 링크 API

| 메서드 | 엔드포인트 | 인증 | 설명 |
|--------|-----------|------|------|
| GET | `/api/profiles/[id]/links` | 공개 | 활성 링크 목록 조회 (is_active=true, sort_order ASC) |
| GET | `/api/profiles/me/links` | requireAuth | 내 링크 전체 조회 (비활성 포함) |
| POST | `/api/profiles/me/links` | requireAuth | 링크 생성 |
| PUT | `/api/profiles/me/links/[linkId]` | requireAuth | 링크 수정 |
| DELETE | `/api/profiles/me/links/[linkId]` | requireAuth | 링크 삭제 |
| PATCH | `/api/profiles/me/links/reorder` | requireAuth | 링크 순서 변경 |

#### 4.2.2 소셜 링크 API

기존 `PUT /api/profiles/me` 엔드포인트를 확장하여 `socialLinks` 필드를 추가한다.

요청 body 확장:
```json
{
  "displayName": "사용자명",
  "bio": "자기소개",
  "socialLinks": [
    { "platform": "instagram", "url": "https://instagram.com/user" }
  ]
}
```

#### 4.2.3 API 요청/응답 스키마

**POST /api/profiles/me/links 요청:**
```typescript
interface CreateLinkRequest {
  title: string;      // 1-100자
  url: string;        // https:// 또는 http:// 시작
  icon?: string;      // 선택사항, 아이콘 식별자
}
```

**PUT /api/profiles/me/links/[linkId] 요청:**
```typescript
interface UpdateLinkRequest {
  title?: string;
  url?: string;
  icon?: string;
  is_active?: boolean;
}
```

**PATCH /api/profiles/me/links/reorder 요청:**
```typescript
interface ReorderLinksRequest {
  linkIds: string[];  // 새 순서의 링크 ID 배열
}
```

**링크 응답 타입:**
```typescript
interface UserLink {
  id: string;
  userId: string;
  title: string;
  url: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 컴포넌트 아키텍처

#### 4.3.1 신규 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| SocialIconRow | `src/components/profile/SocialIconRow.tsx` | 소셜 아이콘 가로 행 (lucide-react 아이콘) |
| LinkButton | `src/components/profile/LinkButton.tsx` | 개별 링크 버튼 (전체 너비, 중앙 정렬 텍스트) |
| LinkList | `src/components/profile/LinkList.tsx` | 세로 링크 스택 (LinkButton 리스트) |
| LinkEditor | `src/components/profile/LinkEditor.tsx` | 소유자 전용 링크 CRUD 편집기 |
| LinkEditModal | `src/components/profile/LinkEditModal.tsx` | 링크 추가/수정 모달 |
| SocialLinksEditor | `src/components/profile/SocialLinksEditor.tsx` | 소셜 링크 편집기 |
| CardPortfolio | `src/components/profile/CardPortfolio.tsx` | 카드 슬라이더/그리드 섹션 |

#### 4.3.2 수정 컴포넌트

| 컴포넌트 | 변경 내용 |
|----------|-----------|
| ProfileHeader.tsx | Linktree 스타일 세로 레이아웃으로 리디자인, 아바타 80px, 소셜 아이콘 통합 |
| ProfileClient.tsx | 전체 리디자인 - 세로 섹션 레이아웃, 링크/소셜 데이터 통합 |
| page.tsx | 링크 데이터 추가 fetch, 소유자 판별 로직 추가 |

#### 4.3.3 신규 유틸리티/훅

| 파일 | 경로 | 용도 |
|------|------|------|
| useLinks.ts | `src/hooks/useLinks.ts` | 링크 CRUD 커스텀 훅 (fetch, create, update, delete, reorder) |
| link-validation.ts | `src/lib/link-validation.ts` | URL 검증 유틸리티 (프로토콜 검사, XSS 방지) |

#### 4.3.4 타입 확장

`src/types/profile.ts` 확장:

```typescript
export interface UserLink {
  id: string;
  userId: string;
  title: string;
  url: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'email'
  | 'website'
  | 'github'
  | 'youtube'
  | 'twitter';
```

### 4.4 레이아웃 명세 (모바일 퍼스트)

```
+----------------------------------+
|         max-width: 680px         |
|          mx-auto px-4            |
|                                  |
|        [Avatar 80px 원형]         |
|                                  |
|        [Display Name]            |
|        [Bio - 200자 제한]         |
|                                  |
|    [IG] [FB] [LI] [Mail] [Web]   |
|        (소셜 아이콘 행)            |
|                                  |
|  +----------------------------+  |
|  |   커스텀 링크 버튼 1         |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  |   커스텀 링크 버튼 2         |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  |   커스텀 링크 버튼 3         |  |
|  +----------------------------+  |
|                                  |
|     [카드 포트폴리오 섹션]         |
|    (수평 스크롤 or 2열 그리드)     |
|                                  |
|       [QR] [공유] 버튼            |
|                                  |
+----------------------------------+
```

### 4.5 Profile Storage 확장

`src/lib/profile-storage.ts`에 추가할 함수:

| 함수 | 설명 |
|------|------|
| `getUserLinks(userId)` | 사용자 활성 링크 조회 (sort_order ASC) |
| `getMyLinks(userId)` | 내 전체 링크 조회 (비활성 포함) |
| `createUserLink(userId, data)` | 링크 생성 |
| `updateUserLink(userId, linkId, data)` | 링크 수정 (소유권 검증) |
| `deleteUserLink(userId, linkId)` | 링크 삭제 (소유권 검증) |
| `reorderUserLinks(userId, linkIds)` | 링크 순서 변경 |

## 5. Phase 구분

### Phase 1 (현재 SPEC 범위)
- 모바일 퍼스트 세로 레이아웃 리디자인
- 소셜 아이콘 행 표시 및 편집
- 커스텀 링크 CRUD (추가/수정/삭제)
- 카드 포트폴리오 섹션
- 링크/소셜 API 구현
- DB 마이그레이션 (user_links, social_links)

### Phase 2 (향후)
- 링크 편집 UX 개선 (드래그 앤 드롭 순서 변경)
- 링크 활성화/비활성화 토글
- 링크 아이콘 커스터마이징
- 링크 프리뷰 (OG 이미지 자동 fetch)

### Phase 3 (향후)
- 프로필 배경 커스터마이징
- 링크 클릭 추적 (analytics)
- 프로필 방문자 통계
- 커스텀 프로필 URL (slug)

## 6. Traceability (추적성)

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|------------|-----------|----------------|
| REQ-U01 | ProfileClient.tsx, ProfileHeader.tsx | ACC-LAYOUT-01 |
| REQ-U02 | 전체 컴포넌트 Tailwind 클래스 | ACC-DESIGN-01 |
| REQ-U03 | page.tsx generateMetadata | ACC-META-01 |
| REQ-E01 | ProfileClient.tsx | ACC-SECTION-01 |
| REQ-E02 | ProfileClient.tsx | ACC-OWNER-01 |
| REQ-E03 | LinkEditor.tsx, API routes | ACC-LINK-CRUD-01~03 |
| REQ-E04 | LinkButton.tsx | ACC-LINK-CLICK-01 |
| REQ-E05 | SocialLinksEditor.tsx, API route | ACC-SOCIAL-01 |
| REQ-S01 | page.tsx | ACC-PRIVATE-01 |
| REQ-S02 | CardPortfolio.tsx | ACC-EMPTY-CARD-01 |
| REQ-S03 | LinkList.tsx | ACC-EMPTY-LINK-01 |
| REQ-S04 | SocialIconRow.tsx | ACC-SOCIAL-ICON-01 |
| REQ-N01 | link-validation.ts | ACC-XSS-01 |
| REQ-N02 | API middleware | ACC-AUTH-01 |
| REQ-N03 | API ownership check | ACC-AUTHZ-01 |
