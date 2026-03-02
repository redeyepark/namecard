---
id: SPEC-COMMUNITY-003
title: Question & Thought Sharing - Implementation Plan
version: "2.0.0"
status: completed
created: "2026-03-02"
updated: "2026-03-02"
completed: "2026-03-02"
tags: [SPEC-COMMUNITY-003]
---

# SPEC-COMMUNITY-003: 질문/생각 공유 - 구현 계획

## 1. 구현 전략

### 1.1 핵심 원칙

- **기존 패턴 재사용**: 커뮤니티 피드(`FeedContainer`, `getFeedCards`), 좋아요(`useLike`, `card_likes` API), 무한 스크롤(`react-intersection-observer`) 패턴을 최대한 재사용
- **점진적 구현**: DB 마이그레이션 -> API 라우트 -> 타입/훅 -> 컴포넌트 -> 페이지 통합 -> 테스트 순서로 구현
- **Cloudflare Workers 호환**: 모든 서버 사이드 로직은 Edge Runtime 호환성 확보 (native `fetch` 기반, Node.js 전용 모듈 미사용)
- **서버/클라이언트 컴포넌트 분리**: 페이지는 Server Component로 초기 데이터 fetch, 인터랙티브 요소는 `'use client'` Client Component로 분리

### 1.2 기술 스택

| 구분 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 | 기존 프로젝트 동일 |
| UI | React | 19.2.3 | 기존 프로젝트 동일 |
| 언어 | TypeScript | 5.x | strict 모드 |
| 스타일링 | Tailwind CSS | 4.x | 기존 디자인 시스템 준수 |
| 상태 관리 | Zustand | 5.0.11 | 기존 프로젝트 동일 (필요시) |
| DB/인증 | Supabase (supabase-js) | 2.97.0 | service_role 클라이언트 |
| 인증 | @supabase/ssr | 0.8.0 | `requireAuth` 패턴 재사용 |
| 무한 스크롤 | react-intersection-observer | 기존 설치 버전 | 기존 피드 패턴 재사용 |
| 배포 | Cloudflare Workers | - | Edge Runtime 호환 필수 |
| 테스트 | Vitest | 4.0.18 | 단위 테스트 |
| 테스트 유틸 | @testing-library/react | 16.3.2 | 컴포넌트 테스트 |

### 1.3 기존 코드 재사용 매핑

| 기존 패턴 | 소스 파일 | 재사용 대상 | 적용 위치 |
|-----------|----------|------------|----------|
| `requireAuth` 인증 검증 | `src/lib/auth-utils.ts` | 인증 미들웨어 패턴 | 모든 POST/DELETE API |
| `AuthError` 에러 처리 | `src/lib/auth-utils.ts` | try-catch + AuthError 패턴 | 모든 API 라우트 |
| `useLike` 낙관적 업데이트 | `src/hooks/useLike.ts` | 토글 + 롤백 패턴 | `useThoughtLike` 훅 |
| `getFeedCards` 커서 페이지네이션 | `src/app/api/feed/route.ts` | 커서 기반 목록 조회 | `/api/questions`, `/api/questions/[id]/thoughts` |
| `card_likes` DB rate limiting | `src/app/api/cards/[id]/like/route.ts` | DB 기반 시간 윈도우 rate limit | 질문/답변 작성 API |
| `FeedContainer` 무한 스크롤 UI | `src/components/feed/` | IntersectionObserver 패턴 | `QuestionFeed`, `ThoughtList` |
| `getSupabase` 서버 클라이언트 | `src/lib/supabase.ts` | service_role 클라이언트 | `question-storage.ts` |
| UUID 검증 regex | `src/app/api/cards/[id]/like/route.ts` | UUID 형식 검증 | 모든 API [id] 파라미터 |

---

## 2. 구현 Phase 및 마일스톤

### Phase 1: DB 마이그레이션 (Primary Goal)

**목표**: 3개 신규 테이블 + RLS 정책 + 트리거 생성

**구현 항목:**

- [ ] `supabase/migrations/011_add_questions_thoughts.sql` 마이그레이션 파일 작성
  - `community_questions` 테이블: UUID PK, author_id FK, content TEXT, hashtags TEXT[], thought_count, is_active, timestamps
  - `community_thoughts` 테이블: UUID PK, question_id FK (CASCADE), author_id FK, content TEXT, like_count, is_active, timestamps
  - `thought_likes` 테이블: (user_id, thought_id) 복합 PK, created_at
  - 인덱스: author, created_at DESC, (is_active, created_at DESC), GIN(hashtags), (question_id, created_at DESC), thought_id
  - RLS 정책: 공개 읽기, 인증 사용자 쓰기, 작성자만 수정/삭제
  - `update_question_thought_count()` 트리거 함수 (INSERT/DELETE on community_thoughts)
  - `update_thought_like_count()` 트리거 함수 (INSERT/DELETE on thought_likes)

**의존성**: 없음 (독립 실행 가능)
**영향 파일 수**: 1개 신규

---

### Phase 2: API 라우트 (Primary Goal)

**목표**: 질문/답변/좋아요 REST API 엔드포인트 구현

**구현 항목:**

- [ ] `src/lib/question-storage.ts` - 데이터 접근 계층
  - `getQuestions(options)`: 커서 기반 페이지네이션, 정렬(latest/popular), 태그 필터, 작성자 JOIN
  - `getQuestionById(id, userId?)`: 질문 상세 + 작성자 JOIN + isOwner 판정
  - `createQuestion(authorId, content, hashtags)`: 질문 생성 + HTML strip
  - `deleteQuestion(id, userId)`: 작성자 검증 후 삭제 (CASCADE로 답변 자동 삭제)
  - `getThoughts(questionId, options, userId?)`: 답변 목록 + 작성자 JOIN + isLiked/isOwner
  - `createThought(questionId, authorId, content)`: 답변 생성 + HTML strip
  - `deleteThought(thoughtId, userId)`: 작성자 검증 후 삭제
  - `toggleThoughtLike(thoughtId, userId)`: 좋아요 토글 (기존 `card_likes` 패턴 참고)
  - `stripHtml(text)`: HTML 태그 제거 유틸리티 (XSS 방지)
- [ ] `src/app/api/questions/route.ts` - GET (질문 목록), POST (질문 생성)
  - GET: cursor, limit(기본 20, 최대 50), sort(latest/popular), tag 쿼리 파라미터
  - POST: requireAuth + content(10-500자) + hashtags(최대 5개, 각 20자) 검증 + rate limit(1건/60초)
- [ ] `src/app/api/questions/[id]/route.ts` - GET (질문 상세), DELETE (질문 삭제)
  - GET: UUID 검증 + 질문 상세 조회
  - DELETE: requireAuth + 작성자 검증
- [ ] `src/app/api/questions/[id]/thoughts/route.ts` - GET (답변 목록), POST (답변 생성)
  - GET: cursor, limit(기본 20, 최대 50), sort(latest/popular) 쿼리 파라미터
  - POST: requireAuth + content(5-1000자) 검증 + rate limit(같은 질문에 1건/30초)
- [ ] `src/app/api/questions/[id]/thoughts/[thoughtId]/route.ts` - DELETE (답변 삭제)
  - DELETE: requireAuth + 작성자 검증
- [ ] `src/app/api/thoughts/[id]/like/route.ts` - POST (좋아요), DELETE (좋아요 해제)
  - POST/DELETE: requireAuth + rate limit(100건/1시간) + 낙관적 업데이트 지원 응답

**Rate Limiting 전략:**
- 질문 작성: `community_questions` 테이블에서 author_id + created_at >= (now - 60s) 카운트 (DB 기반, Cloudflare Workers 호환)
- 답변 작성: `community_thoughts` 테이블에서 author_id + question_id + created_at >= (now - 30s) 카운트
- 좋아요: `thought_likes` 테이블에서 user_id + created_at >= (now - 1hour) 카운트

**의존성**: Phase 1 (DB 테이블 존재해야 함)
**영향 파일 수**: 6개 신규

---

### Phase 3: 타입 정의 및 커스텀 훅 (Secondary Goal)

**목표**: TypeScript 타입 + 클라이언트 훅(CRUD, 무한 스크롤, 낙관적 업데이트) 구현

**구현 항목:**

- [ ] `src/types/question.ts` - 타입 정의
  - `Question`: 기본 질문 엔티티
  - `QuestionWithAuthor`: 작성자 정보 JOIN 결과
  - `Thought`: 기본 답변 엔티티
  - `ThoughtWithAuthor`: 작성자 정보 + isLiked + isOwner JOIN 결과
  - `CreateQuestionRequest`, `CreateThoughtRequest`: API 요청 타입
  - `QuestionResponse`, `ThoughtResponse`: API 응답 타입
  - `QuestionsListResponse`, `ThoughtsListResponse`: 페이지네이션 응답 타입 (items + nextCursor + hasMore)
- [ ] `src/hooks/useQuestions.ts` - 질문 CRUD + 무한 스크롤
  - `useQuestions(sort, tag)`: 질문 목록 fetch + 무한 스크롤 (IntersectionObserver)
  - `useCreateQuestion()`: 질문 생성 + 목록 캐시 갱신
  - `useDeleteQuestion()`: 질문 삭제 + 목록에서 제거
- [ ] `src/hooks/useThoughts.ts` - 답변 CRUD + 무한 스크롤
  - `useThoughts(questionId, sort)`: 답변 목록 fetch + 무한 스크롤
  - `useCreateThought()`: 답변 생성 + 목록 캐시 갱신 + thought_count 증가 반영
  - `useDeleteThought()`: 답변 삭제 + 목록에서 제거 + thought_count 감소 반영
- [ ] `src/hooks/useThoughtLike.ts` - 답변 좋아요 토글 (낙관적 업데이트)
  - `useLike` 훅과 동일 패턴: 즉시 UI 반영 -> 서버 동기화 -> 에러 시 롤백
  - `useThoughtLike(thoughtId, initialLiked, initialCount)` 인터페이스

**의존성**: Phase 2 (API 엔드포인트 존재해야 함)
**영향 파일 수**: 4개 신규

---

### Phase 4: UI 컴포넌트 (Secondary Goal)

**목표**: 11개 커뮤니티 컴포넌트 구현 (하위 -> 상위 순서)

**구현 항목 (하위 컴포넌트 우선):**

- [ ] `src/components/community/HashtagChip.tsx` - 해시태그 칩
  - Props: tag, onClick, isActive
  - 클릭 시 필터링 콜백 호출
  - 디자인: 0px border-radius, 딥 네이비/오프 화이트 색상
- [ ] `src/components/community/ThoughtLikeButton.tsx` - 답변 좋아요 버튼
  - `useThoughtLike` 훅 사용
  - 하트 아이콘 + 카운트 표시
  - 기존 `LikeButton` 디자인 패턴 재사용
- [ ] `src/components/community/QuestionFilters.tsx` - 정렬/태그 필터
  - 정렬: 최신순/인기순 토글
  - 활성 태그 필터 표시 + 해제 기능
- [ ] `src/components/community/ThoughtCard.tsx` - 개별 답변 카드
  - 작성자 아바타 + display_name + 상대 시간
  - 답변 내용 + 좋아요 버튼
  - isOwner인 경우 삭제 버튼 표시
- [ ] `src/components/community/ThoughtForm.tsx` - 답변 작성 폼
  - 인증 상태에 따라 입력란 또는 "로그인 후 참여" 안내 표시
  - 5-1000자 검증 + 글자 수 카운터
  - 제출 시 `useCreateThought` 호출
- [ ] `src/components/community/ThoughtList.tsx` - 답변 목록 (무한 스크롤)
  - `useThoughts` 훅 사용
  - 빈 상태 UI ("아직 답변이 없습니다...")
  - IntersectionObserver 기반 무한 스크롤
- [ ] `src/components/community/QuestionCard.tsx` - 질문 카드
  - 작성자 아바타 + display_name + 상대 시간
  - 질문 내용 미리보기 (최대 2-3줄)
  - 해시태그 칩 목록
  - 답변 수(thought_count) 표시
  - 카드 클릭 시 `/community/questions/[id]`로 이동
- [ ] `src/components/community/QuestionForm.tsx` - 질문 작성 폼 (모달)
  - 인증 상태에 따라 폼 또는 "로그인 후 참여" 안내
  - 10-500자 검증 + 글자 수 카운터
  - 해시태그 입력(최대 5개, 각 20자) + 칩 UI
  - 제출 시 `useCreateQuestion` 호출
- [ ] `src/components/community/QuestionDetail.tsx` - 질문 상세 뷰
  - 질문 전문 + 작성자 정보 + 해시태그
  - isOwner인 경우 삭제 버튼 (확인 대화상자 포함)
  - 하단에 ThoughtList + ThoughtForm 배치
- [ ] `src/components/community/QuestionFeed.tsx` - 질문 목록 컨테이너
  - `useQuestions` 훅 사용
  - QuestionFilters + QuestionCard 목록
  - 빈 상태 UI ("아직 질문이 없습니다...")
  - IntersectionObserver 기반 무한 스크롤
  - FAB "질문하기" 버튼 (인증 상태에 따라 표시)
- [ ] `src/components/community/CommunityNav.tsx` - 커뮤니티 탭 네비게이션
  - 질문 탭 / 커피챗 탭 (커피챗은 향후 확장)
  - 현재 활성 탭 하이라이트

**의존성**: Phase 3 (타입 + 훅 존재해야 함)
**영향 파일 수**: 11개 신규

---

### Phase 5: 페이지 통합 (Final Goal)

**목표**: 라우트 페이지 생성 + 기존 시스템 통합

**구현 항목:**

- [ ] `src/app/community/questions/page.tsx` - 질문 피드 페이지
  - Server Component: 초기 메타데이터 설정
  - CommunityNav + QuestionFeed 조합
- [ ] `src/app/community/questions/[id]/page.tsx` - 질문 상세 페이지
  - Server Component: 질문 데이터 초기 fetch + SEO 메타데이터
  - QuestionDetail 렌더링
  - 뒤로가기 네비게이션
- [ ] 기존 `/gallery` 페이지 수정 - CommunityNav 통합
  - 갤러리 레이아웃에 CommunityNav 배치 (카드 피드 / 질문 탭 전환)
- [ ] (Optional) `/profile/[id]` 페이지 수정 - 활동 통계 표시
  - "질문 N개, 답변 N개" 활동 카운트 추가

**의존성**: Phase 4 (모든 컴포넌트 존재해야 함)
**영향 파일 수**: 2개 신규 + 1-2개 기존 파일 수정

---

### Phase 6: 테스트 (Final Goal)

**목표**: 핵심 기능 단위 테스트 + 통합 테스트

**구현 항목:**

- [ ] `src/lib/__tests__/question-storage.test.ts` - 데이터 접근 계층 테스트
  - CRUD 함수 테스트 (모킹)
  - HTML strip 유틸리티 테스트
  - 커서 페이지네이션 로직 테스트
- [ ] `src/hooks/__tests__/useThoughtLike.test.ts` - 좋아요 훅 테스트
  - 낙관적 업데이트 동작 검증
  - 에러 시 롤백 검증
- [ ] `src/components/community/__tests__/QuestionCard.test.tsx` - 질문 카드 테스트
  - 작성자 정보 렌더링
  - 해시태그 표시
  - 상대 시간 표시
- [ ] `src/components/community/__tests__/ThoughtForm.test.tsx` - 답변 폼 테스트
  - 인증/미인증 상태별 렌더링
  - 유효성 검증 동작

**의존성**: Phase 5 (모든 기능 구현 완료)
**영향 파일 수**: 4개 신규

---

## 3. 아키텍처 설계 방향

### 3.1 디렉토리 구조

```
src/
├── app/
│   ├── api/
│   │   ├── questions/
│   │   │   ├── route.ts                  # GET 질문 목록, POST 질문 생성
│   │   │   └── [id]/
│   │   │       ├── route.ts              # GET 질문 상세, DELETE 질문 삭제
│   │   │       └── thoughts/
│   │   │           ├── route.ts          # GET 답변 목록, POST 답변 생성
│   │   │           └── [thoughtId]/
│   │   │               └── route.ts      # DELETE 답변 삭제
│   │   └── thoughts/
│   │       └── [id]/
│   │           └── like/
│   │               └── route.ts          # POST 좋아요, DELETE 좋아요 해제
│   └── community/
│       └── questions/
│           ├── page.tsx                  # 질문 피드 페이지
│           └── [id]/
│               └── page.tsx              # 질문 상세 페이지
├── components/
│   └── community/
│       ├── CommunityNav.tsx              # 커뮤니티 탭 네비게이션
│       ├── QuestionFeed.tsx              # 질문 목록 (무한 스크롤)
│       ├── QuestionCard.tsx              # 질문 카드
│       ├── QuestionForm.tsx              # 질문 작성 폼 (모달)
│       ├── QuestionDetail.tsx            # 질문 상세 뷰
│       ├── QuestionFilters.tsx           # 정렬/태그 필터
│       ├── HashtagChip.tsx               # 해시태그 칩
│       ├── ThoughtList.tsx               # 답변 목록 (무한 스크롤)
│       ├── ThoughtCard.tsx               # 개별 답변 카드
│       ├── ThoughtForm.tsx               # 답변 작성 폼
│       └── ThoughtLikeButton.tsx         # 답변 좋아요 버튼
├── hooks/
│   ├── useQuestions.ts                   # 질문 CRUD + 무한 스크롤
│   ├── useThoughts.ts                   # 답변 CRUD + 무한 스크롤
│   └── useThoughtLike.ts                # 답변 좋아요 (낙관적 업데이트)
├── types/
│   └── question.ts                       # 질문/답변 타입 정의
└── lib/
    └── question-storage.ts               # 데이터 접근 계층

supabase/
└── migrations/
    └── 011_add_questions_thoughts.sql    # DB 마이그레이션
```

### 3.2 핵심 데이터 흐름

**질문 생성 흐름:**
```
[사용자] QuestionForm ('use client')
  -> POST /api/questions (requireAuth + validation + rate limit + HTML strip)
  -> question-storage.createQuestion()
  -> Supabase DB (community_questions INSERT)
  -> 응답 반환
  -> useQuestions: 목록 캐시에 새 질문 추가 (클라이언트 낙관적 업데이트)
```

**답변 생성 흐름:**
```
[사용자] ThoughtForm ('use client')
  -> POST /api/questions/[id]/thoughts (requireAuth + validation + rate limit + HTML strip)
  -> question-storage.createThought()
  -> Supabase DB (community_thoughts INSERT)
  -> DB 트리거: community_questions.thought_count += 1
  -> 응답 반환
  -> useThoughts: 목록 캐시에 새 답변 추가
```

**답변 좋아요 흐름:**
```
[사용자] ThoughtLikeButton ('use client')
  -> useThoughtLike: 낙관적 업데이트 (liked/count 즉시 반영)
  -> POST /api/thoughts/[id]/like (requireAuth + rate limit)
  -> question-storage.toggleThoughtLike()
  -> Supabase DB (thought_likes INSERT/DELETE)
  -> DB 트리거: community_thoughts.like_count +/- 1
  -> 응답으로 실제 liked/likeCount 동기화
  -> 에러 시 롤백
```

**커서 기반 페이지네이션 흐름:**
```
[사용자] 스크롤 하단 도달 (IntersectionObserver)
  -> useQuestions/useThoughts: fetchNextPage(cursor)
  -> GET /api/questions?cursor={lastId}&limit=20&sort=latest
  -> question-storage.getQuestions(): SELECT ... WHERE created_at < cursor ORDER BY created_at DESC LIMIT 21
  -> 21개 조회하여 20개 반환 + hasMore 판정 (1개 초과분으로 다음 페이지 존재 확인)
```

### 3.3 Rate Limiting 구현 전략

Cloudflare Workers 환경에서는 인메모리 상태가 요청 간 유지되지 않으므로, **DB 기반 rate limiting**을 사용합니다. 이는 기존 `card_likes` API의 rate limit 패턴과 동일합니다.

```
// 기존 패턴 (src/app/api/cards/[id]/like/route.ts)
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const { count } = await supabase
  .from('card_likes')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', oneHourAgo);
```

동일 패턴을 질문/답변 작성에 적용:
- 질문: `community_questions` WHERE author_id = user.id AND created_at >= (now - 60s) COUNT >= 1 -> 429
- 답변: `community_thoughts` WHERE author_id = user.id AND question_id = qId AND created_at >= (now - 30s) COUNT >= 1 -> 429
- 좋아요: `thought_likes` WHERE user_id = user.id AND created_at >= (now - 1hr) COUNT > 100 -> 429

---

## 4. 리스크 분석 및 대응

### 4.1 기술적 리스크

| # | 리스크 | 영향도 | 발생 가능성 | 대응 전략 |
|---|--------|-------|-----------|----------|
| T1 | Supabase RLS 정책과 service_role 클라이언트 충돌 | 높음 | 낮음 | `getSupabase()` (service_role)로 RLS 우회 - 기존 검증된 패턴. API 레벨에서 직접 권한 검증 |
| T2 | `thought_count`/`like_count` 트리거 동시성 이슈 | 중간 | 낮음 | PostgreSQL 트리거는 트랜잭션 내 실행으로 동시성 안전. GREATEST(count - 1, 0)으로 음수 방지. 극단적 경우 주기적 COUNT(*) 정합성 검사 |
| T3 | Cloudflare Workers 메모리 제한으로 인메모리 rate limiting 불가 | 높음 | 확실 | DB 기반 rate limiting 사용 (기존 card_likes 패턴). 인메모리 방식 완전 배제 |
| T4 | 해시태그 GIN 인덱스 성능 저하 (대량 데이터) | 낮음 | 낮음 | Phase 1 규모에서는 문제 없음. 데이터 증가 시 해시태그 별도 테이블 정규화 고려 |
| T5 | `ON DELETE CASCADE`로 질문 삭제 시 대량 답변 삭제 지연 | 중간 | 낮음 | A04 가정(질문당 답변 100개 이내)에서 성능 문제 없음. UI에서 삭제 중 로딩 표시 |
| T6 | Next.js 16 App Router의 `params` Promise 패턴 호환 | 낮음 | 낮음 | 기존 프로젝트에서 `{ params }: { params: Promise<{ id: string }> }` 패턴 사용 확인 완료 |

### 4.2 UX 리스크

| # | 리스크 | 영향도 | 발생 가능성 | 대응 전략 |
|---|--------|-------|-----------|----------|
| U1 | 초기 콘텐츠 부족 (빈 피드) | 높음 | 높음 | 관리자가 시드 질문 5-10개 작성. 빈 상태 UI에 "첫 번째 질문을 올려보세요!" 참여 유도 문구 |
| U2 | 저품질 질문/답변 | 중간 | 중간 | 최소 글자 수 제한 (질문 10자, 답변 5자). 향후 Phase 2에서 신고 기능 추가 |
| U3 | 낙관적 업데이트와 서버 상태 불일치 | 낮음 | 낮음 | 서버 응답으로 실제 상태 동기화. 네트워크 에러 시 롤백 + 사용자 알림 |
| U4 | 모바일에서 긴 질문 내용 가독성 | 중간 | 중간 | 피드에서 3줄 미리보기 + "더보기" 패턴. 상세 페이지에서 전문 표시 |

### 4.3 보안 리스크

| # | 리스크 | 영향도 | 발생 가능성 | 대응 전략 |
|---|--------|-------|-----------|----------|
| S1 | XSS 공격 (HTML/script 삽입) | 높음 | 중간 | 서버 사이드 HTML 태그 제거(strip). React의 기본 XSS 방지(JSX 이스케이핑) 활용 |
| S2 | Rate limit 우회 (다중 계정) | 낮음 | 낮음 | 사용자별 rate limit으로 1차 방어. 향후 IP 기반 제한 추가 가능 |
| S3 | 타인 콘텐츠 삭제 시도 | 높음 | 중간 | API 레벨에서 author_id === user.id 검증. RLS 정책으로 2차 방어 |

---

## 5. Phase 간 의존성 다이어그램

```
Phase 1 (DB 마이그레이션)
  |
  v
Phase 2 (API 라우트 + Storage)  -----> Phase 6 (테스트)
  |                                         ^
  v                                         |
Phase 3 (타입 + 훅)                         |
  |                                         |
  v                                         |
Phase 4 (UI 컴포넌트)                       |
  |                                         |
  v                                         |
Phase 5 (페이지 통합) ----------------------+
```

- Phase 1은 독립 실행 가능 (Supabase SQL Editor에서 직접 실행)
- Phase 2는 Phase 1 완료 후 시작
- Phase 3~5는 순차 의존
- Phase 6은 Phase 5 완료 후 시작하되, 단위 테스트는 Phase 2 이후 병행 가능

---

## 6. 총 영향 범위 요약

| 카테고리 | Phase | 신규 파일 | 수정 파일 |
|---------|-------|----------|----------|
| DB 마이그레이션 | 1 | 1 | 0 |
| 데이터 접근 계층 | 2 | 1 | 0 |
| API 라우트 | 2 | 5 | 0 |
| 타입 정의 | 3 | 1 | 0 |
| 커스텀 훅 | 3 | 3 | 0 |
| UI 컴포넌트 | 4 | 11 | 0 |
| 페이지 | 5 | 2 | 1-2 |
| 테스트 | 6 | 4 | 0 |
| **합계** | - | **28** | **1-2** |
