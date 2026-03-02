---
id: SPEC-COMMUNITY-003
title: Question & Thought Sharing - Acceptance Criteria
version: "2.0.0"
status: draft
created: "2026-03-02"
updated: "2026-03-02"
tags: [SPEC-COMMUNITY-003]
---

# SPEC-COMMUNITY-003: 질문/생각 공유 - 인수 기준

## 1. 핵심 기능 테스트 시나리오

### ACC-CREATE-Q-01: 인증된 사용자의 질문 작성

```gherkin
Scenario: 인증된 사용자가 유효한 질문을 작성한다
  Given 인증된 사용자가 질문 피드 페이지(`/community/questions`)에 있다
  When "질문하기" FAB 버튼을 클릭한다
  And 질문 작성 폼이 모달로 표시된다
  And 질문 내용 "여러분의 커리어 전환 계기가 무엇인가요?" (22자)을 입력한다
  And 해시태그 "#커리어", "#전환"을 추가한다
  And 제출 버튼을 클릭한다
  Then POST /api/questions 요청이 전송된다
  And 질문이 `community_questions` 테이블에 저장된다
  And content 필드에 HTML 태그가 제거된 순수 텍스트만 저장된다
  And hashtags 필드에 ["커리어", "전환"] 배열이 저장된다
  And 질문 피드 목록 최상단에 새 질문이 즉시 표시된다 (낙관적 업데이트)
  And 질문 카드에 작성자의 아바타, display_name, "방금 전" 시간이 표시된다
  And 질문 작성 폼이 닫히고 입력 내용이 초기화된다
```

### ACC-CREATE-T-01: 인증된 사용자의 답변(생각) 작성

```gherkin
Scenario: 인증된 사용자가 질문에 답변을 작성한다
  Given 인증된 사용자가 질문 상세 페이지(`/community/questions/[id]`)에 있다
  And 하단에 "나의 생각을 공유해 주세요..." 입력란이 표시된다
  When 답변 내용 "저는 3년 전에 마케팅에서 개발로 전환했는데, 최고의 선택이었습니다" (34자)을 입력한다
  And "보내기" 버튼을 클릭한다
  Then POST /api/questions/[id]/thoughts 요청이 전송된다
  And 답변이 `community_thoughts` 테이블에 저장된다
  And DB 트리거에 의해 해당 질문의 `thought_count`가 1 증가한다
  And 답변 목록에 새 답변이 즉시 표시된다
  And 새 답변에 작성자 아바타, display_name, "방금 전" 시간이 표시된다
  And 답변 입력란이 초기화되고 포커스가 유지된다
  And 질문 카드(피드)의 답변 수 표시가 1 증가하여 반영된다
```

### ACC-LIKE-01: 답변 좋아요 토글 (낙관적 업데이트)

```gherkin
Scenario: 인증된 사용자가 답변에 좋아요를 누르고 해제한다
  Given 인증된 사용자가 질문 상세 페이지에서 좋아요하지 않은 답변을 보고 있다
  And 해당 답변의 현재 like_count가 5이다
  And 하트 아이콘이 빈 상태로 표시된다

  # 좋아요 추가
  When 하트 버튼을 클릭한다
  Then 즉시(100ms 이내) 하트가 채워진 상태로 변경된다 (낙관적 업데이트)
  And like_count가 6으로 표시된다 (낙관적 업데이트)
  And POST /api/thoughts/[id]/like 요청이 백그라운드로 전송된다
  And `thought_likes` 테이블에 (user_id, thought_id) 레코드가 생성된다
  And DB 트리거에 의해 `community_thoughts.like_count`가 6으로 업데이트된다
  And 서버 응답으로 실제 liked=true, likeCount=6이 반환되어 동기화된다

  # 좋아요 해제
  When 하트 버튼을 다시 클릭한다
  Then 즉시(100ms 이내) 하트가 빈 상태로 변경된다 (낙관적 업데이트)
  And like_count가 5로 표시된다 (낙관적 업데이트)
  And DELETE /api/thoughts/[id]/like 요청이 백그라운드로 전송된다
  And `thought_likes` 테이블에서 해당 레코드가 삭제된다
  And DB 트리거에 의해 `community_thoughts.like_count`가 5로 업데이트된다

Scenario: 좋아요 API 실패 시 낙관적 업데이트 롤백
  Given 인증된 사용자가 좋아요하지 않은 답변(like_count=5)을 보고 있다
  When 하트 버튼을 클릭한다
  And 네트워크 오류로 API 요청이 실패한다
  Then 하트가 빈 상태로 롤백된다
  And like_count가 5로 롤백된다
```

### ACC-TAG-01: 해시태그 필터링

```gherkin
Scenario: 사용자가 해시태그로 질문을 필터링한다
  Given 질문 피드에 다음 질문들이 존재한다:
    | 질문 내용 | 해시태그 |
    | 커리어 전환 계기가 무엇인가요? | #커리어, #전환 |
    | 프리랜서 초기 고객 확보 방법은? | #프리랜서, #영업 |
    | 개발자 연봉 협상 팁이 있나요? | #커리어, #연봉 |

  When "#커리어" 해시태그 칩을 클릭한다
  Then GET /api/questions?tag=커리어 요청이 전송된다
  And "#커리어" 태그가 포함된 질문 2개만 표시된다
  And 활성 필터 영역에 "#커리어" 태그가 강조 표시된다
  And URL 쿼리 파라미터에 tag=커리어가 반영된다

  When 활성 필터의 "#커리어" 해제 버튼(X)을 클릭한다
  Then 전체 질문 목록(3개)이 다시 표시된다
  And URL 쿼리 파라미터에서 tag가 제거된다
```

### ACC-UNAUTH-01: 미인증 사용자 접근 시도

```gherkin
Scenario: 미인증 사용자가 질문 피드를 조회한다
  Given 미인증 사용자가 `/community/questions`에 접근한다
  When 페이지가 로드된다
  Then 질문 목록은 정상적으로 표시된다 (공개 읽기)
  And "질문하기" FAB 버튼 위치에 "로그인 후 참여하세요" 안내와 로그인 버튼이 표시된다

Scenario: 미인증 사용자가 질문 상세에서 답변을 시도한다
  Given 미인증 사용자가 질문 상세 페이지에 있다
  When 답변 작성 영역을 확인한다
  Then 답변 입력란 대신 "로그인 후 생각을 공유해 보세요" 안내와 로그인 버튼이 표시된다

Scenario: 미인증 사용자가 API를 직접 호출한다
  Given 미인증 상태에서 API를 직접 호출한다
  When POST /api/questions 요청을 보낸다
  Then 401 Unauthorized 응답이 반환된다
  And 응답 본문에 "인증이 필요합니다. 로그인해 주세요." 메시지가 포함된다

  When POST /api/questions/[id]/thoughts 요청을 보낸다
  Then 401 Unauthorized 응답이 반환된다

  When POST /api/thoughts/[id]/like 요청을 보낸다
  Then 401 Unauthorized 응답이 반환된다
```

### ACC-DELETE-Q-01: 질문 삭제 (CASCADE)

```gherkin
Scenario: 질문 작성자가 자신의 질문을 삭제한다
  Given 인증된 사용자(user-A)가 자신이 작성한 질문의 상세 페이지에 있다
  And 해당 질문에 답변 3개와 좋아요 5개가 존재한다
  And 삭제 버튼이 표시된다 (isOwner = true)
  When 삭제 버튼을 클릭한다
  Then "질문을 삭제하면 모든 답변도 함께 삭제됩니다. 삭제하시겠습니까?" 확인 대화상자가 표시된다

  When 확인 대화상자에서 "삭제" 버튼을 클릭한다
  Then DELETE /api/questions/[id] 요청이 전송된다
  And `community_questions` 테이블에서 해당 질문이 삭제된다
  And CASCADE에 의해 `community_thoughts` 테이블에서 연관 답변 3개가 삭제된다
  And CASCADE에 의해 `thought_likes` 테이블에서 연관 좋아요 5개가 삭제된다
  And 질문 피드 페이지(`/community/questions`)로 리다이렉트된다
  And 피드에서 해당 질문이 제거되어 있다

Scenario: 삭제 확인 대화상자에서 취소한다
  Given 삭제 확인 대화상자가 표시된 상태에서
  When "취소" 버튼을 클릭한다
  Then 대화상자가 닫히고 질문 상세 페이지가 유지된다
  And 질문과 답변이 그대로 유지된다

Scenario: 타인의 질문 삭제를 시도한다
  Given 사용자 A가 인증된 상태에서
  When 사용자 B가 작성한 질문의 DELETE /api/questions/[id] 요청을 보낸다
  Then 403 Forbidden 응답이 반환된다
  And 질문이 삭제되지 않는다
```

---

## 2. 유효성 검증 시나리오

### ACC-VALIDATE-Q-01: 질문 입력 유효성 검증

```gherkin
Scenario: 질문 내용이 최소 글자 수 미만이다
  Given 인증된 사용자가 질문 작성 폼을 열었다
  When 9자 이하의 내용을 입력한다 (예: "안녕하세요")
  Then "질문은 10자 이상이어야 합니다" 오류 메시지가 표시된다
  And 제출 버튼이 비활성화된다

Scenario: 질문 내용이 최대 글자 수를 초과한다
  Given 인증된 사용자가 질문 작성 폼을 열었다
  When 500자를 초과하는 내용을 입력하려 한다
  Then 500자에서 입력이 제한된다 (maxLength)
  And 글자 수 카운터가 "500/500"을 표시한다

Scenario: 해시태그 개수 제한 초과
  Given 인증된 사용자가 질문 작성 폼에 해시태그 5개를 이미 추가했다
  When 6번째 해시태그를 추가하려 한다
  Then "해시태그는 최대 5개까지 추가할 수 있습니다" 안내가 표시된다
  And 추가 해시태그 입력이 차단된다

Scenario: 해시태그 글자 수 제한 초과
  Given 인증된 사용자가 해시태그를 입력 중이다
  When 20자를 초과하는 해시태그를 입력하려 한다
  Then 20자에서 입력이 제한된다
```

### ACC-VALIDATE-T-01: 답변 입력 유효성 검증

```gherkin
Scenario: 답변 내용이 최소 글자 수 미만이다
  Given 인증된 사용자가 답변 입력란을 보고 있다
  When 4자 이하의 내용을 입력한다
  Then "보내기" 버튼이 비활성화된다

Scenario: 답변 내용이 최대 글자 수를 초과한다
  Given 인증된 사용자가 답변 입력란에 입력 중이다
  When 1000자를 초과하는 내용을 입력하려 한다
  Then 1000자에서 입력이 제한된다 (maxLength)
  And 글자 수 카운터가 "1000/1000"을 표시한다
```

---

## 3. 상태 기반 시나리오

### ACC-EMPTY-Q-01: 빈 질문 피드

```gherkin
Scenario: 질문이 없는 피드를 조회한다
  Given 질문 피드에 게시물이 0개이다
  When `/community/questions` 페이지가 로드된다
  Then "아직 질문이 없습니다. 첫 번째 질문을 올려보세요!" 안내가 표시된다
  And 안내와 함께 질문 작성을 유도하는 아이콘이 표시된다
```

### ACC-EMPTY-T-01: 빈 답변 목록

```gherkin
Scenario: 답변이 없는 질문을 조회한다
  Given 질문에 답변이 0개이다
  When 질문 상세 페이지가 로드된다
  Then "아직 답변이 없습니다. 첫 번째로 생각을 공유해 보세요!" 안내가 표시된다
  And 답변 작성 폼은 정상적으로 표시된다
```

### ACC-OWNER-01: 작성자 식별 및 삭제 권한

```gherkin
Scenario: 본인 질문에 삭제 버튼이 표시된다
  Given 인증된 사용자(user-A)가 자신이 작성한 질문을 보고 있다
  Then 질문 카드/상세에 삭제 버튼이 표시된다

Scenario: 타인 질문에 삭제 버튼이 표시되지 않는다
  Given 인증된 사용자(user-A)가 다른 사용자(user-B)가 작성한 질문을 보고 있다
  Then 질문 카드/상세에 삭제 버튼이 표시되지 않는다

Scenario: 본인 답변에 삭제 버튼이 표시된다
  Given 인증된 사용자(user-A)가 자신이 작성한 답변을 보고 있다
  Then 답변 카드에 삭제 버튼이 표시된다
  When 삭제 버튼을 클릭한다
  Then 답변이 삭제되고 질문의 thought_count가 1 감소한다
```

### ACC-FEED-01: 질문 피드 무한 스크롤

```gherkin
Scenario: 질문 피드를 무한 스크롤로 조회한다
  Given 질문 피드에 30개 이상의 질문이 존재한다
  When `/community/questions` 페이지가 로드된다
  Then 최신순으로 정렬된 첫 20개 질문이 표시된다
  And 각 질문 카드에 작성자 아바타, display_name, 상대 시간, 내용 미리보기, 해시태그, 답변 수가 표시된다

  When 스크롤이 하단에 도달한다 (IntersectionObserver 트리거)
  Then 로딩 인디케이터가 표시된다
  And GET /api/questions?cursor={lastId}&limit=20 요청이 전송된다
  And 다음 20개 질문이 기존 목록 하단에 추가된다

  When 마지막 페이지에서 스크롤이 하단에 도달한다
  Then 추가 데이터 요청이 발생하지 않는다 (hasMore=false)
```

### ACC-FEED-02: 질문 피드 정렬

```gherkin
Scenario: 질문 피드를 인기순으로 정렬한다
  Given 질문 피드 페이지에서 "최신순"이 기본 선택되어 있다
  When "인기순" 정렬 버튼을 클릭한다
  Then GET /api/questions?sort=popular 요청이 전송된다
  And 답변 수(thought_count) 기준 내림차순으로 질문이 재정렬된다
  And 커서 기반 페이지네이션이 인기순 기준으로 동작한다

  When "최신순" 정렬 버튼을 클릭한다
  Then GET /api/questions?sort=latest 요청이 전송된다
  And 작성 시간(created_at) 기준 내림차순으로 질문이 재정렬된다
```

---

## 4. 보안 테스트 시나리오

### ACC-AUTH-API-01: API 인증 검증

```gherkin
Scenario: 모든 쓰기 API에 인증이 필요하다
  Given 미인증 상태에서 API를 직접 호출한다

  When POST /api/questions 요청을 보낸다
  Then 401 Unauthorized 응답이 반환된다

  When DELETE /api/questions/[id] 요청을 보낸다
  Then 401 Unauthorized 응답이 반환된다

  When POST /api/questions/[id]/thoughts 요청을 보낸다
  Then 401 Unauthorized 응답이 반환된다

  When DELETE /api/questions/[id]/thoughts/[thoughtId] 요청을 보낸다
  Then 401 Unauthorized 응답이 반환된다

  When POST /api/thoughts/[id]/like 요청을 보낸다
  Then 401 Unauthorized 응답이 반환된다

Scenario: 읽기 API는 인증 없이 접근 가능하다
  Given 미인증 상태에서 API를 호출한다

  When GET /api/questions 요청을 보낸다
  Then 200 OK 응답과 질문 목록이 반환된다

  When GET /api/questions/[id] 요청을 보낸다
  Then 200 OK 응답과 질문 상세가 반환된다

  When GET /api/questions/[id]/thoughts 요청을 보낸다
  Then 200 OK 응답과 답변 목록이 반환된다
```

### ACC-AUTHZ-01: 소유권 검증

```gherkin
Scenario: 타인의 질문 삭제가 차단된다
  Given 사용자 A가 인증된 상태에서
  When 사용자 B가 작성한 질문의 DELETE /api/questions/[id] 요청을 보낸다
  Then 403 Forbidden 응답이 반환된다
  And 질문이 삭제되지 않는다

Scenario: 타인의 답변 삭제가 차단된다
  Given 사용자 A가 인증된 상태에서
  When 사용자 B가 작성한 답변의 DELETE /api/questions/[qId]/thoughts/[tId] 요청을 보낸다
  Then 403 Forbidden 응답이 반환된다
  And 답변이 삭제되지 않는다
```

### ACC-RATE-01: Rate Limiting

```gherkin
Scenario: 질문 작성 rate limit (1건/60초)
  Given 인증된 사용자가 질문을 1건 작성한 직후
  When 60초 이내에 다시 질문 작성을 시도한다
  Then 429 Too Many Requests 응답이 반환된다
  And "잠시 후 다시 시도해 주세요" 안내가 표시된다

  When 60초가 경과한 후 질문 작성을 시도한다
  Then 질문이 정상적으로 작성된다

Scenario: 답변 작성 rate limit (같은 질문에 1건/30초)
  Given 인증된 사용자가 질문 A에 답변을 1건 작성한 직후
  When 30초 이내에 같은 질문 A에 다시 답변 작성을 시도한다
  Then 429 Too Many Requests 응답이 반환된다

  When 다른 질문 B에 답변 작성을 시도한다
  Then 답변이 정상적으로 작성된다 (질문별 독립 rate limit)

Scenario: 좋아요 rate limit (100건/1시간)
  Given 인증된 사용자가 1시간 이내에 좋아요를 100건 수행했다
  When 101번째 좋아요를 시도한다
  Then 429 Too Many Requests 응답이 반환된다
```

### ACC-XSS-01: XSS 방지

```gherkin
Scenario: HTML 태그가 포함된 질문 입력
  Given 인증된 사용자가 질문 작성 폼에 입력한다
  When "<script>alert('xss')</script>안녕하세요 여러분" 내용을 입력하고 제출한다
  Then 서버에서 HTML 태그가 제거된다
  And DB에 "안녕하세요 여러분"만 저장된다
  And 화면에 순수 텍스트만 렌더링된다

Scenario: HTML 태그가 포함된 답변 입력
  Given 인증된 사용자가 답변 입력란에 입력한다
  When "<img src=x onerror=alert(1)>좋은 의견이네요" 내용을 입력하고 제출한다
  Then 서버에서 HTML 태그가 제거된다
  And DB에 "좋은 의견이네요"만 저장된다
```

---

## 5. 엣지 케이스 시나리오

### ACC-EDGE-01: 존재하지 않는 질문 접근

```gherkin
Scenario: 삭제된 또는 존재하지 않는 질문 ID로 접근한다
  Given 존재하지 않는 질문 ID로 API를 호출한다
  When GET /api/questions/[invalid-id] 요청을 보낸다
  Then 404 Not Found 응답이 반환된다

  When `/community/questions/[invalid-id]` 페이지에 접근한다
  Then "질문을 찾을 수 없습니다" 오류 페이지가 표시된다
  And 질문 피드로 돌아가는 링크가 제공된다
```

### ACC-EDGE-02: 잘못된 UUID 형식 요청

```gherkin
Scenario: UUID가 아닌 형식의 ID로 API를 호출한다
  Given 잘못된 형식의 ID "not-a-uuid"로 API를 호출한다
  When GET /api/questions/not-a-uuid 요청을 보낸다
  Then 400 Bad Request 응답이 반환된다
  And "Invalid question ID" 오류 메시지가 포함된다
```

### ACC-EDGE-03: 중복 좋아요 방지

```gherkin
Scenario: 이미 좋아요한 답변에 좋아요 API를 직접 호출한다
  Given 사용자가 이미 좋아요한 답변이 있다
  When POST /api/thoughts/[id]/like 요청을 다시 보낸다
  Then 좋아요가 해제되는 토글 동작이 수행된다 (중복 INSERT 없음)
  And liked=false, 감소된 likeCount가 반환된다
```

### ACC-EDGE-04: 동시 삭제 경합

```gherkin
Scenario: 질문이 삭제된 후 해당 질문에 답변 작성을 시도한다
  Given 질문 상세 페이지가 열려 있는 상태에서
  And 다른 브라우저/사용자가 해당 질문을 삭제한다
  When 답변을 작성하고 제출한다
  Then POST /api/questions/[id]/thoughts 요청이 실패한다
  And "질문을 찾을 수 없습니다" 오류 메시지가 표시된다
```

### ACC-EDGE-05: 빈 해시태그 배열

```gherkin
Scenario: 해시태그 없이 질문을 작성한다
  Given 인증된 사용자가 질문 작성 폼에서
  When 해시태그를 추가하지 않고 질문 내용만 입력하고 제출한다
  Then 질문이 정상적으로 저장된다
  And hashtags 필드에 빈 배열 [] 이 저장된다
  And 질문 카드에 해시태그 영역이 표시되지 않는다
```

---

## 6. 디자인 시스템 시나리오

### ACC-DESIGN-01: 디자인 일관성

```gherkin
Scenario: 질문/답변 UI가 기존 디자인 시스템을 따른다
  Given 질문 피드 페이지가 로드된다
  Then 배경색은 딥 네이비(#020912) 또는 오프 화이트(#fcfcfc)를 사용한다
  And 모든 카드, 버튼, 입력란의 border-radius는 0px이다
  And 제목/헤딩 폰트는 Figtree를 사용한다
  And 본문 폰트는 Anonymous Pro를 사용한다
  And 해시태그 칩, 필터 버튼, FAB 모두 0px border-radius를 적용한다
```

### ACC-RESPONSIVE-01: 반응형 레이아웃

```gherkin
Scenario: 모바일에서 질문 피드를 조회한다
  Given 모바일 뷰포트(width < 768px)에서 질문 피드를 조회한다
  Then 질문 카드가 단일 컬럼 레이아웃으로 표시된다
  And "질문하기" FAB 버튼이 화면 우하단에 고정된다

Scenario: 데스크톱에서 질문 피드를 조회한다
  Given 데스크톱 뷰포트(width >= 1024px)에서 질문 피드를 조회한다
  Then 질문 카드가 최대 2열 그리드로 표시된다
```

### ACC-TIME-01: 상대 시간 표시

```gherkin
Scenario: 시간 경과에 따른 상대 시간 표시
  Given 방금 작성된 질문이 있다
  Then "방금 전"으로 표시된다

  Given 5분 전에 작성된 질문이 있다
  Then "5분 전"으로 표시된다

  Given 2시간 전에 작성된 답변이 있다
  Then "2시간 전"으로 표시된다

  Given 3일 전에 작성된 질문이 있다
  Then "3일 전"으로 표시된다

  Given 30일 이상 전에 작성된 질문이 있다
  Then "YYYY.MM.DD" 형식으로 표시된다
```

### ACC-AUTHOR-01: 작성자 프로필 표시

```gherkin
Scenario: 질문/답변에 작성자 정보가 표시된다
  Given 질문 또는 답변이 표시된다
  Then 작성자의 아바타 이미지가 표시된다 (없으면 기본 아바타)
  And 작성자의 display_name이 표시된다
  And 작성자 이름 클릭 시 `/profile/[authorId]`로 이동한다
```

---

## 7. 성능 기준

### ACC-PERF-01: API 응답 시간

| 항목 | 성능 기준 |
|------|----------|
| GET /api/questions (질문 목록, 20건) | P95 < 500ms |
| GET /api/questions/[id] (질문 상세) | P95 < 300ms |
| GET /api/questions/[id]/thoughts (답변 목록, 20건) | P95 < 500ms |
| POST /api/questions (질문 생성) | P95 < 500ms |
| POST /api/questions/[id]/thoughts (답변 생성) | P95 < 500ms |
| POST/DELETE /api/thoughts/[id]/like (좋아요 토글) | P95 < 300ms |

### ACC-PERF-02: UI 반응성

| 항목 | 성능 기준 |
|------|----------|
| 좋아요 버튼 클릭 후 UI 반영 (낙관적 업데이트) | < 100ms |
| 무한 스크롤 다음 페이지 로드 완료 | < 1s |
| 질문 작성 폼 열기 | < 200ms |
| 질문 카드 클릭 -> 상세 페이지 전환 | < 500ms |
| 해시태그 필터 클릭 -> 목록 갱신 | < 800ms |

---

## 8. Quality Gate 기준

| 항목 | 기준 | 검증 방법 |
|------|------|----------|
| 타입 안전성 | TypeScript 빌드 에러 0건, 타입 에러 0건 | `npx tsc --noEmit` |
| 린트 | ESLint 에러 0건 | `npm run lint` |
| API 인증 | 모든 쓰기 API에 `requireAuth` 적용 | 코드 리뷰 + ACC-AUTH-API-01 시나리오 |
| 입력 검증 | 모든 API에 서버 사이드 검증 적용 (content 길이, hashtags 수/길이, UUID 형식, HTML strip) | ACC-VALIDATE 시나리오 |
| 보안 | XSS 방지 (HTML strip), 소유권 검증, Rate Limiting | ACC-XSS-01, ACC-AUTHZ-01, ACC-RATE-01 시나리오 |
| 접근성 | 모든 인터랙티브 요소에 aria-label 적용, 키보드 네비게이션 지원 | 수동 접근성 테스트 |
| 반응형 | 모바일(< 768px), 태블릿(768-1023px), 데스크톱(>= 1024px) 3단계 반응형 | ACC-RESPONSIVE-01 시나리오 |
| 디자인 시스템 | 색상, 폰트, border-radius 일관성 | ACC-DESIGN-01 시나리오 |
| 낙관적 업데이트 | 좋아요 토글 100ms 이내 UI 반응 + 에러 시 롤백 | ACC-LIKE-01 시나리오 |
| Cloudflare Workers 호환 | Node.js 전용 모듈 미사용, native fetch 기반 | 빌드 테스트 (`npm run build`) |

---

## 9. Definition of Done

- [ ] 모든 ACC 시나리오 (20개)가 수동 테스트를 통과한다
- [ ] DB 마이그레이션(`011_add_questions_thoughts.sql`)이 Supabase에서 성공적으로 실행된다
- [ ] 3개 테이블 생성 확인: community_questions, community_thoughts, thought_likes
- [ ] 2개 트리거 동작 확인: thought_count, like_count 자동 업데이트
- [ ] RLS 정책이 올바르게 적용된다 (공개 읽기, 인증 쓰기, 작성자 삭제)
- [ ] 모든 API 엔드포인트가 올바른 HTTP 상태 코드를 반환한다 (200, 201, 400, 401, 403, 404, 429, 500)
- [ ] 모바일/데스크톱 반응형 레이아웃이 정상 동작한다
- [ ] 미인증 사용자에 대한 접근 제어가 UI + API 양쪽에서 정상 동작한다
- [ ] 낙관적 업데이트가 서버 에러 시 롤백된다
- [ ] 디자인 시스템 (딥 네이비, 오프 화이트, 0px border-radius, Figtree/Anonymous Pro)이 일관적으로 적용된다
- [ ] TypeScript 빌드 에러 0건 (`npx tsc --noEmit`)
- [ ] ESLint 에러 0건 (`npm run lint`)
- [ ] Cloudflare Workers 빌드 성공 (`npm run build`)
- [ ] 무한 스크롤이 질문 피드와 답변 목록에서 정상 동작한다
- [ ] Rate limiting이 질문(1/60s), 답변(1/30s), 좋아요(100/1hr)에 적용된다

---

## 10. 추적성 매핑

| 요구사항 ID | 인수 기준 ID | 구현 대상 (plan.md Phase) |
|------------|-------------|------------------------|
| REQ-U01 | ACC-DESIGN-01 | Phase 4 (전체 컴포넌트) |
| REQ-U02 | ACC-RESPONSIVE-01 | Phase 4 (QuestionFeed, ThoughtList) |
| REQ-U03 | ACC-AUTHOR-01 | Phase 4 (QuestionCard, ThoughtCard) |
| REQ-U04 | ACC-TIME-01 | Phase 4 (QuestionCard, ThoughtCard) |
| REQ-E01 | ACC-CREATE-Q-01, ACC-VALIDATE-Q-01 | Phase 2 (API) + Phase 4 (QuestionForm) |
| REQ-E02 | ACC-CREATE-T-01, ACC-VALIDATE-T-01 | Phase 2 (API) + Phase 4 (ThoughtForm) |
| REQ-E03 | ACC-FEED-01, ACC-FEED-02 | Phase 2 (API) + Phase 4 (QuestionFeed) |
| REQ-E04 | ACC-FEED-01 | Phase 4 (QuestionDetail, ThoughtList) |
| REQ-E05 | ACC-LIKE-01 | Phase 2 (API) + Phase 3 (useThoughtLike) + Phase 4 (ThoughtLikeButton) |
| REQ-E06 | ACC-DELETE-Q-01 | Phase 2 (API) + Phase 4 (QuestionDetail) |
| REQ-E07 | ACC-OWNER-01 | Phase 2 (API) + Phase 4 (ThoughtCard) |
| REQ-E08 | ACC-TAG-01 | Phase 2 (API) + Phase 4 (HashtagChip, QuestionFilters) |
| REQ-S01 | ACC-UNAUTH-01 | Phase 2 (API) + Phase 4 (QuestionForm, ThoughtForm) |
| REQ-S02 | ACC-EMPTY-Q-01 | Phase 4 (QuestionFeed) |
| REQ-S03 | ACC-EMPTY-T-01 | Phase 4 (ThoughtList) |
| REQ-S04 | ACC-OWNER-01 | Phase 4 (QuestionCard, ThoughtCard) |
| REQ-N01 | ACC-AUTH-API-01 | Phase 2 (API requireAuth) |
| REQ-N02 | ACC-AUTHZ-01, ACC-DELETE-Q-01 | Phase 2 (API 소유권 검증) |
| REQ-N03 | ACC-RATE-01 | Phase 2 (API rate limiting) |
| REQ-N04 | ACC-XSS-01 | Phase 2 (question-storage.ts stripHtml) |
