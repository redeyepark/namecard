# SPEC-COMMUNITY-001: 구현 계획

---
spec_id: SPEC-COMMUNITY-001
version: 1.0.0
created: 2026-02-27
---

## 1. 기술 스택

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | Next.js | 16.1.6 | App Router 기반 |
| UI | React | 19.2.3 | Server + Client Components |
| DB | Supabase | 2.97.0 | PostgreSQL + Auth + Storage |
| 배포 | Cloudflare Workers | - | 엣지 런타임 |
| **신규** | react-intersection-observer | ^9.15.0 | 무한 스크롤 IntersectionObserver hook |

### react-intersection-observer 선택 이유

- 번들 크기: ~1.5KB (gzipped) - 경량
- React 19 호환 확인
- `useInView` hook 제공으로 간결한 코드
- SSR-safe (서버에서는 no-op, 클라이언트에서만 동작)
- Cloudflare Workers 엣지 런타임과 호환 (클라이언트 전용)

---

## 2. 구현 태스크 분해

### Milestone 1: 데이터베이스 기반 [Priority High]

데이터베이스 스키마 변경과 마이그레이션은 모든 후속 작업의 기반이 된다.

**Task 1.1: user_profiles 테이블 생성 및 RLS 설정**
- `user_profiles` 테이블 CREATE 문 작성 및 실행
- RLS 활성화 및 4개 정책 설정 (SELECT, INSERT, UPDATE, DELETE)
- 관련 요구사항: R-DB-001, R-DB-006

**Task 1.2: card_requests 테이블 확장**
- `user_id` UUID 컬럼 추가 (FK -> auth.users)
- `like_count` INTEGER DEFAULT 0 컬럼 추가
- 기존 데이터의 `created_by` email -> `user_id` backfill 쿼리 실행
- 관련 요구사항: R-DB-002, R-DB-003, R-DB-005

**Task 1.3: 인덱스 생성**
- `idx_card_requests_feed` (is_public, status, submitted_at DESC)
- `idx_card_requests_user` (user_id)
- `idx_card_requests_theme_feed` (is_public, status, theme)
- `idx_card_requests_like_count` (like_count DESC)
- 관련 요구사항: R-DB-004

### Milestone 2: 프로필 시스템 [Priority High]

사용자 프로필 CRUD 및 자동 생성 로직 구현.

**Task 2.1: 타입 정의**
- `src/types/profile.ts` 신규 생성
- `UserProfile`, `ProfilePageData` 인터페이스 정의
- `src/types/card.ts`에 `FeedCardData`, `FeedResponse` 추가
- 관련 요구사항: spec.md 5.1절

**Task 2.2: 프로필 데이터 레이어**
- `src/lib/profile-storage.ts` 신규 생성
- `getProfile(userId)`: user_profiles + 카드 수 + 좋아요 합계 + 테마 분포 조회
- `createProfile(userId, data)`: 프로필 생성 (upsert)
- `updateProfile(userId, data)`: 프로필 수정
- `getUserCards(userId, page, limit)`: 사용자 공개 카드 목록
- `ensureProfile(userId, email)`: 로그인 시 프로필 자동 생성 (없으면 생성)
- 관련 요구사항: R-PROFILE-005

**Task 2.3: 프로필 API 라우트**
- `src/app/api/profiles/[id]/route.ts` - GET: 프로필 조회 (공개)
- `src/app/api/profiles/me/route.ts` - PUT: 프로필 수정 (인증 필요, requireAuth)
- `src/app/api/profiles/[id]/cards/route.ts` - GET: 사용자 카드 목록 (공개)
- 입력값 검증: display_name 1-100자, bio 0-200자
- 관련 요구사항: R-API-002, R-API-003, R-API-004

**Task 2.4: 프로필 페이지 UI**
- `src/app/profile/[id]/page.tsx` - Server Component (OG metadata 포함)
- `src/app/profile/[id]/ProfileClient.tsx` - 클라이언트 렌더링
- `src/components/profile/ProfileHeader.tsx` - 아바타, 이름, bio, 통계
- `src/components/profile/ThemeDistribution.tsx` - 테마 분포 뱃지
- `src/middleware.ts` 수정: `/profile` 경로 공개 접근 허용
- 관련 요구사항: R-PROFILE-001, R-PROFILE-002, R-PROFILE-003, R-PROFILE-004, R-PROFILE-006, R-PROFILE-007

**Task 2.5: 프로필 자동 생성 통합**
- `src/components/auth/AuthProvider.tsx` 수정
- `onAuthStateChange` SIGNED_IN 이벤트에서 `ensureProfile()` 호출
- `fetchUserInfo()` 내에서 프로필 존재 여부 확인 후 자동 생성
- 관련 요구사항: R-PROFILE-005

### Milestone 3: 피드 시스템 [Priority High]

커뮤니티 피드 구현 (무한 스크롤, 필터, 정렬).

**Task 3.1: 피드 데이터 레이어**
- `src/lib/storage.ts`에 `getFeedCards()` 함수 추가
- Cursor-based pagination: `submitted_at` 기반 커서
- 테마 필터, 정렬(newest/popular) 지원
- `FeedCardData` 반환 (user_id -> user_profiles JOIN으로 사용자 정보 포함)
- 관련 요구사항: R-FEED-001, R-FEED-006

**Task 3.2: 피드 API 라우트**
- `src/app/api/feed/route.ts` 신규 생성
- Query params: cursor, limit, theme, sort
- cursor 기반 응답: { cards, nextCursor, hasMore }
- 관련 요구사항: R-API-001

**Task 3.3: 피드 UI 컴포넌트**
- `src/components/feed/FeedContainer.tsx` - 무한 스크롤 컨테이너
  - `react-intersection-observer`의 `useInView` hook 사용
  - 로딩 상태, 에러 상태, "더 이상 없음" 상태 처리
- `src/components/feed/FeedFilters.tsx` - 테마 탭 + 정렬 토글
  - 가로 스크롤 가능한 탭 UI (모바일 대응)
  - "최신순" / "인기순" 토글 버튼
- `src/components/feed/FeedCardThumbnail.tsx` - 확장 카드 썸네일
  - `GalleryCardThumbnail` 기반, 사용자 정보 오버레이 + 좋아요 수 추가
  - 사용자 클릭 시 프로필 이동 (이벤트 버블링 방지)
- 관련 요구사항: R-FEED-002, R-FEED-003, R-FEED-004, R-THUMB-001, R-THUMB-002, R-THUMB-003

**Task 3.4: 갤러리 페이지 통합**
- `src/app/cards/page.tsx` 수정: 피드 기본 뷰
- `src/app/cards/GalleryClient.tsx` 수정: FeedContainer 통합, 이벤트 뷰 토글 유지
- 기존 이벤트별 그룹 뷰는 "이벤트별 보기" 옵션으로 전환 가능
- 관련 요구사항: R-FEED-001, R-FEED-005

### Milestone 4: 프로필 설정 [Priority Medium]

대시보드 설정 페이지에 프로필 편집 기능 추가.

**Task 4.1: 프로필 편집 폼**
- `src/components/profile/ProfileEditForm.tsx` 신규 생성
  - display_name 입력 (1-100자)
  - bio textarea (0-200자, 글자수 카운터)
  - 아바타 업로드 (Supabase Storage `avatars` 버킷)
  - 공개/비공개 토글
  - 저장 버튼 + 로딩 상태
- 관련 요구사항: R-SETTINGS-001, R-SETTINGS-002

**Task 4.2: 설정 페이지 통합**
- `src/app/dashboard/settings/page.tsx` 수정
  - 프로필 편집 섹션을 기존 비밀번호 변경 섹션 위에 추가
  - 프로필 데이터 로딩 및 저장 로직 통합
- 관련 요구사항: R-SETTINGS-001

**Task 4.3: 프로필 미리보기 (Optional)**
- 편집 중 실시간 미리보기 카드 표시
- 관련 요구사항: R-SETTINGS-003

### Milestone 5: 통합 및 하위 호환성 [Priority Medium]

기존 기능과의 호환성 보장 및 최종 통합.

**Task 5.1: GalleryCardThumbnail 확장**
- 기존 `GalleryCardThumbnail`에 optional props 추가: `userId`, `userDisplayName`, `userAvatarUrl`, `likeCount`
- Props가 없으면 기존 동작 유지 (하위 호환)
- 관련 요구사항: R-THUMB-001, R-THUMB-003

**Task 5.2: created_by -> user_id 점진적 전환**
- 새 데이터는 `user_id`와 `created_by` 모두 저장
- 기존 소유권 검증 로직에 `user_id` fallback 추가
- `created_by` 컬럼은 유지하되, 향후 deprecation 예정

**Task 5.3: 의존성 설치**
- `npm install react-intersection-observer@^9.15.0`

---

## 3. 파일별 변경 상세

### 신규 파일 (14개)

| 파일 경로 | 설명 |
|-----------|------|
| `src/types/profile.ts` | UserProfile, ProfilePageData 타입 정의 |
| `src/lib/profile-storage.ts` | 프로필 CRUD + ensureProfile 함수 |
| `src/app/profile/[id]/page.tsx` | 프로필 Server Component (OG metadata) |
| `src/app/profile/[id]/ProfileClient.tsx` | 프로필 클라이언트 렌더링 |
| `src/app/api/feed/route.ts` | 커뮤니티 피드 API |
| `src/app/api/profiles/[id]/route.ts` | 프로필 조회 API |
| `src/app/api/profiles/me/route.ts` | 프로필 수정 API (PUT) |
| `src/app/api/profiles/[id]/cards/route.ts` | 사용자 카드 목록 API |
| `src/components/feed/FeedContainer.tsx` | 무한 스크롤 피드 컨테이너 |
| `src/components/feed/FeedFilters.tsx` | 테마 필터 + 정렬 토글 |
| `src/components/feed/FeedCardThumbnail.tsx` | 피드용 확장 카드 썸네일 |
| `src/components/profile/ProfileHeader.tsx` | 프로필 헤더 (아바타, 통계) |
| `src/components/profile/ProfileEditForm.tsx` | 프로필 편집 폼 |
| `src/components/profile/ThemeDistribution.tsx` | 테마 분포 시각화 |

### 수정 파일 (7개)

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `src/types/card.ts` | `FeedCardData`, `FeedResponse` 인터페이스 추가 |
| `src/lib/storage.ts` | `getFeedCards()` 함수 추가 (cursor pagination + JOIN) |
| `src/app/cards/page.tsx` | 피드 기본 뷰로 전환, 서버 데이터 페칭 로직 변경 |
| `src/app/cards/GalleryClient.tsx` | FeedContainer 통합, 이벤트 뷰 옵션 유지 |
| `src/app/dashboard/settings/page.tsx` | 프로필 편집 섹션 추가 (비밀번호 변경 위) |
| `src/components/auth/AuthProvider.tsx` | ensureProfile() 호출 추가 |
| `src/middleware.ts` | `/profile` 경로 공개 접근 허용 추가 |

---

## 4. 아키텍처 설계 방향

### 데이터 흐름

```
[사용자 로그인]
    |
    v
AuthProvider.onAuthStateChange(SIGNED_IN)
    |
    v
ensureProfile(userId, email)  ← user_profiles 없으면 자동 생성
    |
    v
[프로필 존재 확인 완료]
```

```
[/cards 피드 페이지]
    |
    v
Server Component: 초기 12개 카드 SSR
    |
    v
FeedContainer (Client)
    ├── FeedFilters: 테마 탭 + 정렬 토글
    ├── FeedCardThumbnail[]: 카드 그리드
    └── InView sentinel → GET /api/feed?cursor=...&theme=...&sort=...
                              ↓
                         다음 12개 카드 append
```

```
[/profile/[id] 프로필 페이지]
    |
    v
Server Component: SSR (프로필 + 카드 데이터)
    |
    v
ProfileClient
    ├── ProfileHeader: 아바타, 이름, bio, 통계
    ├── ThemeDistribution: 테마 분포 뱃지
    └── GalleryCardThumbnail[]: 공개 카드 그리드
```

### cursor-based pagination 설계

```
GET /api/feed?cursor=2026-02-27T12:00:00Z&limit=12&theme=all&sort=newest

SQL 조건:
  WHERE is_public = true
    AND status IN ('confirmed', 'delivered')
    AND submitted_at < :cursor  -- cursor 이전 데이터
  ORDER BY submitted_at DESC
  LIMIT :limit + 1              -- hasMore 판단용 1개 추가 조회

응답:
{
  cards: [...12개],
  nextCursor: cards[11].submittedAt,  -- 마지막 카드의 타임스탬프
  hasMore: 조회 결과가 limit+1 개이면 true
}
```

### 인기순(popular) 정렬 시 cursor 전략

```
GET /api/feed?sort=popular&cursor=5_abc123&limit=12

cursor 형식: "{like_count}_{card_id}" (like_count 동점 시 id로 구분)

SQL 조건:
  WHERE is_public = true
    AND status IN ('confirmed', 'delivered')
    AND (like_count < :cursorLikeCount
         OR (like_count = :cursorLikeCount AND id < :cursorId))
  ORDER BY like_count DESC, id DESC
  LIMIT :limit + 1
```

---

## 5. 리스크 분석

| 리스크 | 발생 확률 | 영향도 | 대응 방안 |
|--------|-----------|--------|-----------|
| user_id backfill 시 email 불일치 (auth.users에 없는 email) | Medium | Medium | NULL 허용, created_by email fallback 유지 |
| Supabase RLS 정책과 service_role 키 충돌 | Low | High | API Routes에서는 service_role 사용, RLS는 anon 키 클라이언트 접근 제어용 |
| 무한 스크롤 성능 (대량 카드 렌더링) | Medium | Medium | React.memo + 가상화 검토 (virtuoso), 이미지 lazy loading |
| like_count 동시성 문제 (동시 업데이트) | Low | Low | Phase 2에서 likes 테이블 도입 시 DB 트리거로 해결 |
| 기존 /cards 페이지 SEO 영향 | Medium | Medium | Server Component 초기 렌더링으로 SSR 유지, 기존 URL 구조 보존 |
| Cloudflare Workers 엣지 런타임에서 Supabase JOIN 성능 | Low | Medium | 프로필 데이터 캐싱, 별도 쿼리로 분리 가능 |

---

## 6. 다음 단계

이 SPEC의 구현이 완료되면 다음 확장이 가능하다:

- **Phase 2**: 좋아요(Like) 기능 - `likes` 테이블 도입, 사용자별 좋아요 토글, 실시간 카운트 업데이트
- **Phase 3**: 팔로우(Follow) 시스템 - 사용자 간 팔로우/팔로워, 팔로잉 피드
- **Phase 4**: 댓글(Comment) 시스템 - 카드별 댓글 스레드
- **Phase 5**: 알림(Notification) 시스템 - 좋아요/댓글/팔로우 알림

구현 시작: `/moai:2-run SPEC-COMMUNITY-001`
