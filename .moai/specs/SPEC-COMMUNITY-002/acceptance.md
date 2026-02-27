---
id: SPEC-COMMUNITY-002
title: Like + Bookmark System - Acceptance Criteria
version: 1.0.0
status: draft
created: 2026-02-27
updated: 2026-02-27
---

# SPEC-COMMUNITY-002: 인수 기준 (Like + Bookmark System)

---

## 테스트 시나리오

### AC-LIKE-001: 인증된 사용자의 좋아요 토글

**Given** 인증된 사용자가 카드 상세 페이지(`/cards/[id]`)에 접근한 상태이고, 해당 카드에 좋아요를 하지 않은 상태일 때
**When** 사용자가 하트 아이콘을 클릭하면
**Then** 하트 아이콘이 즉시 filled(빨간색)으로 변경되고, 좋아요 카운트가 1 증가하며, API `POST /api/cards/[id]/like` 호출 후 서버에 좋아요가 저장된다

**Given** 인증된 사용자가 이미 좋아요한 카드의 상세 페이지에 접근한 상태일 때
**When** 사용자가 filled 하트 아이콘을 클릭하면
**Then** 하트 아이콘이 즉시 outline으로 변경되고, 좋아요 카운트가 1 감소하며, 서버에서 좋아요가 삭제된다

---

### AC-LIKE-002: 좋아요 카운트 표시

**Given** 특정 카드가 좋아요 15개를 받은 상태일 때
**When** 아무 사용자(인증/비인증 무관)가 해당 카드를 갤러리 또는 상세 페이지에서 볼 때
**Then** 하트 아이콘 옆에 "15" 카운트가 표시된다

**Given** 좋아요가 0개인 카드일 때
**When** 해당 카드를 볼 때
**Then** 카운트 영역에 "0" 또는 카운트를 표시하지 않는다 (디자인 결정에 따름)

---

### AC-LIKE-003: Optimistic UI 및 에러 롤백

**Given** 인증된 사용자가 카드에 좋아요를 하지 않은 상태이고, 네트워크가 불안정한 환경일 때
**When** 사용자가 하트 아이콘을 클릭하면
**Then** UI가 즉시 좋아요 상태로 변경된다 (Optimistic Update)

**Given** API 요청이 실패한 경우 (네트워크 오류 또는 서버 오류)
**When** 서버 응답으로 오류가 반환되면
**Then** 좋아요 상태가 이전 상태(비좋아요)로 자동 롤백되고, 사용자에게 오류 알림이 표시된다

---

### AC-LIKE-004: 비인증 사용자의 좋아요 제한

**Given** 로그인하지 않은 사용자가 카드 상세 페이지에 접근한 상태일 때
**When** 사용자가 하트 아이콘을 클릭하면
**Then** 좋아요가 동작하지 않고, 로그인 페이지(`/login`)로 이동하거나 로그인 안내 메시지가 표시된다

**Given** 로그인하지 않은 사용자가 갤러리에서 카드 썸네일을 볼 때
**When** 카드가 렌더링되면
**Then** 좋아요 카운트는 표시되지만, 하트 아이콘은 비활성 스타일(회색)로 표시된다

---

### AC-LIKE-005: Rate Limiting

**Given** 인증된 사용자가 최근 1시간 동안 이미 100회의 좋아요를 토글한 상태일 때
**When** 사용자가 추가로 좋아요를 시도하면
**Then** API가 429 (Too Many Requests) 상태 코드를 반환하고, UI에 "잠시 후 다시 시도해 주세요" 메시지가 표시된다

---

### AC-LIKE-006: 좋아요 애니메이션

**Given** 인증된 사용자가 좋아요하지 않은 카드를 보고 있을 때
**When** 사용자가 하트 아이콘을 클릭하면
**Then** 하트 아이콘이 빨간색으로 변경되면서 약 300ms 동안 scale(1.3)으로 커졌다가 scale(1.0)으로 돌아오는 burst 애니메이션이 재생된다

---

### AC-BOOKMARK-001: 인증된 사용자의 북마크 토글

**Given** 인증된 사용자가 카드 상세 페이지(`/cards/[id]`)에 접근한 상태이고, 해당 카드를 북마크하지 않은 상태일 때
**When** 사용자가 북마크 아이콘을 클릭하면
**Then** 북마크 아이콘이 즉시 filled로 변경되고, API `POST /api/cards/[id]/bookmark` 호출 후 서버에 북마크가 저장된다

**Given** 인증된 사용자가 이미 북마크한 카드의 상세 페이지에 접근한 상태일 때
**When** 사용자가 filled 북마크 아이콘을 클릭하면
**Then** 북마크 아이콘이 즉시 outline으로 변경되고, 서버에서 북마크가 삭제된다

---

### AC-BOOKMARK-002: 북마크 Optimistic UI 및 에러 롤백

**Given** 인증된 사용자가 북마크하지 않은 카드를 보고 있을 때
**When** 사용자가 북마크 아이콘을 클릭하고 서버 요청이 실패하면
**Then** 북마크 상태가 이전 상태(비북마크)로 자동 롤백되고, 사용자에게 오류 알림이 표시된다

---

### AC-BOOKMARK-003: 북마크 목록 페이지

**Given** 인증된 사용자가 3개의 카드를 북마크한 상태일 때
**When** 사용자가 `/dashboard/bookmarks` 페이지에 접근하면
**Then** 3개의 북마크된 카드가 `GalleryCardThumbnail` 컴포넌트를 사용하여 그리드 형태로 표시되고, 최신 북마크 순으로 정렬된다

**Given** 인증된 사용자가 북마크한 카드가 없을 때
**When** 사용자가 `/dashboard/bookmarks` 페이지에 접근하면
**Then** "아직 북마크한 명함이 없습니다" 안내 메시지와 갤러리로 이동하는 CTA 버튼이 표시된다

---

### AC-BOOKMARK-004: 비인증 사용자의 북마크 제한

**Given** 로그인하지 않은 사용자가 카드 상세 페이지에 접근한 상태일 때
**When** 카드 하단 영역이 렌더링되면
**Then** 북마크 아이콘이 표시되지 않는다 (LikeButton만 표시, 카운트 전용)

**Given** 로그인하지 않은 사용자가 `/dashboard/bookmarks`에 직접 접근을 시도할 때
**When** 페이지가 로드되면
**Then** 로그인 페이지(`/login`)로 리다이렉트된다

---

### AC-SEC-001: RLS 보안 정책

**Given** 인증된 사용자 A가 좋아요 API를 호출할 때
**When** user_id 필드에 다른 사용자 B의 UUID를 삽입하려고 시도하면
**Then** RLS 정책에 의해 요청이 거부된다 (`auth.uid() = user_id` 검증 실패)

**Given** 인증되지 않은 사용자가 card_bookmarks 테이블을 직접 SELECT 시도할 때
**When** Supabase anon 키로 쿼리를 실행하면
**Then** RLS 정책에 의해 결과가 빈 배열로 반환된다 (본인 데이터만 접근 가능)

---

### AC-DB-001: 데이터베이스 무결성

**Given** 특정 카드가 삭제(DELETE)될 때
**When** card_requests 레코드가 삭제되면
**Then** 해당 카드와 연관된 card_likes 및 card_bookmarks 레코드가 CASCADE로 자동 삭제된다

**Given** 특정 사용자 계정이 삭제될 때
**When** auth.users 레코드가 삭제되면
**Then** 해당 사용자의 모든 card_likes 및 card_bookmarks 레코드가 CASCADE로 자동 삭제된다

---

### AC-UI-001: GalleryCardThumbnail 좋아요 통합

**Given** 갤러리 페이지에서 카드 썸네일이 렌더링될 때
**When** 카드 썸네일이 표시되면
**Then** 하단 gradient overlay 우측에 작은 하트 아이콘과 좋아요 카운트가 표시되고, 기존 status badge(하단 좌측)와 겹치지 않는다

**Given** 갤러리 썸네일의 LikeButton을 클릭할 때
**When** Link 컴포넌트의 기본 네비게이션과 LikeButton 클릭이 충돌하면
**Then** LikeButton 클릭은 `e.preventDefault()` + `e.stopPropagation()`으로 카드 네비게이션을 방지하고, 좋아요만 토글된다

---

### AC-UI-002: 카드 상세 페이지 통합

**Given** 카드 상세 페이지(`/cards/[id]`)가 렌더링될 때
**When** 페이지가 완전히 로드되면
**Then** 카드 하단에 LikeButton(좋아요 수 포함)과 BookmarkButton이 "명함 저장" 버튼과 함께 표시되고, 좌측에 좋아요/북마크, 우측에 명함 저장 버튼이 배치된다

---

### AC-UI-003: 프로필 페이지 총 좋아요

**Given** 사용자가 3개의 카드를 보유하고, 각각 5, 10, 3개의 좋아요를 받았을 때
**When** 해당 사용자의 프로필 페이지(`/profile/[id]`)에 접근하면
**Then** 프로필 영역에 "총 좋아요 18"이 표시된다

---

### AC-UI-004: 대시보드 북마크 네비게이션

**Given** 인증된 사용자가 대시보드 영역(`/dashboard/*`)에 접근한 상태일 때
**When** 네비게이션/사이드바가 렌더링되면
**Then** "북마크" 링크가 북마크 아이콘과 함께 표시되고, 클릭 시 `/dashboard/bookmarks`로 이동한다

---

### AC-EDGE-001: 더블 클릭 방어

**Given** 인증된 사용자가 좋아요 버튼을 빠르게 연속 클릭할 때
**When** 300ms 이내에 2회 이상 클릭하면
**Then** 첫 번째 클릭만 처리되고, 후속 클릭은 무시된다 (debounce 또는 loading state 기반 방어)

---

### AC-EDGE-002: 삭제된 카드 처리

**Given** 사용자가 이전에 북마크한 카드가 관리자에 의해 삭제된 상태일 때
**When** 사용자가 `/dashboard/bookmarks` 페이지에 접근하면
**Then** 삭제된 카드는 목록에 표시되지 않는다 (CASCADE 삭제로 북마크 레코드 자체가 제거됨)

---

### AC-EDGE-003: 동시 좋아요 정합성

**Given** 여러 사용자가 동시에 같은 카드에 좋아요를 추가할 때
**When** 모든 API 요청이 처리된 후
**Then** `card_requests.like_count`가 `card_likes` 테이블의 실제 레코드 수와 일치한다 (COUNT 서브쿼리 방식)

---

## 성능 기준

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| 좋아요 토글 API | P95 < 300ms | API Route 응답 시간 측정 |
| 북마크 토글 API | P95 < 200ms | API Route 응답 시간 측정 |
| 북마크 목록 API | P95 < 500ms (20개 기준) | API Route 응답 시간 측정 |
| Optimistic UI 반영 | < 50ms | 클릭 이벤트 ~ UI 변경 시간 |
| LikeButton 번들 크기 | < 3KB (gzipped) | Webpack bundle analyzer |
| 갤러리 FCP 영향 | < 100ms 추가 | Lighthouse FCP 비교 |

---

## Quality Gate 기준

### 코드 품질

| 항목 | 기준 |
|------|------|
| TypeScript | strict 모드, 타입 에러 0개 |
| ESLint | 린트 에러 0개 |
| 테스트 커버리지 | 신규 코드 85% 이상 |
| API Route 테스트 | 모든 엔드포인트에 대한 단위 테스트 |
| 컴포넌트 테스트 | LikeButton, BookmarkButton 렌더링 + 인터랙션 테스트 |

### 보안 검증

| 항목 | 기준 |
|------|------|
| RLS 정책 | card_likes, card_bookmarks 테이블 RLS 활성화 확인 |
| 인증 검증 | 모든 POST API에 requireAuth 적용 확인 |
| 입력 검증 | card_id UUID 형식 검증 확인 |
| Rate Limiting | 시간당 100회 제한 동작 확인 |
| CASCADE 삭제 | 카드/사용자 삭제 시 관련 데이터 자동 삭제 확인 |

### 접근성 검증

| 항목 | 기준 |
|------|------|
| ARIA | 좋아요/북마크 버튼에 `aria-label`, `aria-pressed` 속성 |
| 키보드 | Tab으로 접근, Enter/Space로 토글 |
| 터치 영역 | 최소 44px x 44px |
| 색상 대비 | WCAG AA 기준 충족 |

---

## Definition of Done

- [ ] `card_likes`, `card_bookmarks` 테이블이 생성되고 RLS 정책이 적용됨
- [ ] 좋아요 토글 API가 정상 동작하고 like_count가 동기화됨
- [ ] 북마크 토글 API가 정상 동작함
- [ ] 북마크 목록 API가 페이지네이션과 함께 정상 동작함
- [ ] LikeButton이 Optimistic UI, 애니메이션, 비인증 처리를 포함하여 정상 동작함
- [ ] BookmarkButton이 Optimistic UI, 비인증 시 비표시를 포함하여 정상 동작함
- [ ] GalleryCardThumbnail에 LikeButton이 통합되어 기존 레이아웃을 유지함
- [ ] 카드 상세 페이지에 LikeButton + BookmarkButton이 통합됨
- [ ] 프로필 페이지에 총 좋아요 수가 표시됨
- [ ] `/dashboard/bookmarks` 페이지가 구현됨
- [ ] 대시보드 네비게이션에 "북마크" 링크가 추가됨
- [ ] Rate Limiting이 시간당 100회로 동작함
- [ ] 모든 신규 코드에 대한 테스트가 작성됨 (커버리지 85%+)
- [ ] TypeScript strict 모드에서 타입 에러 0개
- [ ] ESLint 에러 0개
- [ ] 접근성 요구사항 충족 (ARIA, 키보드, 터치 영역)

---

## Traceability

| 인수 기준 | 관련 요구사항 | 구현 태스크 |
|----------|-------------|-----------|
| AC-LIKE-001 | REQ-LIKE-001, REQ-API-001 | 태스크 2, 5, 7 |
| AC-LIKE-002 | REQ-LIKE-002, REQ-API-002 | 태스크 2, 5 |
| AC-LIKE-003 | REQ-LIKE-003 | 태스크 5, 7 |
| AC-LIKE-004 | REQ-LIKE-004 | 태스크 5 |
| AC-LIKE-005 | REQ-LIKE-005 | 태스크 2 |
| AC-LIKE-006 | REQ-LIKE-006 | 태스크 5 |
| AC-BOOKMARK-001 | REQ-BOOKMARK-001, REQ-API-003 | 태스크 3, 6, 7 |
| AC-BOOKMARK-002 | REQ-BOOKMARK-003 | 태스크 6, 7 |
| AC-BOOKMARK-003 | REQ-BOOKMARK-004, REQ-API-005 | 태스크 4, 13 |
| AC-BOOKMARK-004 | REQ-BOOKMARK-005 | 태스크 6, 13 |
| AC-SEC-001 | REQ-DB-004, REQ-BOOKMARK-002 | 태스크 1 |
| AC-DB-001 | REQ-DB-001, REQ-DB-002 | 태스크 1 |
| AC-UI-001 | REQ-UI-003 | 태스크 8 |
| AC-UI-002 | REQ-UI-004 | 태스크 9, 10 |
| AC-UI-003 | REQ-UI-005 | 태스크 12 |
| AC-UI-004 | REQ-UI-006 | 태스크 14 |
| AC-EDGE-001 | REQ-LIKE-001 | 태스크 5, 7 |
| AC-EDGE-002 | REQ-DB-001, REQ-DB-002 | 태스크 1, 13 |
| AC-EDGE-003 | REQ-DB-003 | 태스크 2 |
