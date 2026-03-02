---
id: SPEC-COMMUNITY-004
title: Coffee Chat Request & Accept
version: "1.0.0"
status: completed
created: "2026-03-02"
updated: "2026-03-02"
completed: "2026-03-02"
author: MoAI
priority: high
tags: [community, coffeechat, networking, matching, 1on1]
related_specs: [SPEC-COMMUNITY-001, SPEC-COMMUNITY-002, SPEC-COMMUNITY-003, SPEC-LINKBIO-001]
lifecycle: spec-anchored
---

# SPEC-COMMUNITY-004: 커피챗 신청/수락 기능

## HISTORY

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-03-02 | 1.0.0 | 초기 SPEC 작성 |

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
| 배포 | Cloudflare Workers | - |

### 1.2 디자인 시스템

- 색상: 딥 네이비(`#020912`) + 오프 화이트(`#fcfcfc`)
- 모서리: 0px border-radius (날카로운 모서리)
- 폰트: Figtree (제목/헤딩) + Anonymous Pro (본문/모노)
- 스타일: 미니멀리스트 갤러리

### 1.3 영향 범위

- 신규 라우트: `/community/coffee-chat`, `/community/coffee-chat/my`
- 신규 API: `/api/coffee-chat`, `/api/coffee-chat/[id]`, `/api/coffee-chat/[id]/respond`
- 신규 컴포넌트: `src/components/coffee-chat/`
- 신규 타입: `src/types/coffee-chat.ts`
- 신규 훅: `src/hooks/useCoffeeChat.ts`
- DB 마이그레이션: `012_add_coffee_chat.sql`
- 기존 통합: 프로필 페이지(`/profile/[id]`), 커뮤니티 네비게이션(CommunityNav)

### 1.4 현재 상태 (Before)

현재 사용자 간 1:1 네트워킹 기능 부재:
- 프로필 페이지에서 다른 사용자 정보를 볼 수 있지만 직접 소통 수단 없음
- 커뮤니티 피드에서 명함 카드를 탐색하지만 네트워킹 액션 부재
- 질문/답변(SPEC-COMMUNITY-003)은 1:N 공개 소통이고, 1:1 비공개 네트워킹이 없음

## 2. Assumptions (가정)

- A01: 커피챗은 "만남 요청/수락" 매칭 시스템이며, 실제 채팅/메시징 기능은 포함하지 않는다
- A02: 커피챗 수락 후 실제 만남 조율은 서비스 외부에서 진행한다 (이메일, 소셜 등)
- A03: 커피챗 요청 시 메시지(자기소개/목적)를 필수로 작성하게 하여 스팸을 방지한다
- A04: 동일 사용자에게 중복 요청은 기존 요청이 완료/거절/취소 상태인 경우에만 재요청 가능하다
- A05: 커피챗 수락 시 양쪽의 연락처(이메일)가 상호 공개된다 (이메일 기반 연결)
- A06: 프로필의 `is_public = true`인 사용자만 커피챗 요청을 받을 수 있다
- A07: 자기 자신에게는 커피챗을 신청할 수 없다
- A08: 커피챗 요청/수락 알림은 Phase 1에서 페이지 내 알림(배지)으로 구현하며, 이메일 알림은 향후 Phase에서 구현한다

## 3. Requirements (요구사항)

### 3.1 Ubiquitous (항상 적용)

**REQ-U01: 디자인 시스템 일관성**
시스템은 **항상** 기존 디자인 시스템을 적용해야 한다: 딥 네이비(`#020912`), 오프 화이트(`#fcfcfc`), 0px border-radius, Figtree/Anonymous Pro 폰트.

**REQ-U02: 모바일 퍼스트 반응형**
시스템은 **항상** 모바일 퍼스트 반응형 레이아웃으로 렌더링해야 한다.

**REQ-U03: 요청 상태 투명성**
시스템은 **항상** 커피챗 요청의 현재 상태(대기중, 수락됨, 거절됨, 취소됨, 완료됨)를 양쪽 사용자에게 명확히 표시해야 한다.

### 3.2 Event-Driven (이벤트 기반)

**REQ-E01: 커피챗 신청**
**WHEN** 인증된 사용자가 다른 사용자의 프로필에서 "커피챗 신청" 버튼을 클릭하고, 메시지(필수, 20-500자)와 선호 만남 방식(온라인/오프라인/상관없음)을 입력 **THEN** `coffee_chat_requests` 테이블에 `pending` 상태로 새 요청이 생성되고 신청자에게 "커피챗이 신청되었습니다" 확인이 표시된다.

**REQ-E02: 커피챗 수락**
**WHEN** 요청을 받은 사용자가 "수락" 버튼을 클릭하고 선택적으로 응답 메시지를 입력 **THEN** 요청 상태가 `accepted`로 변경되고, 양쪽 사용자의 이메일이 상호 공개되며 "커피챗이 수락되었습니다" 확인이 표시된다.

**REQ-E03: 커피챗 거절**
**WHEN** 요청을 받은 사용자가 "정중히 거절" 버튼을 클릭 **THEN** 요청 상태가 `declined`로 변경되고, 신청자에게 "상대방이 이번에는 어려울 것 같습니다" 안내가 표시된다. (거절 사유는 비공개)

**REQ-E04: 커피챗 취소**
**WHEN** 신청자가 `pending` 상태의 요청에서 "취소" 버튼을 클릭 **THEN** 요청 상태가 `cancelled`로 변경된다.

**REQ-E05: 커피챗 완료 표시**
**WHEN** 수락된 커피챗의 양쪽 사용자 중 한 명이 "만남 완료" 버튼을 클릭 **THEN** 요청 상태가 `completed`로 변경된다.

**REQ-E06: 커피챗 목록 조회**
**WHEN** 인증된 사용자가 "내 커피챗" 페이지에 접근 **THEN** 자신이 보내거나 받은 모든 커피챗 요청이 탭(받은 요청 / 보낸 요청)으로 분류되어 표시된다.

**REQ-E07: 프로필에서 커피챗 신청 진입**
**WHEN** 인증된 사용자가 다른 사용자의 프로필 페이지(`/profile/[id]`)를 방문 **THEN** 프로필 하단 또는 소셜 아이콘 영역에 "커피챗 신청" 버튼이 표시된다.

**REQ-E08: 커뮤니티 커피챗 탐색**
**WHEN** 사용자가 커뮤니티 커피챗 페이지(`/community/coffee-chat`)에 접근 **THEN** 커피챗을 받을 수 있는(is_public = true) 회원 목록이 카드 형태로 표시된다.

### 3.3 State-Driven (상태 기반)

**REQ-S01: 미인증 커피챗 버튼 비활성화**
**IF** 사용자가 미인증 상태 **THEN** "커피챗 신청" 버튼 대신 "로그인 후 커피챗을 신청하세요" 안내와 로그인 버튼을 표시한다.

**REQ-S02: 비공개 프로필 커피챗 차단**
**IF** 대상 사용자의 `is_public = false` **THEN** "커피챗 신청" 버튼을 표시하지 않는다.

**REQ-S03: 기존 진행 중 요청 중복 방지**
**IF** 동일 사용자에게 `pending` 또는 `accepted` 상태의 커피챗 요청이 이미 존재 **THEN** "커피챗 신청" 버튼 대신 "이미 요청된 커피챗이 있습니다" 안내와 해당 요청 보기 링크를 표시한다.

**REQ-S04: 수락 후 연락처 공개**
**IF** 커피챗 상태가 `accepted` **THEN** 양쪽 사용자의 요청 상세에 상대방의 이메일 주소가 표시된다.

**REQ-S05: 요청 배지 표시**
**IF** 사용자에게 `pending` 상태의 미확인 커피챗 요청이 1개 이상 **THEN** 커뮤니티 네비게이션의 "커피챗" 탭에 배지(숫자)를 표시한다.

**REQ-S06: 자기 자신 신청 차단**
**IF** 대상 프로필이 현재 로그인한 사용자 본인 **THEN** "커피챗 신청" 버튼을 표시하지 않는다.

### 3.4 Unwanted (금지 사항)

**REQ-N01: 미인증 요청 차단**
시스템은 미인증 사용자의 커피챗 신청/수락/거절 요청을 **허용하지 않아야 한다**. API 레벨에서 `requireAuth` 검증을 수행한다.

**REQ-N02: 권한 없는 상태 변경 차단**
시스템은 커피챗 요청의 관계자(신청자 또는 수신자)가 아닌 사용자의 상태 변경 요청을 **허용하지 않아야 한다**.

**REQ-N03: 유효하지 않은 상태 전환 차단**
시스템은 다음의 유효하지 않은 상태 전환을 **허용하지 않아야 한다**:
- `declined` -> `accepted` (거절된 요청을 수락)
- `cancelled` -> `accepted` (취소된 요청을 수락)
- `completed` -> 어떤 상태로든 전환

**REQ-N04: Rate Limiting**
시스템은 동일 사용자의 커피챗 신청을 **1일 5건으로 제한**해야 한다.

**REQ-N05: 스팸 메시지 방지**
시스템은 커피챗 신청 메시지에서 HTML 태그를 **저장하지 않아야 한다**. 서버 사이드에서 HTML 태그 제거(strip) 처리를 수행한다.

## 4. Specifications (명세)

### 4.1 데이터베이스 설계

#### 4.1.1 커피챗 요청 상태 전이

```
pending (대기중)
  ├── -> accepted (수락됨)    [수신자 액션]
  ├── -> declined (거절됨)    [수신자 액션]
  └── -> cancelled (취소됨)   [신청자 액션]

accepted (수락됨)
  └── -> completed (완료됨)   [양쪽 액션]
```

#### 4.1.2 신규 테이블: `coffee_chat_requests`

```sql
CREATE TABLE coffee_chat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response_message TEXT,
  meeting_preference VARCHAR(20) NOT NULL DEFAULT 'any',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requester_read BOOLEAN NOT NULL DEFAULT true,
  receiver_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_meeting_preference CHECK (meeting_preference IN ('online', 'offline', 'any')),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  CONSTRAINT chk_not_self CHECK (requester_id != receiver_id)
);

-- Indexes
CREATE INDEX idx_coffee_chat_requester ON coffee_chat_requests(requester_id, status);
CREATE INDEX idx_coffee_chat_receiver ON coffee_chat_requests(receiver_id, status);
CREATE INDEX idx_coffee_chat_created ON coffee_chat_requests(created_at DESC);

-- Unique constraint: only one active (pending/accepted) request between two users
CREATE UNIQUE INDEX idx_coffee_chat_active_pair ON coffee_chat_requests(
  LEAST(requester_id, receiver_id),
  GREATEST(requester_id, receiver_id)
) WHERE status IN ('pending', 'accepted');

-- RLS
ALTER TABLE coffee_chat_requests ENABLE ROW LEVEL SECURITY;

-- Only involved users can see their requests
CREATE POLICY "coffee_chat_select_involved" ON coffee_chat_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Authenticated users can create requests
CREATE POLICY "coffee_chat_insert_auth" ON coffee_chat_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Involved users can update (status changes)
CREATE POLICY "coffee_chat_update_involved" ON coffee_chat_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
```

**meeting_preference 값:**
- `online`: 온라인 미팅 선호
- `offline`: 오프라인 만남 선호
- `any`: 상관없음

### 4.2 API 설계

#### 4.2.1 커피챗 API

| 메서드 | 엔드포인트 | 인증 | 설명 |
|--------|-----------|------|------|
| GET | `/api/coffee-chat` | requireAuth | 내 커피챗 목록 (보낸/받은 탭, 상태 필터) |
| POST | `/api/coffee-chat` | requireAuth | 커피챗 신청 |
| GET | `/api/coffee-chat/[id]` | requireAuth | 커피챗 상세 조회 (관계자만) |
| PATCH | `/api/coffee-chat/[id]/respond` | requireAuth | 상태 변경 (수락/거절/취소/완료) |
| GET | `/api/coffee-chat/pending-count` | requireAuth | 미확인 요청 수 (배지용) |

**GET /api/coffee-chat 쿼리 파라미터:**
- `tab`: `received` (기본) | `sent`
- `status`: `pending` | `accepted` | `all` (기본)
- `cursor`: 페이지네이션 커서
- `limit`: 페이지 크기 (기본 20)

**POST /api/coffee-chat 요청:**
```typescript
interface CreateCoffeeChatRequest {
  receiverId: string;           // 대상 사용자 UUID
  message: string;              // 20-500자 (자기소개/목적)
  meetingPreference: 'online' | 'offline' | 'any';
}
```

**PATCH /api/coffee-chat/[id]/respond 요청:**
```typescript
interface RespondCoffeeChatRequest {
  action: 'accept' | 'decline' | 'cancel' | 'complete';
  responseMessage?: string;  // 수락 시 선택 메시지 (최대 500자)
}
```

**유효한 상태 전환 매트릭스:**

| 현재 상태 | 허용된 액션 | 실행 가능 사용자 |
|-----------|-----------|----------------|
| pending | accept | 수신자 |
| pending | decline | 수신자 |
| pending | cancel | 신청자 |
| accepted | complete | 신청자 또는 수신자 |

**커피챗 응답 타입:**
```typescript
interface CoffeeChatResponse {
  id: string;
  requester: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    email?: string;  // accepted 상태에서만 포함
  };
  receiver: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    email?: string;  // accepted 상태에서만 포함
  };
  message: string;
  responseMessage: string | null;
  meetingPreference: 'online' | 'offline' | 'any';
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  isRequester: boolean;  // 현재 사용자가 신청자인지
  createdAt: string;
  updatedAt: string;
}
```

#### 4.2.2 회원 탐색 API

| 메서드 | 엔드포인트 | 인증 | 설명 |
|--------|-----------|------|------|
| GET | `/api/members/discoverable` | 공개 | 공개 프로필 회원 목록 (커피챗 대상) |

**GET /api/members/discoverable 쿼리 파라미터:**
- `cursor`: 페이지네이션 커서
- `limit`: 페이지 크기 (기본 20)
- `search`: 이름 검색 (선택)

### 4.3 컴포넌트 아키텍처

#### 4.3.1 페이지 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| CoffeeChatDiscoverPage | `src/app/community/coffee-chat/page.tsx` | 커피챗 가능한 회원 탐색 |
| MyCoffeeChatPage | `src/app/community/coffee-chat/my/page.tsx` | 내 커피챗 요청 관리 |

#### 4.3.2 신규 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| MemberDiscoverGrid | `src/components/coffee-chat/MemberDiscoverGrid.tsx` | 공개 회원 카드 그리드 (무한 스크롤) |
| MemberCard | `src/components/coffee-chat/MemberCard.tsx` | 회원 카드 (아바타, 이름, Bio, 카드 수, 커피챗 버튼) |
| CoffeeChatRequestModal | `src/components/coffee-chat/CoffeeChatRequestModal.tsx` | 커피챗 신청 모달 (메시지 + 선호 방식) |
| CoffeeChatList | `src/components/coffee-chat/CoffeeChatList.tsx` | 커피챗 목록 (받은/보낸 탭) |
| CoffeeChatCard | `src/components/coffee-chat/CoffeeChatCard.tsx` | 개별 커피챗 요청 카드 (상태 배지, 액션 버튼) |
| CoffeeChatDetail | `src/components/coffee-chat/CoffeeChatDetail.tsx` | 커피챗 상세 뷰 (메시지, 상태, 연락처) |
| CoffeeChatStatusBadge | `src/components/coffee-chat/CoffeeChatStatusBadge.tsx` | 상태 배지 (pending/accepted/declined/cancelled/completed) |
| CoffeeChatActions | `src/components/coffee-chat/CoffeeChatActions.tsx` | 상태별 액션 버튼 (수락/거절/취소/완료) |
| CoffeeChatButton | `src/components/coffee-chat/CoffeeChatButton.tsx` | 프로필에 배치할 커피챗 신청 버튼 |
| CoffeeChatBadge | `src/components/coffee-chat/CoffeeChatBadge.tsx` | 미확인 요청 카운트 배지 |

#### 4.3.3 커스텀 훅

| 훅 | 경로 | 용도 |
|----|------|------|
| useCoffeeChat | `src/hooks/useCoffeeChat.ts` | 커피챗 CRUD + 상태 변경 |
| useCoffeeChatCount | `src/hooks/useCoffeeChatCount.ts` | 미확인 요청 수 (배지용, 폴링) |

#### 4.3.4 타입 정의

`src/types/coffee-chat.ts`:
```typescript
export type CoffeeChatStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
export type MeetingPreference = 'online' | 'offline' | 'any';

export interface CoffeeChat {
  id: string;
  requesterId: string;
  receiverId: string;
  message: string;
  responseMessage: string | null;
  meetingPreference: MeetingPreference;
  status: CoffeeChatStatus;
  requesterRead: boolean;
  receiverRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoffeeChatWithUsers extends CoffeeChat {
  requester: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    email?: string;
  };
  receiver: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    email?: string;
  };
  isRequester: boolean;
}

export interface DiscoverableMember {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  cardCount: number;
  hasPendingChat: boolean;  // 기존 진행중 요청 여부
}

// Valid state transitions
export const VALID_TRANSITIONS: Record<CoffeeChatStatus, { action: string; nextStatus: CoffeeChatStatus; allowedBy: 'requester' | 'receiver' | 'both' }[]> = {
  pending: [
    { action: 'accept', nextStatus: 'accepted', allowedBy: 'receiver' },
    { action: 'decline', nextStatus: 'declined', allowedBy: 'receiver' },
    { action: 'cancel', nextStatus: 'cancelled', allowedBy: 'requester' },
  ],
  accepted: [
    { action: 'complete', nextStatus: 'completed', allowedBy: 'both' },
  ],
  declined: [],
  cancelled: [],
  completed: [],
};
```

### 4.4 레이아웃 명세

#### 4.4.1 회원 탐색 (`/community/coffee-chat`)

```
+------------------------------------------+
|   [커뮤니티 네비게이션 탭]                  |
|   [질문]  [커피챗 (3)]                    |
+------------------------------------------+
|   [내 커피챗 보기 ->]                      |
+------------------------------------------+
|   +----------------+  +----------------+  |
|   | [아바타]       |  | [아바타]       |  |
|   | 홍길동         |  | 김영희         |  |
|   | "UX 디자이너   |  | "풀스택 개발   |  |
|   |  5년차"        |  |  자, React"    |  |
|   | 카드 3개       |  | 카드 5개       |  |
|   | [커피챗 신청]  |  | [커피챗 신청]  |  |
|   +----------------+  +----------------+  |
|   +----------------+  +----------------+  |
|   | [아바타]       |  | [아바타]       |  |
|   | 박철수         |  | 이미나         |  |
|   | "마케팅 전문"  |  | "스타트업 CEO" |  |
|   | 카드 2개       |  | 카드 4개       |  |
|   | [이미 요청됨]  |  | [커피챗 신청]  |  |
|   +----------------+  +----------------+  |
+------------------------------------------+
```

#### 4.4.2 내 커피챗 (`/community/coffee-chat/my`)

```
+------------------------------------------+
|   [< 뒤로]  내 커피챗                      |
+------------------------------------------+
|   [받은 요청 (2)]  |  [보낸 요청]          |
+------------------------------------------+
|   +--------------------------------------+|
|   | [아바타] 홍길동         대기중        ||
|   | "함께 커리어에 대해 이야기             ||
|   |  나누고 싶습니다."                    ||
|   | 온라인 미팅 선호 | 3시간 전            ||
|   | [수락]  [정중히 거절]                  ||
|   +--------------------------------------+|
|   +--------------------------------------+|
|   | [아바타] 박철수         수락됨         ||
|   | "디자인 협업 가능성에 대해..."         ||
|   | 오프라인 만남 선호 | 1일 전            ||
|   | 이메일: park@example.com              ||
|   | [만남 완료]                            ||
|   +--------------------------------------+|
+------------------------------------------+
```

#### 4.4.3 커피챗 신청 모달

```
+--------------------------------------+
|        커피챗 신청                     |
+--------------------------------------+
|                                      |
|  [아바타] 김영희 님에게               |
|                                      |
|  메시지 *                            |
|  +--------------------------------+  |
|  | 안녕하세요! 프론트엔드 개발에    |  |
|  | 관심이 많은 백엔드 개발자입니다. |  |
|  | 커리어 전환 경험을 공유해주실    |  |
|  | 수 있을까요?                     |  |
|  +--------------------------------+  |
|  20/500자                            |
|                                      |
|  만남 방식 선호                       |
|  [ ] 온라인    [x] 오프라인  [ ] 무관 |
|                                      |
|       [취소]    [신청하기]            |
+--------------------------------------+
```

### 4.5 통합 포인트

#### 4.5.1 프로필 페이지 통합

- `/profile/[id]` 페이지에 `CoffeeChatButton` 컴포넌트 추가
- 소셜 아이콘 행 옆 또는 링크 섹션 아래에 배치
- 자기 자신 프로필에서는 비표시, 비공개 프로필에서는 비표시

#### 4.5.2 커뮤니티 네비게이션 통합

- `CommunityNav`에 "커피챗" 탭 추가 (SPEC-COMMUNITY-003에서 생성한 탭에 추가)
- 미확인 요청이 있을 때 `CoffeeChatBadge` 배지 표시
- `useCoffeeChatCount` 훅으로 60초 간격 폴링

#### 4.5.3 기존 인증 패턴 재사용

- `requireAuth` 미들웨어로 모든 커피챗 API 보호
- `AuthError` 클래스로 일관된 오류 응답

### 4.6 상태 배지 색상 매핑

| 상태 | 라벨 (한국어) | 배경색 | 텍스트색 |
|------|-------------|--------|---------|
| pending | 대기중 | `#f59e0b` (amber) | `#020912` |
| accepted | 수락됨 | `#10b981` (green) | `#fcfcfc` |
| declined | 거절됨 | `#6b7280` (gray) | `#fcfcfc` |
| cancelled | 취소됨 | `#6b7280` (gray) | `#fcfcfc` |
| completed | 완료됨 | `#020912` (navy) | `#fcfcfc` |

### 4.7 Rate Limiting 설계

| 작업 | 제한 | 윈도우 |
|------|------|--------|
| 커피챗 신청 | 5건 | 24시간 |
| 상태 변경(수락/거절) | 20건 | 1시간 |

### 4.8 이메일 공개 규칙

- `pending` 상태: 양쪽 모두 이메일 비공개
- `accepted` 상태: 양쪽 사용자의 이메일 상호 공개 (API 응답에 포함)
- `declined`/`cancelled`/`completed` 상태: 이메일 비공개

## 5. Phase 구분

### Phase 1 (현재 SPEC 범위)
- 커피챗 신청/수락/거절/취소/완료 워크플로우
- 회원 탐색 페이지 (공개 프로필 목록)
- 내 커피챗 관리 페이지 (받은/보낸 탭)
- 프로필 페이지 커피챗 버튼 통합
- 커뮤니티 네비게이션 탭 통합
- 미확인 요청 배지
- DB 마이그레이션

### Phase 2 (향후)
- 이메일 알림 (Supabase Edge Functions)
- 커피챗 후기 작성 (완료 후 피드백)
- 커피챗 추천 (관심사 기반 매칭)
- 일정 제안 기능 (날짜/시간/장소)

### Phase 3 (향후)
- 실시간 채팅 (Supabase Realtime)
- 그룹 커피챗 (3인 이상)
- 커피챗 통계 (관리자 대시보드)
- 반복 커피챗 (정기 모임 기능)

## 6. Traceability (추적성)

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|------------|-----------|----------------|
| REQ-U01 | 전체 컴포넌트 Tailwind 클래스 | ACC-DESIGN-01 |
| REQ-U02 | 전체 레이아웃 | ACC-RESPONSIVE-01 |
| REQ-U03 | CoffeeChatStatusBadge, CoffeeChatCard | ACC-STATUS-01 |
| REQ-E01 | CoffeeChatRequestModal, POST /api/coffee-chat | ACC-REQUEST-01 |
| REQ-E02 | CoffeeChatActions, PATCH /api/coffee-chat/[id]/respond | ACC-ACCEPT-01 |
| REQ-E03 | CoffeeChatActions, PATCH /api/coffee-chat/[id]/respond | ACC-DECLINE-01 |
| REQ-E04 | CoffeeChatActions, PATCH /api/coffee-chat/[id]/respond | ACC-CANCEL-01 |
| REQ-E05 | CoffeeChatActions, PATCH /api/coffee-chat/[id]/respond | ACC-COMPLETE-01 |
| REQ-E06 | CoffeeChatList, GET /api/coffee-chat | ACC-LIST-01 |
| REQ-E07 | CoffeeChatButton, ProfileClient | ACC-PROFILE-01 |
| REQ-E08 | MemberDiscoverGrid, GET /api/members/discoverable | ACC-DISCOVER-01 |
| REQ-S01 | CoffeeChatButton | ACC-UNAUTH-01 |
| REQ-S02 | CoffeeChatButton | ACC-PRIVATE-01 |
| REQ-S03 | CoffeeChatButton, API duplicate check | ACC-DUPLICATE-01 |
| REQ-S04 | CoffeeChatDetail | ACC-EMAIL-01 |
| REQ-S05 | CoffeeChatBadge, CommunityNav | ACC-BADGE-01 |
| REQ-S06 | CoffeeChatButton | ACC-SELF-01 |
| REQ-N01 | API middleware | ACC-AUTH-API-01 |
| REQ-N02 | API ownership check | ACC-AUTHZ-01 |
| REQ-N03 | API transition validation | ACC-TRANSITION-01 |
| REQ-N04 | Rate limiting middleware | ACC-RATE-01 |
| REQ-N05 | Server-side sanitization | ACC-XSS-01 |
