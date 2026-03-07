---
id: SPEC-SURVEY-001
type: acceptance
version: "1.0.0"
created: "2026-03-07"
updated: "2026-03-07"
---

# SPEC-SURVEY-001: 인수 기준

## 1. 핵심 시나리오

### TC-E01: 설문 생성 성공

```gherkin
Given 인증된 사용자가 로그인 상태이고
  And 마지막 설문 생성으로부터 5분 이상 경과했을 때
When 사용자가 질문 "가장 선호하는 개발 언어는?", 옵션 ["Python", "TypeScript", "Go"], 단일 선택 모드로 설문을 생성하면
Then 설문이 DB에 저장되고
  And 3개의 옵션이 position 0, 1, 2로 저장되고
  And total_votes는 0이고
  And 201 응답과 함께 생성된 설문 데이터가 반환된다
```

### TC-E02: 투표 등록 성공

```gherkin
Given 인증된 사용자가 아직 투표하지 않은 열린 설문이 있을 때
When 사용자가 "Python" 옵션을 선택하여 투표하면
Then survey_votes 테이블에 투표가 기록되고
  And 해당 옵션의 vote_count가 1 증가하고
  And 설문의 total_votes가 1 증가하고
  And 투표 결과(바 차트)가 표시된다
```

### TC-E03: 투표 변경 성공

```gherkin
Given 인증된 사용자가 "Python"에 투표한 단일 선택 설문이 있을 때
When 사용자가 "TypeScript"로 투표를 변경하면
Then "Python"의 vote_count가 1 감소하고
  And "TypeScript"의 vote_count가 1 증가하고
  And total_votes는 변경되지 않고
  And 결과 차트에서 "TypeScript"가 사용자 선택으로 하이라이트된다
```

### TC-N02: 마감된 설문 투표 차단

```gherkin
Given closes_at이 과거 시각인 마감된 설문이 있을 때
When 인증된 사용자가 투표를 시도하면
Then 400 에러가 반환되고
  And "설문이 마감되었습니다" 메시지가 표시되고
  And 투표 UI가 비활성화 상태로 결과만 표시된다
```

### TC-N04: Rate Limiting 적용

```gherkin
Given 인증된 사용자가 방금 설문을 생성했을 때
When 5분 이내에 새 설문을 생성하려고 하면
Then 429 에러가 반환되고
  And 다음 생성 가능 시각이 안내된다
```

### TC-S04: 공식 설문 상단 고정

```gherkin
Given is_official=true인 공식 설문 2개와 일반 설문 5개가 있을 때
When 사용자가 설문 피드를 조회하면
Then 공식 설문 2개가 피드 최상단에 고정 표시되고
  And 공식 배지(OfficialBadge)가 표시되고
  And 나머지 일반 설문은 정렬 기준에 따라 아래에 표시된다
```

### TC-E01-MULTI: 복수 선택 투표

```gherkin
Given 복수 선택(multi) 모드의 설문이 3개 옵션으로 생성되었을 때
When 인증된 사용자가 옵션 1과 옵션 3을 선택하여 투표하면
Then survey_votes에 2개의 레코드가 생성되고
  And 옵션 1과 옵션 3의 vote_count가 각각 1 증가하고
  And total_votes는 1 증가한다 (참여자 수 기준)
```

## 2. 엣지 케이스 시나리오

### TC-EDGE-01: 최소 옵션 수 검증

```gherkin
Given 인증된 사용자가 설문 생성 폼을 열었을 때
When 옵션을 1개만 입력하고 제출하면
Then 400 에러가 반환되고
  And "최소 2개의 옵션이 필요합니다" 메시지가 표시된다
```

### TC-EDGE-02: 최대 옵션 수 검증

```gherkin
Given 인증된 사용자가 설문 생성 폼에서 10개 옵션을 입력했을 때
When 11번째 옵션을 추가하려고 하면
Then "옵션 추가" 버튼이 비활성화되고
  And "최대 10개까지 가능합니다" 안내가 표시된다
```

### TC-EDGE-03: 질문 길이 검증

```gherkin
Given 인증된 사용자가 설문 생성 폼을 열었을 때
When 9자 이하 또는 501자 이상의 질문을 입력하면
Then 제출 버튼이 비활성화되고
  And 글자 수 카운터가 경고 색상으로 표시된다
```

### TC-EDGE-04: XSS 방지

```gherkin
Given 사용자가 질문에 "<script>alert('xss')</script>나쁜질문"을 입력했을 때
When 설문이 생성되면
Then 저장된 질문 텍스트는 "나쁜질문"으로 HTML 태그가 제거되고
  And 클라이언트에서 렌더링 시 스크립트가 실행되지 않는다
```

### TC-EDGE-05: 동시 투표 처리

```gherkin
Given 2명의 사용자가 동시에 같은 옵션에 투표할 때
When 두 요청이 거의 동시에 처리되면
Then 두 투표 모두 정상 기록되고
  And vote_count는 정확히 2 증가한다
```

### TC-EDGE-06: 삭제된 설문 접근

```gherkin
Given 설문이 작성자에 의해 삭제되었을 때
When 다른 사용자가 해당 설문 URL에 접근하면
Then 404 에러가 반환되고
  And "설문을 찾을 수 없습니다" 메시지가 표시된다
```

## 3. 성능 기준

| 항목 | 기준 |
|------|------|
| 설문 목록 API 응답 시간 | P95 < 300ms |
| 투표 API 응답 시간 | P95 < 200ms |
| 설문 생성 API 응답 시간 | P95 < 500ms |
| 무한 스크롤 다음 페이지 로딩 | < 500ms (체감) |
| 낙관적 업데이트 UI 반영 | < 50ms |
| 결과 바 차트 렌더링 | < 100ms |

## 4. 보안 검증 기준

| 항목 | 검증 방법 |
|------|-----------|
| 비인증 사용자 투표 차단 | 401 응답 확인 (REQ-N03) |
| 비인증 사용자 설문 생성 차단 | 401 응답 확인 |
| XSS 방지 | stripHtml() 적용 확인 (REQ-U02) |
| RLS 정책 적용 | 다른 사용자의 설문 삭제 시도 시 차단 확인 |
| 관리자 권한 검증 | 비관리자의 관리자 기능 접근 차단 확인 |
| Rate Limiting | 5분 내 중복 생성 시 429 확인 (REQ-N04) |
| SQL Injection 방지 | Supabase 파라미터 바인딩 사용 확인 |
| CSRF 방지 | Supabase Auth 토큰 기반 인증 확인 |

## 5. UI/UX 검증 기준

| 항목 | 기준 |
|------|------|
| 디자인 시스템 일관성 | 딥 네이비, 오프 화이트, 0px radius, Figtree/Anonymous Pro |
| 반응형 레이아웃 | 모바일(375px) ~ 데스크톱(1440px) |
| 투표 후 전환 애니메이션 | 옵션 → 결과 바 차트 전환 시 부드러운 트랜지션 |
| 로딩 상태 표시 | 피드 로딩, 투표 처리 중 스켈레톤/스피너 |
| 에러 상태 표시 | 네트워크 오류 시 재시도 안내 |
| 빈 상태 표시 | 설문 없을 때 안내 메시지 + 생성 유도 |

## 6. Definition of Done

- [ ] DB 마이그레이션 `014_add_surveys.sql` 적용 완료
- [ ] 모든 API 엔드포인트 구현 및 에러 처리 완료
- [ ] RLS 정책 적용 및 검증 완료
- [ ] CommunityNav에 "설문" 탭 추가 완료
- [ ] 설문 피드 페이지 (무한 스크롤) 구현 완료
- [ ] 설문 상세 페이지 (투표 + 결과) 구현 완료
- [ ] 설문 생성 모달 구현 완료
- [ ] 낙관적 업데이트 동작 확인
- [ ] Rate Limiting 동작 확인
- [ ] stripHtml() 새니타이제이션 적용 확인
- [ ] 공식 설문 상단 고정 동작 확인
- [ ] 디자인 시스템 일관성 확인
- [ ] 모바일/데스크톱 반응형 확인
- [ ] 주요 시나리오 수동 테스트 통과
