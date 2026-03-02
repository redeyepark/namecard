---
id: SPEC-COMMUNITY-003
title: Question & Thought Sharing
version: "1.0.0"
status: completed
created: "2026-03-02"
updated: "2026-03-02"
completed: "2026-03-02"
author: MoAI
priority: high
tags: [community, questions, thoughts, opinions, networking, feed]
related_specs: [SPEC-COMMUNITY-001, SPEC-COMMUNITY-002, SPEC-LINKBIO-001]
lifecycle: spec-anchored
---

# SPEC-COMMUNITY-003: 질문/생각 공유 기능

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

- 신규 라우트: `/community/questions`, `/community/questions/[id]`
- 신규 API: `/api/questions`, `/api/questions/[id]`, `/api/questions/[id]/thoughts`
- 신규 컴포넌트: `src/components/community/`
- 신규 타입: `src/types/question.ts`
- 신규 훅: `src/hooks/useQuestions.ts`, `src/hooks/useThoughts.ts`
- DB 마이그레이션: `011_add_questions_thoughts.sql`
- 기존 통합: 커뮤니티 피드(`/gallery`), 프로필 페이지(`/profile/[id]`), 좋아요 시스템

### 1.4 현재 상태 (Before)

현재 커뮤니티 기능은 명함 카드 중심:
- 명함 카드 피드 (FeedContainer, FeedCardThumbnail)
- 좋아요/북마크 (card_likes, card_bookmarks)
- 사용자 프로필 (user_profiles) + Link-in-Bio
- 텍스트 기반 커뮤니티 인터랙션 없음
- 사용자 간 의견 교환 채널 부재

## 2. Assumptions (가정)

- A01: `user_profiles` 테이블에 이미 사용자 정보(display_name, avatar_url)가 존재하며 질문/답변 작성자 정보로 활용할 수 있다
- A02: 기존 인증 시스템(requireAuth)을 그대로 사용하여 질문/답변 작성 권한을 제어한다
- A03: 커뮤니티 피드와 질문 피드는 별도 탭으로 분리되지만, 향후 통합 피드를 고려한 설계를 한다
- A04: 질문당 답변(생각) 수의 현실적 상한은 100개 이내로 가정하며, 커서 기반 페이지네이션을 적용한다
- A05: 익명 답변 기능은 Phase 1에서 제외하며, 모든 답변은 인증된 사용자의 실명(display_name)으로 표시된다
- A06: 이미지 첨부는 Phase 1에서 제외하며, 텍스트 전용 Q&A를 우선 구현한다
- A07: 질문 카테고리/태그 시스템은 Phase 1에서 해시태그 기반으로 간단히 구현한다

## 3. Requirements (요구사항)

### 3.1 Ubiquitous (항상 적용)

**REQ-U01: 디자인 시스템 일관성**
시스템은 **항상** 기존 디자인 시스템을 적용해야 한다: 딥 네이비(`#020912`), 오프 화이트(`#fcfcfc`), 0px border-radius, Figtree/Anonymous Pro 폰트.

**REQ-U02: 모바일 퍼스트 반응형**
시스템은 **항상** 모바일 퍼스트 반응형 레이아웃으로 렌더링해야 한다. 모바일(단일 컬럼) -> 태블릿(2열) -> 데스크톱(최대 3열).

**REQ-U03: 작성자 프로필 표시**
시스템은 **항상** 질문 및 답변에 작성자의 아바타, display_name, 프로필 링크를 표시해야 한다.

**REQ-U04: 시간 정보 표시**
시스템은 **항상** 질문 및 답변에 상대 시간(예: "2시간 전", "3일 전")을 표시해야 한다.

### 3.2 Event-Driven (이벤트 기반)

**REQ-E01: 질문 작성**
**WHEN** 인증된 사용자가 "질문하기" 버튼을 클릭하고 질문 내용(필수, 10-500자)과 해시태그(선택, 최대 5개)를 입력 **THEN** `community_questions` 테이블에 새 질문이 저장되고 질문 피드에 즉시 표시된다.

**REQ-E02: 답변(생각) 작성**
**WHEN** 인증된 사용자가 질문 상세에서 "나의 생각" 입력란에 내용(필수, 5-1000자)을 작성하고 제출 **THEN** `community_thoughts` 테이블에 새 답변이 저장되고 질문의 `thought_count`가 1 증가하며, 해당 질문 상세 페이지에 즉시 표시된다.

**REQ-E03: 질문 피드 조회**
**WHEN** 사용자가 `/community/questions`에 접근 **THEN** 최신순 또는 인기순으로 정렬된 질문 목록이 무한 스크롤로 표시된다.

**REQ-E04: 질문 상세 조회**
**WHEN** 사용자가 질문 카드를 클릭 **THEN** 질문 전문과 해당 질문에 달린 답변(생각) 목록이 최신순으로 표시된다.

**REQ-E05: 답변에 공감(좋아요)**
**WHEN** 인증된 사용자가 답변의 공감 버튼을 클릭 **THEN** `thought_likes` 테이블에 기록되고, 답변의 `like_count`가 낙관적 업데이트로 즉시 반영된다.

**REQ-E06: 질문 삭제**
**WHEN** 질문 작성자가 자신의 질문에서 삭제 버튼을 클릭 **THEN** 확인 대화상자 표시 후 질문과 연관된 모든 답변이 cascade 삭제된다.

**REQ-E07: 답변 삭제**
**WHEN** 답변 작성자가 자신의 답변에서 삭제 버튼을 클릭 **THEN** 해당 답변이 삭제되고 질문의 `thought_count`가 1 감소한다.

**REQ-E08: 해시태그 필터링**
**WHEN** 사용자가 질문의 해시태그를 클릭 **THEN** 해당 태그가 포함된 질문만 필터링하여 표시된다.

### 3.3 State-Driven (상태 기반)

**REQ-S01: 미인증 작성 차단**
**IF** 사용자가 미인증 상태 **THEN** 질문/답변 작성 UI 대신 "로그인 후 참여하세요" 안내와 로그인 버튼을 표시한다.

**REQ-S02: 질문 없음 상태**
**IF** 질문 피드에 게시물이 0개 **THEN** "아직 질문이 없습니다. 첫 번째 질문을 올려보세요!" 안내를 표시한다.

**REQ-S03: 답변 없음 상태**
**IF** 질문에 답변이 0개 **THEN** "아직 답변이 없습니다. 첫 번째로 생각을 공유해 보세요!" 안내를 표시한다.

**REQ-S04: 본인 질문/답변 식별**
**IF** 현재 사용자가 질문/답변의 작성자인 경우 **THEN** 삭제 버튼과 "내 질문"/"내 답변" 표시를 제공한다.

### 3.4 Unwanted (금지 사항)

**REQ-N01: 미인증 작성 차단**
시스템은 미인증 사용자의 질문 및 답변 작성 요청을 **허용하지 않아야 한다**. API 레벨에서 `requireAuth` 검증을 수행한다.

**REQ-N02: 타인 콘텐츠 삭제 차단**
시스템은 다른 사용자의 질문/답변 삭제 요청을 **허용하지 않아야 한다**. 작성자 ID와 현재 사용자 ID 일치 검증을 수행한다. (관리자는 예외)

**REQ-N03: Rate Limiting**
시스템은 동일 사용자의 질문 작성을 **1분에 1건으로 제한**해야 한다. 답변 작성은 **같은 질문에 대해 30초에 1건으로 제한**해야 한다.

**REQ-N04: XSS 방지**
시스템은 질문 및 답변 본문에 HTML 태그를 **저장하지 않아야 한다**. 서버 사이드에서 HTML 태그 제거(strip) 처리를 수행한다.

## 4. Specifications (명세)

### 4.1 데이터베이스 설계

#### 4.1.1 신규 테이블: `community_questions`

```sql
CREATE TABLE community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  thought_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_questions_author ON community_questions(author_id);
CREATE INDEX idx_questions_created ON community_questions(created_at DESC);
CREATE INDEX idx_questions_active_created ON community_questions(is_active, created_at DESC);
CREATE INDEX idx_questions_hashtags ON community_questions USING GIN(hashtags);

-- RLS
ALTER TABLE community_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select_public" ON community_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "questions_insert_auth" ON community_questions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "questions_update_owner" ON community_questions
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "questions_delete_owner" ON community_questions
  FOR DELETE USING (auth.uid() = author_id);
```

#### 4.1.2 신규 테이블: `community_thoughts`

```sql
CREATE TABLE community_thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_thoughts_question ON community_thoughts(question_id, created_at DESC);
CREATE INDEX idx_thoughts_author ON community_thoughts(author_id);

-- RLS
ALTER TABLE community_thoughts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thoughts_select_public" ON community_thoughts
  FOR SELECT USING (is_active = true);

CREATE POLICY "thoughts_insert_auth" ON community_thoughts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "thoughts_update_owner" ON community_thoughts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "thoughts_delete_owner" ON community_thoughts
  FOR DELETE USING (auth.uid() = author_id);
```

#### 4.1.3 신규 테이블: `thought_likes`

```sql
CREATE TABLE thought_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thought_id UUID NOT NULL REFERENCES community_thoughts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, thought_id)
);

CREATE INDEX idx_thought_likes_thought ON thought_likes(thought_id);

-- RLS
ALTER TABLE thought_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thought_likes_select" ON thought_likes
  FOR SELECT USING (true);

CREATE POLICY "thought_likes_insert" ON thought_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "thought_likes_delete" ON thought_likes
  FOR DELETE USING (auth.uid() = user_id);
```

#### 4.1.4 `thought_count` 자동 업데이트 트리거

```sql
-- thought_count increment trigger
CREATE OR REPLACE FUNCTION update_question_thought_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_questions
    SET thought_count = thought_count + 1,
        updated_at = now()
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_questions
    SET thought_count = GREATEST(thought_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thought_count
  AFTER INSERT OR DELETE ON community_thoughts
  FOR EACH ROW
  EXECUTE FUNCTION update_question_thought_count();
```

#### 4.1.5 `thought like_count` 자동 업데이트 트리거

```sql
CREATE OR REPLACE FUNCTION update_thought_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_thoughts
    SET like_count = like_count + 1
    WHERE id = NEW.thought_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_thoughts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.thought_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thought_like_count
  AFTER INSERT OR DELETE ON thought_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_thought_like_count();
```

### 4.2 API 설계

#### 4.2.1 질문 API

| 메서드 | 엔드포인트 | 인증 | 설명 |
|--------|-----------|------|------|
| GET | `/api/questions` | 공개 | 질문 목록 조회 (커서 기반 페이지네이션, 정렬, 태그 필터) |
| POST | `/api/questions` | requireAuth | 질문 생성 |
| GET | `/api/questions/[id]` | 공개 | 질문 상세 조회 |
| DELETE | `/api/questions/[id]` | requireAuth + 작성자 | 질문 삭제 |

**GET /api/questions 쿼리 파라미터:**
- `cursor`: 페이지네이션 커서 (질문 ID)
- `limit`: 페이지 크기 (기본 20, 최대 50)
- `sort`: `latest` (기본) | `popular` (thought_count DESC)
- `tag`: 해시태그 필터 (선택)

**POST /api/questions 요청:**
```typescript
interface CreateQuestionRequest {
  content: string;      // 10-500자
  hashtags?: string[];  // 최대 5개, 각 최대 20자
}
```

**질문 응답 타입:**
```typescript
interface QuestionResponse {
  id: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  content: string;
  hashtags: string[];
  thoughtCount: number;
  createdAt: string;
  isOwner: boolean;   // 현재 사용자가 작성자인지
}
```

#### 4.2.2 답변(생각) API

| 메서드 | 엔드포인트 | 인증 | 설명 |
|--------|-----------|------|------|
| GET | `/api/questions/[id]/thoughts` | 공개 | 답변 목록 조회 (커서 기반 페이지네이션) |
| POST | `/api/questions/[id]/thoughts` | requireAuth | 답변 작성 |
| DELETE | `/api/questions/[id]/thoughts/[thoughtId]` | requireAuth + 작성자 | 답변 삭제 |

**GET /api/questions/[id]/thoughts 쿼리 파라미터:**
- `cursor`: 페이지네이션 커서 (답변 ID)
- `limit`: 페이지 크기 (기본 20, 최대 50)
- `sort`: `latest` (기본) | `popular` (like_count DESC)

**POST /api/questions/[id]/thoughts 요청:**
```typescript
interface CreateThoughtRequest {
  content: string;  // 5-1000자
}
```

**답변 응답 타입:**
```typescript
interface ThoughtResponse {
  id: string;
  questionId: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  content: string;
  likeCount: number;
  isLiked: boolean;  // 현재 사용자가 좋아요했는지
  isOwner: boolean;  // 현재 사용자가 작성자인지
  createdAt: string;
}
```

#### 4.2.3 답변 좋아요 API

| 메서드 | 엔드포인트 | 인증 | 설명 |
|--------|-----------|------|------|
| POST | `/api/thoughts/[id]/like` | requireAuth | 답변 좋아요 |
| DELETE | `/api/thoughts/[id]/like` | requireAuth | 답변 좋아요 해제 |

### 4.3 컴포넌트 아키텍처

#### 4.3.1 페이지 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| QuestionsPage | `src/app/community/questions/page.tsx` | 질문 피드 페이지 |
| QuestionDetailPage | `src/app/community/questions/[id]/page.tsx` | 질문 상세 + 답변 목록 |

#### 4.3.2 신규 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| QuestionFeed | `src/components/community/QuestionFeed.tsx` | 질문 목록 컨테이너 (무한 스크롤) |
| QuestionCard | `src/components/community/QuestionCard.tsx` | 질문 카드 (작성자, 내용 미리보기, 답변 수) |
| QuestionDetail | `src/components/community/QuestionDetail.tsx` | 질문 상세 뷰 (전문 + 해시태그) |
| QuestionForm | `src/components/community/QuestionForm.tsx` | 질문 작성 폼 (모달 또는 인라인) |
| ThoughtList | `src/components/community/ThoughtList.tsx` | 답변 목록 (무한 스크롤) |
| ThoughtCard | `src/components/community/ThoughtCard.tsx` | 개별 답변 카드 (작성자, 내용, 좋아요) |
| ThoughtForm | `src/components/community/ThoughtForm.tsx` | 답변 작성 폼 |
| ThoughtLikeButton | `src/components/community/ThoughtLikeButton.tsx` | 답변 좋아요 버튼 (낙관적 업데이트) |
| QuestionFilters | `src/components/community/QuestionFilters.tsx` | 정렬/태그 필터 |
| HashtagChip | `src/components/community/HashtagChip.tsx` | 해시태그 칩 (클릭 시 필터링) |
| CommunityNav | `src/components/community/CommunityNav.tsx` | 커뮤니티 상단 네비게이션 (질문/커피챗 탭) |

#### 4.3.3 커스텀 훅

| 훅 | 경로 | 용도 |
|----|------|------|
| useQuestions | `src/hooks/useQuestions.ts` | 질문 CRUD + 무한 스크롤 |
| useThoughts | `src/hooks/useThoughts.ts` | 답변 CRUD + 무한 스크롤 |
| useThoughtLike | `src/hooks/useThoughtLike.ts` | 답변 좋아요 토글 (낙관적 업데이트) |

#### 4.3.4 타입 정의

`src/types/question.ts`:
```typescript
export interface Question {
  id: string;
  authorId: string;
  content: string;
  hashtags: string[];
  thoughtCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionWithAuthor extends Question {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  isOwner: boolean;
}

export interface Thought {
  id: string;
  questionId: string;
  authorId: string;
  content: string;
  likeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThoughtWithAuthor extends Thought {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  isLiked: boolean;
  isOwner: boolean;
}
```

### 4.4 레이아웃 명세

#### 4.4.1 질문 피드 (`/community/questions`)

```
+----------------------------------------+
|   [커뮤니티 네비게이션 탭]               |
|   [질문]  [커피챗]                      |
+----------------------------------------+
|   [정렬: 최신순 | 인기순]  [태그 필터]   |
+----------------------------------------+
|   +----------------------------------+ |
|   | [아바타] 작성자명    2시간 전      | |
|   | "여러분의 커리어 전환 계기가       | |
|   |  무엇인가요?"                     | |
|   | #커리어 #전환 #조언               | |
|   | 답변 12개                         | |
|   +----------------------------------+ |
|   +----------------------------------+ |
|   | [아바타] 작성자명    1일 전        | |
|   | "프리랜서 초기에 고객을 어떻게     | |
|   |  확보하셨나요?"                   | |
|   | #프리랜서 #영업                    | |
|   | 답변 8개                          | |
|   +----------------------------------+ |
|                                        |
|        [+ 질문하기] FAB               |
+----------------------------------------+
```

#### 4.4.2 질문 상세 (`/community/questions/[id]`)

```
+----------------------------------------+
|   [< 뒤로]                             |
+----------------------------------------+
|   [아바타] 작성자명          2시간 전   |
|                                        |
|   "여러분의 커리어 전환 계기가          |
|    무엇인가요? 현재 개발자인데          |
|    다른 분야로의 전환을 고민 중입니다." |
|                                        |
|   #커리어 #전환 #조언                   |
+----------------------------------------+
|   답변 12개  |  최신순 ▼                |
+----------------------------------------+
|   +----------------------------------+ |
|   | [아바타] 답변자1     1시간 전     | |
|   | "저는 3년 전에 마케팅에서         | |
|   |  개발로 전환했는데..."            | |
|   |              [하트 5]  [삭제]     | |
|   +----------------------------------+ |
|   +----------------------------------+ |
|   | [아바타] 답변자2     30분 전      | |
|   | "전환보다는 현재 영역에서의        | |
|   |  확장을 추천드립니다..."          | |
|   |              [하트 3]             | |
|   +----------------------------------+ |
|                                        |
|   +----------------------------------+ |
|   | [나의 생각을 공유해 주세요...]     | |
|   |                        [보내기]   | |
|   +----------------------------------+ |
+----------------------------------------+
```

### 4.5 통합 포인트

#### 4.5.1 커뮤니티 피드 통합

- `/gallery` 페이지에 커뮤니티 네비게이션 추가 (카드 피드 / 질문 / 커피챗 탭)
- `CommunityNav` 컴포넌트를 `/gallery` 레이아웃에 배치

#### 4.5.2 프로필 페이지 통합

- `/profile/[id]` 페이지에 "질문 N개, 답변 N개" 활동 통계 표시
- 프로필에서 사용자의 최근 질문/답변 목록 링크

#### 4.5.3 기존 좋아요 패턴 재사용

- `thought_likes` 테이블은 `card_likes`와 동일한 composite PK 패턴
- `useThoughtLike` 훅은 `useLike` 훅의 낙관적 업데이트 패턴 재사용
- `ThoughtLikeButton`은 `LikeButton` 컴포넌트 디자인 패턴 재사용

### 4.6 Rate Limiting 설계

| 작업 | 제한 | 윈도우 |
|------|------|--------|
| 질문 작성 | 1건 | 60초 |
| 답변 작성 (같은 질문) | 1건 | 30초 |
| 답변 좋아요 | 100건 | 1시간 |

구현: 인메모리 Map 기반 (Cloudflare Workers 환경에서 KV 또는 인메모리 활용)

## 5. Phase 구분

### Phase 1 (현재 SPEC 범위)
- 질문 CRUD (작성, 조회, 삭제)
- 답변(생각) CRUD (작성, 조회, 삭제)
- 답변 좋아요 시스템
- 무한 스크롤 피드
- 해시태그 필터링
- 커뮤니티 네비게이션 탭
- DB 마이그레이션 (questions, thoughts, thought_likes)

### Phase 2 (향후)
- 질문 수정 기능
- 답변 수정 기능
- 이미지 첨부 지원
- 질문 북마크 기능
- 인기 질문 하이라이트

### Phase 3 (향후)
- 알림 시스템 (내 질문에 답변이 달렸을 때)
- 질문 검색 (전문 검색)
- AI 기반 질문 추천
- 주간/월간 베스트 질문 선정

## 6. Traceability (추적성)

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|------------|-----------|----------------|
| REQ-U01 | 전체 컴포넌트 Tailwind 클래스 | ACC-DESIGN-01 |
| REQ-U02 | QuestionFeed, ThoughtList | ACC-RESPONSIVE-01 |
| REQ-U03 | QuestionCard, ThoughtCard | ACC-AUTHOR-01 |
| REQ-U04 | QuestionCard, ThoughtCard | ACC-TIME-01 |
| REQ-E01 | QuestionForm, POST /api/questions | ACC-CREATE-Q-01 |
| REQ-E02 | ThoughtForm, POST /api/questions/[id]/thoughts | ACC-CREATE-T-01 |
| REQ-E03 | QuestionFeed | ACC-FEED-01 |
| REQ-E04 | QuestionDetail, ThoughtList | ACC-DETAIL-01 |
| REQ-E05 | ThoughtLikeButton, POST/DELETE /api/thoughts/[id]/like | ACC-LIKE-01 |
| REQ-E06 | QuestionDetail, DELETE /api/questions/[id] | ACC-DELETE-Q-01 |
| REQ-E07 | ThoughtCard, DELETE /api/questions/[id]/thoughts/[thoughtId] | ACC-DELETE-T-01 |
| REQ-E08 | HashtagChip, QuestionFilters | ACC-TAG-01 |
| REQ-S01 | QuestionForm, ThoughtForm | ACC-UNAUTH-01 |
| REQ-S02 | QuestionFeed | ACC-EMPTY-Q-01 |
| REQ-S03 | ThoughtList | ACC-EMPTY-T-01 |
| REQ-S04 | QuestionCard, ThoughtCard | ACC-OWNER-01 |
| REQ-N01 | API middleware | ACC-AUTH-API-01 |
| REQ-N02 | API ownership check | ACC-AUTHZ-01 |
| REQ-N03 | Rate limiting middleware | ACC-RATE-01 |
| REQ-N04 | Server-side sanitization | ACC-XSS-01 |
