---
id: SPEC-COMMUNITY-002
title: Like + Bookmark System - Implementation Plan
version: 1.0.0
status: draft
created: 2026-02-27
updated: 2026-02-27
---

# SPEC-COMMUNITY-002: 구현 계획 (Like + Bookmark System)

## 의존성

- **선행 조건**: SPEC-COMMUNITY-001 (User Profiles + Feed Enhancement) 구현 완료
- **신규 외부 의존성**: 없음 (기존 스택 내에서 구현)

---

## 마일스톤

### Primary Goal: 데이터베이스 및 API 레이어

좋아요/북마크 시스템의 백엔드 인프라를 구축한다.

**태스크:**

1. **DB 마이그레이션 작성** (`supabase/migrations/008_add_likes_bookmarks.sql`)
   - `card_likes` 테이블 생성 (복합 PK: user_id + card_id)
   - `card_bookmarks` 테이블 생성 (복합 PK: user_id + card_id)
   - 인덱스 생성 (card_id, user_id)
   - RLS 정책 설정 (좋아요: 공개 읽기, 북마크: 본인만 읽기)

2. **좋아요 API Route 구현** (`src/app/api/cards/[id]/like/route.ts`)
   - `POST`: 좋아요 토글 (INSERT/DELETE + like_count 동기화)
   - `GET`: 좋아요 상태 및 카운트 조회
   - Rate limiting 로직 (시간당 100회)
   - UUID 형식 검증
   - 카드 존재 여부 확인 (404)

3. **북마크 API Route 구현** (`src/app/api/cards/[id]/bookmark/route.ts`)
   - `POST`: 북마크 토글 (INSERT/DELETE)
   - `GET`: 북마크 상태 조회
   - `requireAuth` 인증 필수

4. **북마크 목록 API 구현** (`src/app/api/bookmarks/route.ts`)
   - `GET`: 페이지네이션 기반 북마크 카드 목록 조회
   - card_bookmarks JOIN card_requests
   - GalleryCardData 형식으로 반환

### Secondary Goal: UI 컴포넌트 개발

좋아요/북마크 인터랙션 컴포넌트를 개발한다.

**태스크:**

5. **LikeButton 컴포넌트 개발** (`src/components/social/LikeButton.tsx`)
   - SVG 하트 아이콘 (outline/filled 토글)
   - Optimistic UI 업데이트 패턴 구현
   - 좋아요 burst 애니메이션 (CSS keyframes)
   - 비인증 사용자 처리 (로그인 안내)
   - size variant: 'sm' (썸네일용), 'md' (상세 페이지용)

6. **BookmarkButton 컴포넌트 개발** (`src/components/social/BookmarkButton.tsx`)
   - SVG 북마크 아이콘 (outline/filled 토글)
   - Optimistic UI 업데이트 패턴 구현
   - 비인증 사용자: 컴포넌트 비렌더링

7. **Optimistic UI 커스텀 훅 개발** (`src/hooks/useLike.ts`, `src/hooks/useBookmark.ts`)
   - `useLike(cardId, initialLiked, initialCount)`: 좋아요 상태 관리 + API 호출 + 롤백
   - `useBookmark(cardId, initialBookmarked)`: 북마크 상태 관리 + API 호출 + 롤백

### Tertiary Goal: 기존 페이지 통합

새로운 컴포넌트를 기존 페이지에 통합한다.

**태스크:**

8. **GalleryCardThumbnail 수정** (`src/components/gallery/GalleryCardThumbnail.tsx`)
   - 하단 gradient overlay 우측에 LikeButton(size="sm") 추가
   - status badge(bottom-left)와 like button(bottom-right) 레이아웃 조정
   - GalleryCardData 타입에 `likeCount` 필드 추가

9. **PublicCardView 수정** (`src/app/cards/[id]/PublicCardView.tsx`)
   - 카드 하단에 LikeButton(size="md") + BookmarkButton 추가
   - flex 레이아웃: 좌측 좋아요/북마크, 우측 명함 저장 버튼

10. **카드 상세 페이지 서버 데이터 통합** (`src/app/cards/[id]/page.tsx`)
    - 서버 컴포넌트에서 like_count를 쿼리하여 PublicCardView에 전달
    - 초기 liked/bookmarked 상태는 클라이언트에서 API 호출

11. **갤러리 페이지 데이터 통합** (`src/app/cards/page.tsx` 또는 관련 데이터 페칭)
    - 갤러리 카드 데이터에 like_count 포함하여 전달

12. **프로필 페이지 총 좋아요 표시** (`src/app/profile/[id]/page.tsx`)
    - 해당 사용자의 전체 카드 like_count 합계 표시
    - SQL: `SELECT SUM(like_count) FROM card_requests WHERE user_id = $1`

### Optional Goal: 북마크 관리 페이지 + 대시보드 네비게이션

사용자 대시보드에 북마크 관리 기능을 추가한다.

**태스크:**

13. **북마크 페이지 개발** (`src/app/dashboard/bookmarks/page.tsx`)
    - 인증 확인 (미인증 시 로그인 리다이렉트)
    - GET /api/bookmarks 호출
    - GalleryCardThumbnail 재사용한 그리드 표시
    - 빈 상태 UI (북마크 없음 안내)
    - 무한 스크롤 또는 페이지네이션

14. **대시보드 네비게이션 수정**
    - 사이드바/네비게이션에 "북마크" 링크 추가
    - 북마크 아이콘 + "북마크" 텍스트

---

## 수정 대상 파일 목록

### 신규 파일

| 파일 경로 | 설명 |
|----------|------|
| `supabase/migrations/008_add_likes_bookmarks.sql` | 좋아요/북마크 테이블 마이그레이션 |
| `src/app/api/cards/[id]/like/route.ts` | 좋아요 토글/조회 API |
| `src/app/api/cards/[id]/bookmark/route.ts` | 북마크 토글/조회 API |
| `src/app/api/bookmarks/route.ts` | 북마크 목록 API |
| `src/components/social/LikeButton.tsx` | 좋아요 버튼 컴포넌트 |
| `src/components/social/BookmarkButton.tsx` | 북마크 버튼 컴포넌트 |
| `src/hooks/useLike.ts` | 좋아요 Optimistic UI 커스텀 훅 |
| `src/hooks/useBookmark.ts` | 북마크 Optimistic UI 커스텀 훅 |
| `src/app/dashboard/bookmarks/page.tsx` | 북마크 관리 페이지 |

### 수정 파일

| 파일 경로 | 변경 내용 |
|----------|----------|
| `src/types/card.ts` | `GalleryCardData`에 `likeCount` 필드 추가, `PublicCardData`에 `likeCount` 필드 추가 |
| `src/components/gallery/GalleryCardThumbnail.tsx` | LikeButton 통합, 레이아웃 조정 |
| `src/app/cards/[id]/PublicCardView.tsx` | LikeButton + BookmarkButton 통합 |
| `src/app/cards/[id]/page.tsx` | like_count 데이터 전달 |
| `src/lib/storage.ts` | 갤러리/공개카드 쿼리에 like_count 포함 |
| `src/app/profile/[id]/page.tsx` | 총 좋아요 수 표시 (SPEC-COMMUNITY-001에서 생성된 페이지) |
| `src/app/dashboard/layout.tsx` 또는 네비게이션 컴포넌트 | "북마크" 링크 추가 |

---

## 기술적 접근 방식

### Optimistic UI 패턴

좋아요/북마크 토글의 즉각적인 UI 반응을 위해 Optimistic UI 패턴을 적용한다.

```
사용자 클릭 -> UI 즉시 업데이트 -> API 요청 전송 ->
  성공: 상태 유지
  실패: 이전 상태로 롤백 + 에러 표시
```

React의 `useState`와 `useCallback`을 활용하여 구현하며, API 요청은 `fetch`로 처리한다. 별도의 상태 관리 라이브러리(SWR, React Query 등)는 추가하지 않고, 기존 프로젝트의 직접 fetch 패턴을 따른다.

### Rate Limiting 구현 방식

Cloudflare Workers 환경에서의 제약을 고려하여, 애플리케이션 레벨 rate limiting을 구현한다.

- **접근 방식**: Supabase 쿼리 기반 (최근 1시간 내 좋아요 INSERT 수 카운트)
- **쿼리**: `SELECT COUNT(*) FROM card_likes WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`
- **임계값**: 100회 초과 시 429 응답
- **장점**: 외부 의존성 없음, Cloudflare Workers 호환
- **단점**: DB 쿼리 추가 부하 (인덱스로 완화)

### like_count 동기화 전략

DB trigger 대신 애플리케이션 레벨에서 동기화한다.

- **이유**: Supabase 무료/Pro 티어에서 trigger 관리 복잡성 회피
- **방식**: API Route에서 INSERT/DELETE 후 즉시 `UPDATE card_requests SET like_count = (SELECT COUNT(*) FROM card_likes WHERE card_id = $1) WHERE id = $1`
- **일관성**: 단일 트랜잭션 내에서 처리하여 정합성 보장

---

## 리스크 분석

### R-01: Optimistic UI 롤백 시 UX 저하

- **위험도**: 중간
- **설명**: 네트워크 오류로 API 요청 실패 시 좋아요/북마크 상태가 깜빡이며 롤백될 수 있음
- **대응**: 롤백 시 subtle한 toast 알림으로 사용자에게 실패 사실 고지. 짧은 debounce (300ms)로 빠른 연속 클릭 방지

### R-02: like_count 동기화 불일치

- **위험도**: 낮음
- **설명**: 동시 좋아요 요청 시 COUNT 쿼리 결과가 일시적으로 부정확할 수 있음
- **대응**: `COUNT(*)` 서브쿼리 방식으로 매번 실제 수 계산. 대규모 동시 접속이 아닌 소규모 서비스이므로 실질적 영향 미미

### R-03: SPEC-COMMUNITY-001 미완성 시 차단

- **위험도**: 높음
- **설명**: user_profiles 테이블, card_requests.user_id, card_requests.like_count 컬럼이 없으면 구현 불가
- **대응**: SPEC-COMMUNITY-001의 DB 마이그레이션만 우선 적용하여 차단 해제 가능. 프로필 페이지 통합(태스크 12)은 SPEC-COMMUNITY-001 완료 후 진행

### R-04: Cloudflare Workers에서의 Rate Limiting 정확도

- **위험도**: 낮음
- **설명**: Supabase 쿼리 기반 rate limiting은 정확하지만 DB 부하 발생
- **대응**: card_likes 테이블에 `(user_id, created_at)` 복합 인덱스 추가로 쿼리 성능 보장. 소규모 서비스 특성상 부하 미미

### R-05: 갤러리 썸네일 성능 영향

- **위험도**: 중간
- **설명**: GalleryCardThumbnail에 LikeButton 추가 시, 각 카드마다 개별 API 호출이 발생하면 N+1 문제
- **대응**: 갤러리 페이지 로드 시 서버에서 like_count를 카드 데이터에 포함하여 전달. 개별 liked 상태는 클라이언트에서 배치 조회 또는 lazy 로딩

---

## 구현 순서

```
[Phase 1: 백엔드]
태스크 1 (DB 마이그레이션)
  -> 태스크 2 (좋아요 API)
  -> 태스크 3 (북마크 API)
  -> 태스크 4 (북마크 목록 API)

[Phase 2: 프론트엔드 컴포넌트]
태스크 5 (LikeButton) + 태스크 6 (BookmarkButton) (병렬)
  -> 태스크 7 (커스텀 훅)

[Phase 3: 통합]
태스크 8 (갤러리 통합) + 태스크 9 (상세 페이지 통합) (병렬)
  -> 태스크 10 (서버 데이터) + 태스크 11 (갤러리 데이터)
  -> 태스크 12 (프로필 페이지)

[Phase 4: 부가 기능]
태스크 13 (북마크 페이지)
  -> 태스크 14 (네비게이션)
```

---

## Traceability

| 태스크 | 관련 요구사항 |
|--------|-------------|
| 태스크 1 | REQ-DB-001, REQ-DB-002, REQ-DB-004 |
| 태스크 2 | REQ-API-001, REQ-API-002, REQ-DB-003, REQ-LIKE-005 |
| 태스크 3 | REQ-API-003, REQ-API-004 |
| 태스크 4 | REQ-API-005 |
| 태스크 5 | REQ-LIKE-001~006, REQ-UI-001 |
| 태스크 6 | REQ-BOOKMARK-001~003, REQ-BOOKMARK-005, REQ-UI-002 |
| 태스크 7 | REQ-LIKE-003, REQ-BOOKMARK-003 |
| 태스크 8 | REQ-UI-003 |
| 태스크 9 | REQ-UI-004 |
| 태스크 10 | REQ-API-002 |
| 태스크 11 | REQ-LIKE-002 |
| 태스크 12 | REQ-UI-005 |
| 태스크 13 | REQ-BOOKMARK-004 |
| 태스크 14 | REQ-UI-006 |
