---
id: SPEC-SURVEY-001
type: plan
version: "1.0.0"
created: "2026-03-07"
updated: "2026-03-07"
---

# SPEC-SURVEY-001: 구현 계획

## 1. 작업 분해

### Milestone 1: 데이터 레이어 (Primary Goal)

| 작업 | 파일 | 설명 |
|------|------|------|
| M1-1 | `supabase/migrations/014_add_surveys.sql` | DB 스키마, 인덱스, RLS 정책 생성 |
| M1-2 | `src/types/survey.ts` | TypeScript 타입/인터페이스 정의 |
| M1-3 | `src/lib/survey-storage.ts` | Supabase CRUD 함수 (question-storage.ts 패턴) |

### Milestone 2: API 레이어 (Primary Goal)

| 작업 | 파일 | 설명 |
|------|------|------|
| M2-1 | `src/app/api/surveys/route.ts` | GET (목록) + POST (생성) |
| M2-2 | `src/app/api/surveys/[id]/route.ts` | GET (상세) + DELETE (삭제) |
| M2-3 | `src/app/api/surveys/[id]/vote/route.ts` | POST (투표 등록/변경) |

### Milestone 3: 커스텀 훅 (Secondary Goal)

| 작업 | 파일 | 설명 |
|------|------|------|
| M3-1 | `src/hooks/useSurveys.ts` | 설문 목록 + 무한 스크롤 |
| M3-2 | `src/hooks/useSurveyDetail.ts` | 설문 상세 조회 |
| M3-3 | `src/hooks/useSurveyVote.ts` | 투표 + 낙관적 업데이트 |
| M3-4 | `src/hooks/useSurveyCreate.ts` | 설문 생성 |

### Milestone 4: UI 컴포넌트 (Secondary Goal)

| 작업 | 파일 | 설명 |
|------|------|------|
| M4-1 | `src/components/survey/SurveyCard.tsx` | 피드 카드 |
| M4-2 | `src/components/survey/SurveyFeed.tsx` | 무한 스크롤 피드 |
| M4-3 | `src/components/survey/SurveyForm.tsx` | 생성 모달 |
| M4-4 | `src/components/survey/SurveyVoteUI.tsx` | 투표 선택 UI |
| M4-5 | `src/components/survey/SurveyResults.tsx` | 결과 바 차트 |
| M4-6 | `src/components/survey/SurveyDetail.tsx` | 상세 페이지 컴포넌트 |
| M4-7 | `src/components/survey/SurveyFilters.tsx` | 정렬/필터 |
| M4-8 | `src/components/survey/OfficialBadge.tsx` | 공식 배지 |

### Milestone 5: 라우트/페이지 + 네비게이션 (Final Goal)

| 작업 | 파일 | 설명 |
|------|------|------|
| M5-1 | `src/app/community/surveys/page.tsx` | 설문 피드 페이지 |
| M5-2 | `src/app/community/surveys/[id]/page.tsx` | 설문 상세 페이지 |
| M5-3 | `src/components/community/CommunityNav.tsx` | 탭 추가 (질문 \| 설문 \| 커피챗) |

### Milestone 6: 관리자 기능 (Optional Goal)

| 작업 | 파일 | 설명 |
|------|------|------|
| M6-1 | `src/app/api/admin/surveys/route.ts` 또는 기존 관리 API 확장 | 관리자 삭제, 공식 설문 생성 |

## 2. 기술 사양

### 2.1 재사용 패턴

| 패턴 | 소스 | 적용 위치 |
|------|------|-----------|
| `requireAuth` / `AuthError` | `src/lib/auth-utils.ts` | 모든 인증 필요 API |
| `stripHtml()` | `src/lib/sanitize.ts` | POST /surveys, POST /vote |
| 커서 기반 페이지네이션 | `src/lib/question-storage.ts` | `survey-storage.ts` |
| `react-intersection-observer` | `useQuestions.ts` | `useSurveys.ts` |
| `QuestionForm` 모달 패턴 | `src/components/community/QuestionForm.tsx` | `SurveyForm.tsx` |
| `QuestionFilters` 필터 패턴 | `src/components/community/QuestionFilters.tsx` | `SurveyFilters.tsx` |
| `fetchUserProfiles()` | `src/lib/profile-utils.ts` | 설문 작성자 프로필 |
| GIN 인덱스 + `@>` 연산자 | `011_add_questions_thoughts.sql` | 해시태그 검색 |

### 2.2 낙관적 업데이트 전략

투표 시 Optimistic UI 패턴:

1. 사용자가 옵션 선택 시 즉시 UI에 결과 반영 (로컬 상태 갱신)
2. API 요청을 백그라운드로 전송
3. 성공 시: 서버 응답으로 정확한 수치 갱신
4. 실패 시: 이전 상태로 롤백 + 에러 토스트 표시

### 2.3 Rate Limiting 구현

`question-storage.ts`의 `checkQuestionRateLimit` 패턴을 재사용:

```
1. DB에서 해당 사용자의 최근 설문 생성 시각 조회
2. 마지막 생성으로부터 5분 미경과 시 429 반환
3. 경과 시 정상 처리
```

### 2.4 설문 마감 처리

- 클라이언트: `closes_at`과 현재 시각 비교로 UI 상태 결정
- 서버: 투표 API에서 `closes_at < now()` 체크 후 400 반환
- 별도 cron/스케줄러 불필요 (조회 시점 기준 판단)

## 3. 리스크 분석

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 동시 투표로 인한 vote_count 불일치 | 중 | DB 트랜잭션 내에서 count 갱신, 또는 집계 쿼리 사용 |
| 대량 투표 시 성능 저하 | 낮 | 인덱스 최적화, 캐싱 고려 (Phase 2) |
| 복수 선택 모드의 투표 변경 복잡성 | 중 | 기존 투표 전체 삭제 후 재삽입 전략 |
| Cloudflare Workers의 실행 시간 제한 | 낮 | 단순 CRUD로 실행 시간 최소화 |
| RLS 정책 누락으로 인한 보안 취약점 | 높 | 마이그레이션 내 RLS 정책 포함, 테스트 검증 |

## 4. 구현 순서

```
M1 (데이터) → M2 (API) → M3 (훅) → M4 (컴포넌트) → M5 (페이지) → M6 (관리자)
```

- M1, M2는 순차 (의존성)
- M3, M4는 일부 병렬 가능 (타입 정의 완료 후)
- M5는 M3, M4 완료 후
- M6은 독립적 (선택)

## 5. 추적성 태그

- SPEC: `SPEC-SURVEY-001`
- DB: `014_add_surveys.sql`
- API: `/api/surveys/*`
- Component: `src/components/survey/*`
- Hook: `src/hooks/useSurvey*.ts`
- Route: `/community/surveys/*`
