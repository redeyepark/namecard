---
id: SPEC-COMMUNITY-004
title: Coffee Chat Request & Accept - Implementation Plan
version: "2.0.0"
status: completed
created: "2026-03-02"
updated: "2026-03-02"
completed: "2026-03-02"
tags: [SPEC-COMMUNITY-004]
---

# SPEC-COMMUNITY-004: 커피챗 신청/수락 - 구현 계획

## 1. 구현 전략

### 1.1 핵심 원칙

- **상태 머신 중심 설계**: 커피챗의 5가지 상태(pending/accepted/declined/cancelled/completed)와 유효한 전환을 서버 사이드에서 엄격하게 검증
- **기존 패턴 재사용**: 인증(requireAuth), 페이지네이션(커서 기반), 프로필 조회(user_profiles JOIN) 패턴 재사용
- **SPEC-COMMUNITY-003 의존**: CommunityNav 컴포넌트를 공유하므로 SPEC-COMMUNITY-003 이후에 구현 권장
- **DB 레벨 안전장치**: CHECK 제약조건(자기 자신 방지), Partial Unique Index(중복 방지)로 애플리케이션 로직 실패 시에도 데이터 무결성 보장

### 1.2 기술적 접근

- **서버 사이드 상태 전환 검증**: 모든 상태 변경은 `VALID_TRANSITIONS` 매트릭스에 의해 서버에서 검증
- **Partial Index로 중복 방지**: `idx_coffee_chat_active_pair` 인덱스가 동일 사용자 쌍 간 중복 활성 요청을 DB 레벨에서 차단
- **이메일 조건부 공개**: `accepted` 상태에서만 API 응답에 이메일 포함 (서버 사이드 필터링)
- **양방향 중복 검사**: `LEAST/GREATEST` 함수를 활용하여 A->B, B->A 양방향 동일 쌍으로 인식

### 1.3 기술 스택 (Production Stable)

| 구분 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 | 기존 프로젝트 동일 |
| UI | React | 19.2.3 | 기존 프로젝트 동일 |
| 언어 | TypeScript | 5.x | strict: true |
| 스타일링 | Tailwind CSS | 4.x | 기존 디자인 시스템 |
| 상태 관리 | Zustand | 5.0.11 | persist middleware |
| 인증 | Supabase Auth (@supabase/ssr) | 0.8.0 | requireAuth 패턴 |
| DB | Supabase PostgreSQL (supabase-js) | 2.97.0 | RLS + Partial Index |
| 테스트 | Vitest | 4.0.18 | 단위 테스트 |
| 테스트 유틸 | Testing Library | 16.3.2 | 컴포넌트 테스트 |
| 배포 | Cloudflare Workers | - | 엣지 배포 |

> 모든 라이브러리는 production stable 버전이며, beta/alpha 버전은 사용하지 않음

## 2. 구현 Phase 분해

### Phase 1: DB 마이그레이션 (Primary Goal)

**목표**: 커피챗 테이블 생성 및 데이터 무결성 보장

| 작업 | 파일 | 설명 |
|------|------|------|
| 테이블 생성 | `supabase/migrations/012_add_coffee_chat.sql` | `coffee_chat_requests` 테이블 |
| CHECK 제약조건 | (동일 파일) | `chk_status`, `chk_meeting_preference`, `chk_not_self` |
| 인덱스 생성 | (동일 파일) | `idx_coffee_chat_requester`, `idx_coffee_chat_receiver`, `idx_coffee_chat_created` |
| Partial Unique Index | (동일 파일) | `idx_coffee_chat_active_pair` (LEAST/GREATEST 기반 양방향 중복 방지) |
| RLS 정책 | (동일 파일) | SELECT(관계자만), INSERT(인증+본인), UPDATE(관계자만) |
| updated_at 트리거 | (동일 파일) | `moddatetime` 확장 또는 수동 트리거 |

**신규 파일**: 1개
**수정 파일**: 0개
**의존성**: 없음 (독립 실행 가능)

**핵심 검증 사항**:
- `chk_not_self`: `requester_id != receiver_id` CHECK 제약조건이 DB 레벨에서 자기 자신 신청 차단
- Partial Unique Index: `WHERE status IN ('pending', 'accepted')` 조건으로 활성 요청만 중복 검사
- `LEAST/GREATEST` 패턴: A->B와 B->A를 동일 쌍으로 인식하여 양방향 중복 방지

### Phase 2: API 라우트 (Primary Goal)

**목표**: REST API 엔드포인트 및 비즈니스 로직 구현

**의존성**: Phase 1 (DB 테이블 필수)

| 작업 | 파일 | 설명 |
|------|------|------|
| 데이터 접근 계층 | `src/lib/coffee-chat-storage.ts` | Supabase 쿼리 함수 (CRUD + 상태 전환) |
| 커피챗 목록/생성 API | `src/app/api/coffee-chat/route.ts` | GET (내 목록), POST (신청) |
| 커피챗 상세 API | `src/app/api/coffee-chat/[id]/route.ts` | GET (상세, 관계자만) |
| 상태 변경 API | `src/app/api/coffee-chat/[id]/respond/route.ts` | PATCH (수락/거절/취소/완료) |
| 미확인 수 API | `src/app/api/coffee-chat/pending-count/route.ts` | GET (배지용 카운트) |
| 회원 탐색 API | `src/app/api/members/discoverable/route.ts` | GET (공개 프로필 목록) |

**신규 파일**: 6개
**수정 파일**: 0개

**핵심 구현 사항**:

1. **상태 전환 검증 (coffee-chat-storage.ts)**:
   ```
   API 수신 -> requireAuth() -> getCoffeeChatById()
   -> 관계자 검증 (requester_id OR receiver_id)
   -> VALID_TRANSITIONS[currentStatus] 조회
   -> allowedBy 확인 (requester/receiver/both)
   -> 유효: DB UPDATE / 무효: 400 반환
   ```

2. **Rate Limiting (POST /api/coffee-chat)**:
   - 24시간 내 해당 사용자의 `coffee_chat_requests` 카운트 조회
   - 5건 초과 시 429 Too Many Requests 반환
   - DB 쿼리 기반 (별도 Redis 불필요)

3. **이메일 조건부 공개 (coffee-chat-storage.ts)**:
   - `accepted` 상태: `auth.users` 테이블에서 이메일 JOIN
   - 그 외 상태: 이메일 필드를 응답에서 제외 (서버 사이드 필터링)
   - 절대 클라이언트에서 필터링하지 않음

4. **입력 검증**:
   - message: 20-500자, HTML 태그 strip (정규식 `/<[^>]*>/g` 제거)
   - receiverId: UUID 형식 검증
   - meetingPreference: `online` | `offline` | `any` enum 검증
   - self-request: `receiverId === currentUserId` 차단

### Phase 3: 타입 & 훅 (Secondary Goal)

**목표**: TypeScript 타입 정의 및 클라이언트 데이터 패칭 훅 구현

**의존성**: Phase 2 (API 엔드포인트 필수)

| 작업 | 파일 | 설명 |
|------|------|------|
| 타입 정의 | `src/types/coffee-chat.ts` | CoffeeChat, CoffeeChatWithUsers, DiscoverableMember, VALID_TRANSITIONS |
| 커피챗 CRUD 훅 | `src/hooks/useCoffeeChat.ts` | 목록 조회, 신청, 상태 변경, 상세 조회 |
| 미확인 수 훅 | `src/hooks/useCoffeeChatCount.ts` | 60초 폴링 기반 pending 카운트 |

**신규 파일**: 3개
**수정 파일**: 0개

**훅 설계**:

- `useCoffeeChat`: fetch 기반 CRUD + SWR 패턴 (수동 revalidate)
  - `fetchMyChats(tab, status)` - 내 커피챗 목록
  - `createChat(data)` - 신청
  - `respondToChat(id, action, message?)` - 상태 변경
  - `fetchChatDetail(id)` - 상세 조회
  - `fetchDiscoverableMembers(cursor, search?)` - 회원 탐색

- `useCoffeeChatCount`: `setInterval` 60초 폴링 + 페이지 포커스 시 즉시 재조회
  - `count` - 미확인 요청 수
  - `refresh()` - 수동 새로고침

### Phase 4: 컴포넌트 (Secondary Goal)

**목표**: UI 컴포넌트 구현 (하위 -> 상위 순서)

**의존성**: Phase 3 (타입 + 훅 필수)

| 순서 | 컴포넌트 | 파일 | 의존 컴포넌트 |
|------|----------|------|-------------|
| 1 | CoffeeChatStatusBadge | `src/components/coffee-chat/CoffeeChatStatusBadge.tsx` | 없음 (기본 배지) |
| 2 | CoffeeChatBadge | `src/components/coffee-chat/CoffeeChatBadge.tsx` | useCoffeeChatCount |
| 3 | CoffeeChatButton | `src/components/coffee-chat/CoffeeChatButton.tsx` | 없음 (프로필용 진입점) |
| 4 | CoffeeChatActions | `src/components/coffee-chat/CoffeeChatActions.tsx` | CoffeeChatStatusBadge |
| 5 | CoffeeChatRequestModal | `src/components/coffee-chat/CoffeeChatRequestModal.tsx` | useCoffeeChat |
| 6 | MemberCard | `src/components/coffee-chat/MemberCard.tsx` | CoffeeChatButton |
| 7 | CoffeeChatCard | `src/components/coffee-chat/CoffeeChatCard.tsx` | CoffeeChatStatusBadge, CoffeeChatActions |
| 8 | CoffeeChatDetail | `src/components/coffee-chat/CoffeeChatDetail.tsx` | CoffeeChatStatusBadge, CoffeeChatActions |
| 9 | MemberDiscoverGrid | `src/components/coffee-chat/MemberDiscoverGrid.tsx` | MemberCard (무한 스크롤) |
| 10 | CoffeeChatList | `src/components/coffee-chat/CoffeeChatList.tsx` | CoffeeChatCard (탭 분류) |

**신규 파일**: 10개
**수정 파일**: 0개

**디자인 시스템 적용 규칙**:
- 배경색: `#020912` (딥 네이비) / `#fcfcfc` (오프 화이트)
- border-radius: 0px (날카로운 모서리)
- 폰트: Figtree (제목) / Anonymous Pro (본문)
- 상태 배지 색상: spec.md 4.6절 색상 매핑 준수
- 무한 스크롤: `react-intersection-observer` 기존 패턴 재사용

### Phase 5: 페이지 & 프로필 통합 (Secondary Goal)

**목표**: 라우트 페이지 생성 및 기존 시스템 통합

**의존성**: Phase 4 (컴포넌트 필수), SPEC-COMMUNITY-003 (CommunityNav 필수)

| 작업 | 파일 | 유형 | 설명 |
|------|------|------|------|
| 회원 탐색 페이지 | `src/app/community/coffee-chat/page.tsx` | 신규 | MemberDiscoverGrid 조립 |
| 내 커피챗 페이지 | `src/app/community/coffee-chat/my/page.tsx` | 신규 | CoffeeChatList + CoffeeChatDetail 조립 |
| CommunityNav 탭 추가 | `src/components/community/CommunityNav.tsx` | 수정 | "커피챗" 탭 + CoffeeChatBadge |
| 프로필 버튼 통합 | `src/components/profile/ProfileClient.tsx` (또는 해당 파일) | 수정 | CoffeeChatButton 배치 |

**신규 파일**: 2개
**수정 파일**: 2-3개

**통합 포인트**:

1. **CommunityNav 통합**:
   - "커피챗" 탭 추가 (SPEC-COMMUNITY-003에서 생성한 탭 목록에 append)
   - `CoffeeChatBadge` 컴포넌트로 미확인 요청 수 표시
   - 60초 폴링 + 페이지 포커스 시 즉시 갱신

2. **프로필 페이지 통합**:
   - `/profile/[id]` 페이지의 소셜 아이콘 행 옆 또는 링크 섹션 아래에 `CoffeeChatButton` 배치
   - 조건부 렌더링: 본인 프로필(비표시), 비공개 프로필(비표시), 미인증(로그인 안내)
   - 기존 pending/accepted 요청이 있으면 "이미 요청됨" + 해당 요청 보기 링크

### Phase 6: 테스트 (Final Goal)

**목표**: 핵심 비즈니스 로직 단위 테스트

**의존성**: Phase 2-5 (전체 구현 완료)

| 작업 | 파일 | 설명 |
|------|------|------|
| 상태 전환 테스트 | `src/__tests__/coffee-chat-transitions.test.ts` | VALID_TRANSITIONS 매트릭스 전체 검증 |
| API 입력 검증 테스트 | `src/__tests__/coffee-chat-api.test.ts` | 메시지 길이, HTML strip, self-request |
| 이메일 공개 로직 테스트 | `src/__tests__/coffee-chat-email.test.ts` | 상태별 이메일 노출/비노출 검증 |
| 컴포넌트 테스트 | `src/__tests__/coffee-chat-components.test.tsx` | 상태별 액션 버튼 렌더링 검증 |

**신규 파일**: 4개
**수정 파일**: 0개

## 3. Phase 간 의존성 다이어그램

```
Phase 1: DB Migration
    |
    v
Phase 2: API Routes -----> Phase 3: Types & Hooks
                                |
                                v
                           Phase 4: Components
                                |
                                v
                           Phase 5: Pages & Integration
                                |          |
                                |    (SPEC-COMMUNITY-003
                                |     CommunityNav 필요)
                                v
                           Phase 6: Testing
```

**병렬 가능 구간**:
- Phase 1 + Phase 3(타입 정의만): 타입 정의는 DB 스키마 확정 후 바로 작성 가능
- Phase 4 내 컴포넌트들: 의존 관계 없는 컴포넌트는 병렬 구현 가능 (StatusBadge, Badge, Button)

## 4. 아키텍처 설계 방향

### 4.1 디렉토리 구조

```
src/
+-- app/
|   +-- api/
|   |   +-- coffee-chat/
|   |   |   +-- route.ts                     # GET (목록), POST (신청)
|   |   |   +-- [id]/
|   |   |   |   +-- route.ts                 # GET (상세)
|   |   |   |   +-- respond/
|   |   |   |       +-- route.ts             # PATCH (상태 변경)
|   |   |   +-- pending-count/
|   |   |       +-- route.ts                 # GET (미확인 수)
|   |   +-- members/
|   |       +-- discoverable/
|   |           +-- route.ts                 # GET (공개 회원 목록)
|   +-- community/
|       +-- coffee-chat/
|           +-- page.tsx                     # 회원 탐색 페이지
|           +-- my/
|               +-- page.tsx                 # 내 커피챗 관리 페이지
+-- components/
|   +-- coffee-chat/
|       +-- MemberDiscoverGrid.tsx           # 회원 탐색 그리드 (무한 스크롤)
|       +-- MemberCard.tsx                   # 회원 카드
|       +-- CoffeeChatRequestModal.tsx       # 신청 모달
|       +-- CoffeeChatList.tsx               # 커피챗 목록 (탭 분류)
|       +-- CoffeeChatCard.tsx               # 커피챗 요청 카드
|       +-- CoffeeChatDetail.tsx             # 상세 뷰
|       +-- CoffeeChatStatusBadge.tsx        # 상태 배지
|       +-- CoffeeChatActions.tsx            # 액션 버튼
|       +-- CoffeeChatButton.tsx             # 프로필용 신청 버튼
|       +-- CoffeeChatBadge.tsx              # 미확인 배지
+-- hooks/
|   +-- useCoffeeChat.ts                     # 커피챗 CRUD
|   +-- useCoffeeChatCount.ts                # 미확인 수 (폴링)
+-- types/
|   +-- coffee-chat.ts                       # 타입 정의
+-- lib/
|   +-- coffee-chat-storage.ts               # 데이터 접근 계층
+-- __tests__/
    +-- coffee-chat-transitions.test.ts      # 상태 전환 테스트
    +-- coffee-chat-api.test.ts              # API 입력 검증 테스트
    +-- coffee-chat-email.test.ts            # 이메일 공개 로직 테스트
    +-- coffee-chat-components.test.tsx       # 컴포넌트 테스트

supabase/
+-- migrations/
    +-- 012_add_coffee_chat.sql              # DB 마이그레이션
```

### 4.2 데이터 흐름

```
[커피챗 신청 흐름]
CoffeeChatButton (프로필) -> CoffeeChatRequestModal (모달)
  -> POST /api/coffee-chat
    -> requireAuth()
    -> 입력 검증 (message 20-500자, HTML strip, UUID 형식)
    -> self-request 검증 (receiverId !== currentUserId)
    -> Rate Limiting 검증 (24시간 5건)
    -> checkExistingChat() (활성 요청 중복 확인)
    -> receiver.is_public 검증
    -> createCoffeeChat() -> DB INSERT (status: pending)
  -> 200 응답 -> UI 업데이트

[커피챗 수락 흐름]
CoffeeChatActions "수락" -> PATCH /api/coffee-chat/[id]/respond
  -> requireAuth()
  -> getCoffeeChatById(id) -> 관계자 검증
  -> VALID_TRANSITIONS[pending] -> accept (수신자만)
  -> respondToCoffeeChat() -> DB UPDATE (status: accepted)
  -> 양쪽 이메일 포함 응답 반환

[미확인 배지 흐름]
useCoffeeChatCount (60초 setInterval + visibilitychange)
  -> GET /api/coffee-chat/pending-count
  -> CoffeeChatBadge 렌더링
```

### 4.3 기존 코드 재사용 매핑

| 기존 패턴 | 출처 | 적용 대상 |
|-----------|------|----------|
| `requireAuth` 인증 미들웨어 | `src/lib/auth-utils.ts` | 모든 커피챗 API |
| `AuthError` 오류 클래스 | `src/lib/auth-utils.ts` | API 오류 응답 |
| 커서 기반 페이지네이션 | `/api/feed` 라우트 패턴 | `/api/coffee-chat`, `/api/members/discoverable` |
| `user_profiles` JOIN 패턴 | 기존 프로필 조회 로직 | 커피챗 목록 사용자 정보 |
| 무한 스크롤 (IntersectionObserver) | FeedContainer 패턴 | MemberDiscoverGrid, CoffeeChatList |
| 디자인 시스템 (색상, 폰트, radius) | 전역 스타일 | 전체 커피챗 UI |
| CommunityNav 탭 구조 | SPEC-COMMUNITY-003 | 커피챗 탭 추가 |

## 5. 리스크 분석 및 대응 전략

### 5.1 상태 머신 정확성 리스크

| 리스크 | 심각도 | 확률 | 대응 전략 |
|--------|--------|------|----------|
| 유효하지 않은 상태 전환 허용 | 높음 | 낮음 | `VALID_TRANSITIONS` 매트릭스를 타입과 API 모두에서 공유하여 단일 소스 유지. 전환 검증 단위 테스트 전수 작성 |
| 동시 요청으로 인한 경합 상태 | 중간 | 중간 | DB 트랜잭션 + `SELECT ... FOR UPDATE` 패턴 적용. Partial Unique Index가 최종 안전망 |
| 권한 매트릭스 오류 (requester/receiver 혼동) | 높음 | 중간 | `isRequester` 플래그를 API 응답에 포함. 권한 검증 테스트 케이스 전수 작성 |

### 5.2 이메일 프라이버시 리스크

| 리스크 | 심각도 | 확률 | 대응 전략 |
|--------|--------|------|----------|
| accepted 외 상태에서 이메일 노출 | 높음 | 낮음 | **서버 사이드에서만** 이메일 필드 포함 여부 결정. 클라이언트 필터링 금지. `coffee-chat-storage.ts`의 단일 지점에서 제어 |
| RLS 정책 우회로 이메일 직접 조회 | 높음 | 낮음 | `coffee_chat_requests` 테이블에는 이메일 미저장. `auth.users` JOIN은 서버 사이드 service_role만 가능 |
| 이메일 공개 후 악용 | 중간 | 중간 | 수락 전 "이메일이 상대방에게 공개됩니다" 고지. 향후 서비스 내 메시징으로 대체 가능 |

### 5.3 중복 방지 리스크

| 리스크 | 심각도 | 확률 | 대응 전략 |
|--------|--------|------|----------|
| Partial Unique Index 미지원 | 높음 | 낮음 | Supabase PostgreSQL 14+에서 지원 확인. 미지원 시 `checkExistingChat()` 애플리케이션 레벨 체크로 fallback |
| 동시 신청으로 중복 생성 | 중간 | 낮음 | DB 레벨 Partial Unique Index가 최종 보호. 중복 시 unique violation 에러 처리 후 "이미 요청됨" 반환 |
| A->B와 B->A 동시 신청 | 중간 | 낮음 | `LEAST/GREATEST` 패턴으로 양방향 동일 쌍 인식. 두 번째 요청이 unique violation으로 차단 |

### 5.4 SPEC-COMMUNITY-003 의존성 리스크

| 리스크 | 심각도 | 확률 | 대응 전략 |
|--------|--------|------|----------|
| CommunityNav 미구현 상태에서 개발 | 중간 | 중간 | Phase 1-4는 독립 구현 가능. Phase 5 통합 시점에만 CommunityNav 필요. 미구현 시 독립 네비게이션 생성으로 대체 |
| `/community/` 라우트 구조 충돌 | 낮음 | 낮음 | 동일한 `/community/` prefix 사용하되, 하위 경로 분리(`/coffee-chat/` vs `/questions/`) |

### 5.5 UX 리스크

| 리스크 | 심각도 | 확률 | 대응 전략 |
|--------|--------|------|----------|
| 거절 시 사용자 감정 | 중간 | 높음 | "정중히 거절" 표현, 거절 사유 비공개, "이번에는 어려울 것 같습니다" 완화 문구 |
| 스팸 커피챗 남용 | 중간 | 중간 | Rate limiting (5건/24시간), 최소 메시지 20자, 향후 차단 기능 |
| 응답 없는 pending 요청 축적 | 낮음 | 높음 | Phase 1에서는 수동 취소만 제공. Phase 2에서 14일 자동 만료 구현 예정 |
| 60초 폴링 지연 | 낮음 | 높음 | 페이지 포커스 시 즉시 재조회. 향후 Supabase Realtime으로 전환 가능 |

## 6. 총 영향 범위 요약

| Phase | 카테고리 | 신규 파일 | 수정 파일 |
|-------|---------|----------|----------|
| Phase 1 | DB 마이그레이션 | 1 | 0 |
| Phase 2 | API 라우트 + 데이터 계층 | 6 | 0 |
| Phase 3 | 타입 + 훅 | 3 | 0 |
| Phase 4 | 컴포넌트 | 10 | 0 |
| Phase 5 | 페이지 + 통합 | 2 | 2-3 |
| Phase 6 | 테스트 | 4 | 0 |
| **합계** | | **26** | **2-3** |

## 7. 구현 순서 권장

**전제조건**: SPEC-COMMUNITY-003 (질문/생각 공유)이 먼저 구현되어 CommunityNav가 존재해야 함

1. DB 마이그레이션 실행 (Supabase SQL Editor / CLI)
2. 타입 정의 (`src/types/coffee-chat.ts`)
3. 데이터 접근 계층 (`src/lib/coffee-chat-storage.ts`)
4. API 엔드포인트 (CRUD + 상태 변경 + 회원 탐색 + Rate Limiting)
5. 커스텀 훅 (`useCoffeeChat`, `useCoffeeChatCount`)
6. UI 컴포넌트 (하위 -> 상위 순서: StatusBadge -> Badge -> Button -> Actions -> Modal -> Cards -> Grid -> List)
7. 페이지 조립 및 라우팅
8. 기존 시스템 통합 (CommunityNav 탭 추가, ProfileClient 버튼 추가)
9. 테스트 작성 (상태 전환, 입력 검증, 이메일 공개, 컴포넌트)

## 8. SPEC-COMMUNITY-003 + 004 통합 관점

### 8.1 공유 컴포넌트

| 컴포넌트 | COMMUNITY-003 | COMMUNITY-004 |
|----------|--------------|--------------|
| CommunityNav | 생성 (질문 탭) | 탭 추가 (커피챗 탭 + 배지) |
| 무한 스크롤 패턴 | QuestionFeed, ThoughtList | MemberDiscoverGrid, CoffeeChatList |
| 상태 배지 패턴 | N/A | CoffeeChatStatusBadge |

### 8.2 구현 순서 (두 SPEC 통합 기준)

1. **SPEC-COMMUNITY-003**: DB + API + 핵심 UI (CommunityNav 포함)
2. **SPEC-COMMUNITY-004 Phase 1-4**: DB + API + 타입/훅 + 컴포넌트 (독립)
3. **SPEC-COMMUNITY-004 Phase 5**: 프로필 통합 + CommunityNav 탭 추가
4. **SPEC-COMMUNITY-004 Phase 6**: 테스트

### 8.3 공유 라우트 구조

```
/community/
+-- questions/          # SPEC-COMMUNITY-003
|   +-- page.tsx        # 질문 피드
|   +-- [id]/page.tsx   # 질문 상세
+-- coffee-chat/        # SPEC-COMMUNITY-004
    +-- page.tsx        # 회원 탐색
    +-- my/page.tsx     # 내 커피챗
```
