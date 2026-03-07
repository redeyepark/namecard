---
id: SPEC-SURVEY-001
title: Community Survey/Poll System
version: "1.0.0"
status: draft
created: "2026-03-07"
updated: "2026-03-07"
author: MoAI
priority: high
tags: [community, survey, poll, voting, engagement]
related_specs: [SPEC-COMMUNITY-003, SPEC-COMMUNITY-004]
lifecycle: spec-anchored
---

# SPEC-SURVEY-001: 커뮤니티 설문/투표 시스템

## HISTORY

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-03-07 | 1.0.0 | 초기 SPEC 작성 |

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
| 테스트 | Vitest + Testing Library | 4.0.18 / 16.3.2 |

### 1.2 디자인 시스템

- 색상: 딥 네이비(`#020912`) + 오프 화이트(`#fcfcfc`)
- 모서리: 0px border-radius (날카로운 모서리)
- 폰트: Figtree (제목/헤딩) + Anonymous Pro (본문/모노)
- 스타일: 미니멀리스트 갤러리

### 1.3 영향 범위

- 신규 라우트: `/community/surveys`, `/community/surveys/[id]`
- 신규 API: `/api/surveys`, `/api/surveys/[id]`, `/api/surveys/[id]/vote`
- 신규 컴포넌트: `src/components/survey/`
- 신규 타입: `src/types/survey.ts`
- 신규 훅: `src/hooks/useSurveys.ts`, `src/hooks/useSurveyVote.ts`
- 신규 스토리지: `src/lib/survey-storage.ts`
- DB 마이그레이션: `014_add_surveys.sql`
- 기존 변경: `CommunityNav` 탭 추가 (질문 | **설문** | 커피챗)

### 1.4 현재 상태 (Before)

현재 커뮤니티에는 설문/투표 기능이 없음:
- 질문/생각 공유(SPEC-COMMUNITY-003)는 자유 텍스트 기반 Q&A
- 커피챗(SPEC-COMMUNITY-004)은 1:1 네트워킹 매칭
- 구조화된 의견 수집 및 투표 메커니즘 부재
- 커뮤니티 참여도를 높일 인터랙티브 콘텐츠 필요

## 2. Assumptions (가정)

- A01: `user_profiles` 테이블의 사용자 정보(display_name, avatar_url)를 설문 작성자/투표자 정보로 활용한다
- A02: 기존 인증 시스템(`requireAuth`, `getServerUser`)을 그대로 사용하여 설문 생성 및 투표 권한을 제어한다
- A03: 설문 옵션 수는 최소 2개, 최대 10개로 제한한다
- A04: 단일 선택(single-select)과 복수 선택(multi-select) 두 가지 모드를 지원한다
- A05: 투표 변경은 설문 마감 전까지 가능하며, 변경 시 기존 투표를 덮어쓴다
- A06: 설문 마감 후에는 투표 불가하며, 결과만 조회 가능하다
- A07: 이미지 첨부는 Phase 1에서 제외하며, 텍스트 기반 설문만 지원한다
- A08: 설문 결과는 투표 참여 후 또는 설문 마감 후 공개된다

## 3. Requirements (요구사항)

### 3.1 Ubiquitous (항상 적용)

**REQ-U01: 디자인 시스템 일관성**
시스템은 **항상** 기존 디자인 시스템을 적용해야 한다: 딥 네이비(`#020912`), 오프 화이트(`#fcfcfc`), 0px border-radius, Figtree/Anonymous Pro 폰트.

**REQ-U02: 입력 위생 처리**
시스템은 **항상** 모든 사용자 입력에 `stripHtml()` 서버사이드 새니타이제이션을 적용해야 한다.

**REQ-U03: 응답 형식 일관성**
시스템은 **항상** API 응답에서 성공 시 데이터 객체, 실패 시 `{ error: string }` 형식을 사용해야 한다.

**REQ-U04: 커서 기반 페이지네이션**
시스템은 **항상** 설문 목록 조회 시 `created_at` 기반 커서 페이지네이션을 사용해야 한다.

### 3.2 Event-Driven (이벤트 기반)

**REQ-E01: 설문 생성**
**WHEN** 인증된 사용자가 설문 생성 폼을 제출하면 **THEN** 시스템은 입력을 검증하고, 설문과 옵션을 DB에 저장하고, 생성된 설문을 반환한다.

**REQ-E02: 투표 등록**
**WHEN** 인증된 사용자가 설문 옵션을 선택하고 투표하면 **THEN** 시스템은 투표를 기록하고, 해당 옵션의 `vote_count`를 증가시키고, 설문의 `total_votes`를 갱신한다.

**REQ-E03: 투표 변경**
**WHEN** 이미 투표한 사용자가 다른 옵션을 선택하면 **THEN** 시스템은 기존 투표를 삭제하고, 새 옵션에 투표를 기록하고, 양쪽 옵션의 `vote_count`를 갱신한다.

**REQ-E04: 설문 삭제**
**WHEN** 설문 작성자 또는 관리자가 삭제를 요청하면 **THEN** 시스템은 해당 설문, 옵션, 투표 데이터를 모두 삭제한다.

**REQ-E05: 설문 마감**
**WHEN** 설문의 `closes_at` 시각이 도래하면 **THEN** 시스템은 해당 설문의 상태를 `closed`로 간주하고, 추가 투표를 차단한다.

### 3.3 State-Driven (상태 기반)

**REQ-S01: 투표 전 상태**
**IF** 사용자가 아직 투표하지 않았고 설문이 열려 있으면 **THEN** 투표 UI(옵션 선택 + 투표 버튼)를 표시한다.

**REQ-S02: 투표 후 상태**
**IF** 사용자가 이미 투표했으면 **THEN** 투표 결과(바 차트 + 비율 + 수치)와 함께 자신의 선택을 하이라이트하여 표시한다.

**REQ-S03: 마감된 설문**
**IF** 설문이 마감되었으면(`closes_at < now()`) **THEN** 투표 UI를 비활성화하고 결과만 표시한다.

**REQ-S04: 공식 설문 표시**
**IF** 설문이 공식(is_official = true)이면 **THEN** 피드에서 상단 고정(pinned)으로 표시한다.

### 3.4 Optional (선택적)

**REQ-O01: 해시태그 필터링**
가능하면 설문에 해시태그를 추가하고, 해시태그별 필터링을 제공한다.

**REQ-O02: 정렬 옵션**
가능하면 설문 피드에서 최신순(`latest`) / 인기순(`popular`, 총 투표 수 기준) 정렬을 제공한다.

### 3.5 Unwanted (금지사항)

**REQ-N01: 중복 투표 금지**
시스템은 단일 선택 모드에서 한 사용자가 동일 설문에 복수 옵션에 투표**하지 않아야 한다**.

**REQ-N02: 마감 후 투표 금지**
시스템은 마감된 설문에 대한 투표를 **허용하지 않아야 한다**.

**REQ-N03: 비인증 투표 금지**
시스템은 인증되지 않은 사용자의 투표를 **허용하지 않아야 한다**.

**REQ-N04: 과도한 설문 생성 금지**
시스템은 동일 사용자가 5분 이내에 복수의 설문을 생성하는 것을 **허용하지 않아야 한다**.

## 4. Specifications (사양)

### 4.1 데이터베이스 스키마

```sql
-- 014_add_surveys.sql

-- 설문 테이블
CREATE TABLE community_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  select_mode TEXT NOT NULL DEFAULT 'single' CHECK (select_mode IN ('single', 'multi')),
  hashtags TEXT[] DEFAULT '{}',
  is_official BOOLEAN NOT NULL DEFAULT false,
  total_votes INTEGER NOT NULL DEFAULT 0,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 설문 옵션 테이블
CREATE TABLE survey_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES community_surveys(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 투표 테이블
CREATE TABLE survey_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES community_surveys(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES survey_options(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(survey_id, option_id, voter_id)
);

-- 인덱스
CREATE INDEX idx_surveys_author ON community_surveys(author_id);
CREATE INDEX idx_surveys_created_at ON community_surveys(created_at DESC);
CREATE INDEX idx_surveys_hashtags ON community_surveys USING GIN (hashtags);
CREATE INDEX idx_surveys_official ON community_surveys(is_official) WHERE is_official = true;
CREATE INDEX idx_survey_options_survey ON survey_options(survey_id, position);
CREATE INDEX idx_survey_votes_survey ON survey_votes(survey_id);
CREATE INDEX idx_survey_votes_voter ON survey_votes(voter_id, survey_id);

-- RLS 정책
ALTER TABLE community_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_votes ENABLE ROW LEVEL SECURITY;

-- 설문: 누구나 읽기, 인증 사용자만 생성, 작성자/관리자만 삭제
CREATE POLICY "surveys_select" ON community_surveys FOR SELECT USING (true);
CREATE POLICY "surveys_insert" ON community_surveys FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "surveys_delete" ON community_surveys FOR DELETE
  USING (auth.uid() = author_id);

-- 옵션: 누구나 읽기, 설문 작성자만 생성
CREATE POLICY "options_select" ON survey_options FOR SELECT USING (true);
CREATE POLICY "options_insert" ON survey_options FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM community_surveys WHERE id = survey_id AND author_id = auth.uid())
  );

-- 투표: 누구나 읽기, 인증 사용자만 생성/삭제
CREATE POLICY "votes_select" ON survey_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON survey_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "votes_delete" ON survey_votes FOR DELETE
  USING (auth.uid() = voter_id);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_survey_updated_at
  BEFORE UPDATE ON community_surveys
  FOR EACH ROW EXECUTE FUNCTION update_survey_updated_at();
```

### 4.2 API 엔드포인트

#### GET /api/surveys

설문 목록 조회 (공개, 커서 기반 페이지네이션)

**Query Parameters:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| cursor | string | - | 페이지네이션 커서 (created_at) |
| limit | number | 20 | 항목 수 (max 50) |
| sort | string | latest | 정렬 (latest / popular) |
| tag | string | - | 해시태그 필터 |

**Response 200:**
```typescript
{
  data: Survey[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

#### POST /api/surveys

설문 생성 (인증 필요)

**Request Body:**
```typescript
{
  question: string;       // 10-500자
  options: string[];      // 2-10개, 각 1-200자
  selectMode: 'single' | 'multi';
  hashtags?: string[];    // 최대 5개, 각 최대 20자
  closesAt?: string;      // ISO 8601 날짜/시각 (선택)
}
```

**Response 201:**
```typescript
{
  data: Survey;
}
```

**Error 429:** 5분 내 중복 생성 시

#### GET /api/surveys/[id]

설문 상세 조회

**Response 200:**
```typescript
{
  data: SurveyDetail;
}
```

#### POST /api/surveys/[id]/vote

투표 등록/변경 (인증 필요)

**Request Body:**
```typescript
{
  optionIds: string[];  // 단일 선택: 1개, 복수 선택: 1개 이상
}
```

**Response 200:**
```typescript
{
  data: {
    survey: SurveyDetail;
    userVotes: string[];  // 투표한 option ID 배열
  }
}
```

**Error 400:** 마감된 설문, 유효하지 않은 옵션
**Error 401:** 비인증

#### DELETE /api/surveys/[id]

설문 삭제 (작성자 또는 관리자)

**Response 200:**
```typescript
{ success: true }
```

### 4.3 TypeScript 타입 정의

```typescript
// src/types/survey.ts

export interface Survey {
  id: string;
  authorId: string;
  question: string;
  selectMode: 'single' | 'multi';
  hashtags: string[];
  isOfficial: boolean;
  totalVotes: number;
  closesAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  options: SurveyOption[];
  isClosed: boolean;
}

export interface SurveyOption {
  id: string;
  label: string;
  position: number;
  voteCount: number;
}

export interface SurveyDetail extends Survey {
  userVotes: string[];  // 현재 사용자의 투표 option IDs
  hasVoted: boolean;
}

export interface CreateSurveyInput {
  question: string;
  options: string[];
  selectMode: 'single' | 'multi';
  hashtags?: string[];
  closesAt?: string;
}

export interface VoteInput {
  optionIds: string[];
}

export interface SurveyListResponse {
  data: Survey[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### 4.4 컴포넌트 아키텍처

```
src/components/survey/
  SurveyCard.tsx        - 피드 카드 (질문 + 옵션 미리보기 + 투표 수)
  SurveyFeed.tsx        - 무한 스크롤 피드 (react-intersection-observer)
  SurveyForm.tsx        - 설문 생성 모달 (QuestionForm 패턴 재사용)
  SurveyDetail.tsx      - 설문 상세 + 투표 UI + 결과 시각화
  SurveyVoteUI.tsx      - 투표 옵션 선택 UI (라디오/체크박스)
  SurveyResults.tsx     - 결과 시각화 (수평 바 차트)
  SurveyFilters.tsx     - 정렬/해시태그 필터 (QuestionFilters 패턴 재사용)
  OfficialBadge.tsx     - 공식 설문 배지
```

```
src/hooks/
  useSurveys.ts         - 설문 목록 조회 + 무한 스크롤
  useSurveyDetail.ts    - 설문 상세 조회
  useSurveyVote.ts      - 투표 등록/변경 (낙관적 업데이트)
  useSurveyCreate.ts    - 설문 생성
```

```
src/lib/
  survey-storage.ts     - DB CRUD 함수 (question-storage.ts 패턴 재사용)
```

### 4.5 레이아웃 모형 (ASCII)

#### 설문 피드 (`/community/surveys`)

```
+--------------------------------------------------+
| [질문]  [설문]  [커피챗]                           |  <- CommunityNav
+--------------------------------------------------+
| [최신순 v]  [#해시태그]                             |  <- SurveyFilters
+--------------------------------------------------+
| +----------------------------------------------+ |
| | [공식] 올해 가장 기대되는 기능은?              | |  <- pinned official
| | by 관리자 · 3시간 전 · 42표                    | |
| | ○ 다크 모드  ○ 알림 기능  ○ 채팅  ○ 기타      | |
| | [투표하기]                                      | |
| +----------------------------------------------+ |
|                                                    |
| +----------------------------------------------+ |
| | 네트워킹 이벤트 언제가 좋나요?                  | |
| | by 김개발 · 1시간 전 · 15표                    | |
| | ○ 평일 저녁  ○ 주말 오전  ○ 주말 오후          | |
| | [투표하기]                                      | |
| +----------------------------------------------+ |
+--------------------------------------------------+
| [+ 설문 만들기]                      <- FAB 버튼  |
+--------------------------------------------------+
```

#### 투표 결과 시각화

```
+----------------------------------------------+
| 올해 가장 기대되는 기능은?                      |
| by 관리자 · 마감: 2026-03-14                   |
+----------------------------------------------+
| 다크 모드    ████████████████░░░░  45% (19표)  |
| 알림 기능    ████████░░░░░░░░░░░░  24% (10표)  |
| 채팅         ██████░░░░░░░░░░░░░░  19% (8표)   |
| 기타         █████░░░░░░░░░░░░░░░  12% (5표)   |  <- 내 선택 하이라이트
+----------------------------------------------+
| 총 42명 참여                                    |
+----------------------------------------------+
```

#### 설문 생성 모달

```
+----------------------------------------------+
|  X  설문 만들기                                 |
+----------------------------------------------+
| 질문 *                                          |
| [                                             ] |
| (10-500자)                                      |
+----------------------------------------------+
| 선택 모드                                       |
| (●) 단일 선택  ( ) 복수 선택                     |
+----------------------------------------------+
| 옵션 *                                          |
| [옵션 1                                      ] |
| [옵션 2                                      ] |
| [+ 옵션 추가] (최대 10개)                        |
+----------------------------------------------+
| 마감 일시 (선택)                                 |
| [____-__-__ __:__]                              |
+----------------------------------------------+
| 해시태그 (선택)                                  |
| [#태그1] [#태그2] [+]                           |
+----------------------------------------------+
| [취소]                      [설문 등록]          |
+----------------------------------------------+
```

## 5. Constraints (제약사항)

- C01: Cloudflare Workers 호환성 필수 (`node:*` 모듈 사용 금지)
- C02: Supabase PostgreSQL 및 RLS 정책 기반 보안
- C03: 설문 질문 텍스트: 10-500자
- C04: 설문 옵션: 최소 2개, 최대 10개 (각 1-200자)
- C05: 해시태그: 최대 5개 (각 최대 20자)
- C06: Rate Limit: 사용자당 5분에 1개 설문 생성
- C07: 페이지네이션 limit: 최대 50
- C08: XSS 방지를 위한 `stripHtml()` 적용 필수

## 6. Traceability (추적성)

| 요구사항 | API | DB 테이블 | 컴포넌트 | 테스트 |
|----------|-----|-----------|----------|--------|
| REQ-U01 | - | - | 전체 | TC-U01 |
| REQ-U02 | POST /surveys | - | SurveyForm | TC-U02 |
| REQ-U03 | 전체 API | - | - | TC-U03 |
| REQ-U04 | GET /surveys | community_surveys | SurveyFeed | TC-U04 |
| REQ-E01 | POST /surveys | community_surveys, survey_options | SurveyForm | TC-E01 |
| REQ-E02 | POST /surveys/[id]/vote | survey_votes | SurveyVoteUI | TC-E02 |
| REQ-E03 | POST /surveys/[id]/vote | survey_votes | SurveyVoteUI | TC-E03 |
| REQ-E04 | DELETE /surveys/[id] | 전체 | SurveyDetail | TC-E04 |
| REQ-E05 | - | community_surveys | SurveyDetail | TC-E05 |
| REQ-S01 | GET /surveys/[id] | survey_votes | SurveyVoteUI | TC-S01 |
| REQ-S02 | GET /surveys/[id] | survey_votes | SurveyResults | TC-S02 |
| REQ-S03 | GET /surveys/[id] | community_surveys | SurveyDetail | TC-S03 |
| REQ-S04 | GET /surveys | community_surveys | SurveyFeed | TC-S04 |
| REQ-O01 | GET /surveys?tag= | community_surveys | SurveyFilters | TC-O01 |
| REQ-O02 | GET /surveys?sort= | community_surveys | SurveyFilters | TC-O02 |
| REQ-N01 | POST /vote | survey_votes | SurveyVoteUI | TC-N01 |
| REQ-N02 | POST /vote | community_surveys | SurveyVoteUI | TC-N02 |
| REQ-N03 | POST /vote | - | - | TC-N03 |
| REQ-N04 | POST /surveys | - | SurveyForm | TC-N04 |

## 7. Phase 구분

### Phase 1 (현재 범위)

- 설문 CRUD (생성, 조회, 삭제)
- 단일/복수 선택 투표
- 투표 변경
- 결과 시각화 (수평 바 차트)
- 커서 기반 페이지네이션 피드
- 해시태그 필터링
- 공식 설문 고정
- Rate Limiting
- CommunityNav 탭 추가

### Phase 2 (향후)

- 설문 이미지 첨부
- 투표 알림 (이메일/인앱)
- 설문 공유 링크 (OG 메타)
- 설문 통계 대시보드

### Phase 3 (장기)

- 설문 템플릿
- 조건부 분기 설문
- 설문 결과 CSV 내보내기
- 익명 투표 옵션
