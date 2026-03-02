---
id: SPEC-COMMUNITY-004
title: Coffee Chat Request & Accept - Acceptance Criteria
version: "2.0.0"
status: draft
created: "2026-03-02"
updated: "2026-03-02"
tags: [SPEC-COMMUNITY-004]
---

# SPEC-COMMUNITY-004: 커피챗 신청/수락 - 인수 기준

## 1. 커피챗 신청 테스트 시나리오

### ACC-REQUEST-01: 커피챗 신청 성공

```gherkin
Given 인증된 사용자 A가 공개 프로필(is_public=true)인 사용자 B의 프로필 페이지에 있다
  And 사용자 A와 B 사이에 활성(pending/accepted) 커피챗 요청이 없다
  And 사용자 A의 24시간 내 커피챗 신청 건수가 5건 미만이다
When "커피챗 신청" 버튼을 클릭한다
  And 신청 모달에서 메시지 "안녕하세요! 프론트엔드 개발에 관해 이야기를 나누고 싶습니다." (20자 이상)을 입력한다
  And 만남 방식으로 "온라인"을 선택한다
  And "신청하기" 버튼을 클릭한다
Then coffee_chat_requests 테이블에 다음 값으로 레코드가 생성된다:
  | 필드 | 값 |
  | status | pending |
  | requester_id | 사용자 A의 UUID |
  | receiver_id | 사용자 B의 UUID |
  | meeting_preference | online |
  | requester_read | true |
  | receiver_read | false |
  And "커피챗이 신청되었습니다" 확인 메시지가 표시된다
  And "커피챗 신청" 버튼이 "이미 요청된 커피챗이 있습니다"로 변경된다
```

### ACC-REQUEST-02: 신청 메시지 유효성 검증

```gherkin
Given 커피챗 신청 모달이 열려있다
When 20자 미만의 메시지를 입력한다
Then "신청하기" 버튼이 비활성화된다
  And "메시지는 20자 이상이어야 합니다" 안내가 표시된다

Given 커피챗 신청 모달이 열려있다
When 500자를 초과하는 메시지를 입력한다
Then 500자에서 입력이 제한된다
  And 글자 수 카운터가 "500/500"을 표시한다
```

## 2. 커피챗 수락 테스트 시나리오

### ACC-ACCEPT-01: 커피챗 수락 (이메일 공개 포함)

```gherkin
Given 수신자(사용자 B)가 "내 커피챗 > 받은 요청" 페이지에서 pending 상태의 요청을 보고 있다
  And 해당 요청의 신청자는 사용자 A이다
When "수락" 버튼을 클릭한다
  And 선택적으로 응답 메시지 "네, 좋습니다! 다음 주에 만나요."를 입력한다
Then 요청 상태가 accepted로 변경된다
  And 사용자 B의 커피챗 상세에 사용자 A의 이메일이 표시된다
  And 사용자 A의 커피챗 상세에 사용자 B의 이메일이 표시된다
  And "이메일로 연락하여 만남을 조율하세요" 안내가 표시된다
  And "만남 완료" 버튼이 표시된다
  And API 응답의 requester.email 및 receiver.email 필드에 이메일이 포함된다
```

### ACC-ACCEPT-02: 수락 전 이메일 공개 안내

```gherkin
Given 수신자가 pending 상태의 커피챗 요청에서 "수락" 버튼을 클릭한다
When 수락 확인 대화상자가 표시된다
Then "수락하시면 양쪽의 이메일 주소가 상대방에게 공개됩니다" 안내가 포함된다
  And "수락" 및 "취소" 버튼이 표시된다
```

## 3. 커피챗 거절 테스트 시나리오

### ACC-DECLINE-01: 커피챗 거절

```gherkin
Given 수신자가 pending 상태의 커피챗 요청을 보고 있다
When "정중히 거절" 버튼을 클릭한다
  And 확인 대화상자에서 거절을 확인한다
Then 요청 상태가 declined로 변경된다
  And 신청자의 커피챗 상세에 "상대방이 이번에는 어려울 것 같습니다" 안내가 표시된다
  And 거절 사유는 공개되지 않는다
  And 양쪽 이메일이 API 응답에 포함되지 않는다
```

## 4. 커피챗 취소 테스트 시나리오

### ACC-CANCEL-01: 신청자의 커피챗 취소

```gherkin
Given 신청자(사용자 A)가 자신이 보낸 pending 상태의 커피챗 요청을 보고 있다
When "취소" 버튼을 클릭한다
  And 확인 대화상자에서 "정말 취소하시겠습니까?"에 확인을 선택한다
Then 요청 상태가 cancelled로 변경된다
  And 커피챗 목록에서 해당 요청의 상태 배지가 "취소됨"(gray)으로 변경된다

Given 신청자가 accepted 상태의 커피챗 요청을 보고 있다
When UI에서 "취소" 버튼을 확인한다
Then "취소" 버튼이 표시되지 않는다 (accepted 상태에서는 취소 불가)
```

## 5. 커피챗 완료 테스트 시나리오

### ACC-COMPLETE-01: 커피챗 만남 완료

```gherkin
Given accepted 상태의 커피챗이 있다
  And 양쪽 사용자의 이메일이 상호 공개되어 있다
When 신청자 또는 수신자 중 한 명이 "만남 완료" 버튼을 클릭한다
  And 확인 대화상자에서 완료를 확인한다
Then 요청 상태가 completed로 변경된다
  And 이메일 정보가 API 응답에서 제거된다
  And 상태 배지가 "완료됨"(navy)으로 표시된다
  And 더 이상 액션 버튼이 표시되지 않는다
```

## 6. 중복 요청 방지 테스트 시나리오

### ACC-DUPLICATE-01: 활성 요청 중복 방지

```gherkin
Given 사용자 A가 사용자 B에게 pending 상태의 커피챗 요청이 있다
When 사용자 A가 사용자 B의 프로필에서 커피챗을 확인한다
Then "커피챗 신청" 버튼 대신 "이미 요청된 커피챗이 있습니다" 안내가 표시된다
  And "기존 요청 보기" 링크가 제공된다

Given 사용자 A가 사용자 B에게 accepted 상태의 커피챗이 있다
When 사용자 A가 사용자 B에게 다시 커피챗을 신청하려 한다 (API 직접 호출)
Then POST /api/coffee-chat 응답이 409 Conflict를 반환한다
  And "이미 진행 중인 커피챗이 있습니다" 오류 메시지가 반환된다

Given 사용자 A와 사용자 B 사이의 커피챗이 declined 상태이다
When 사용자 A가 사용자 B에게 다시 커피챗을 신청한다
Then 새로운 커피챗 요청이 정상적으로 생성된다 (status: pending)

Given 사용자 A와 사용자 B 사이의 커피챗이 cancelled 상태이다
When 사용자 B가 사용자 A에게 커피챗을 신청한다 (역방향)
Then 새로운 커피챗 요청이 정상적으로 생성된다

Given 사용자 B가 사용자 A에게 pending 상태의 커피챗 요청을 보낸 상태에서
When 사용자 A가 사용자 B에게 커피챗을 신청한다 (역방향 중복)
Then "이미 진행 중인 커피챗이 있습니다" 오류가 반환된다
  And Partial Unique Index(LEAST/GREATEST)가 양방향 중복을 DB 레벨에서 차단한다
```

## 7. 자기 자신 신청 방지 테스트 시나리오

### ACC-SELF-01: 자기 자신 커피챗 차단

```gherkin
Given 인증된 사용자가 자신의 프로필 페이지에 있다
When 페이지가 렌더링된다
Then "커피챗 신청" 버튼이 표시되지 않는다

Given 인증된 사용자가 회원 탐색 페이지(/community/coffee-chat)에 있다
When 회원 목록이 로드된다
Then 자기 자신의 카드는 목록에 표시되지 않는다

Given 인증된 사용자가 API를 직접 호출하여 자기 자신에게 커피챗을 신청한다
When POST /api/coffee-chat { receiverId: 본인UUID } 요청을 보낸다
Then 400 Bad Request 응답이 반환된다
  And "자기 자신에게 커피챗을 신청할 수 없습니다" 오류가 반환된다
  And DB CHECK 제약조건(chk_not_self)이 최종 안전망으로 작동한다
```

## 8. 권한 없는 상태 전환 차단 테스트 시나리오

### ACC-TRANSITION-01: 유효하지 않은 상태 전환 차단

```gherkin
# declined -> accepted (거절된 요청 수락 시도)
Given declined 상태의 커피챗이 있다
When 수신자가 PATCH /api/coffee-chat/[id]/respond { action: "accept" }를 요청한다
Then 400 Bad Request 응답이 반환된다
  And "유효하지 않은 상태 전환입니다" 오류 메시지가 반환된다

# cancelled -> accepted (취소된 요청 수락 시도)
Given cancelled 상태의 커피챗이 있다
When 수신자가 PATCH /api/coffee-chat/[id]/respond { action: "accept" }를 요청한다
Then 400 Bad Request 응답이 반환된다

# completed -> 모든 전환 (완료된 요청 상태 변경 시도)
Given completed 상태의 커피챗이 있다
When 어떤 상태 변경 액션이든 요청한다 (accept/decline/cancel/complete)
Then 400 Bad Request 응답이 반환된다
  And VALID_TRANSITIONS[completed]가 빈 배열이므로 모든 액션이 차단된다

# pending -> complete (수락 없이 완료 시도)
Given pending 상태의 커피챗이 있다
When PATCH /api/coffee-chat/[id]/respond { action: "complete" }를 요청한다
Then 400 Bad Request 응답이 반환된다
```

### ACC-TRANSITION-02: 권한 없는 사용자의 상태 변경 차단

```gherkin
# 신청자가 수락 시도 (수신자만 가능)
Given pending 상태의 커피챗에서 신청자(사용자 A)가
When PATCH /api/coffee-chat/[id]/respond { action: "accept" }를 요청한다
Then 403 Forbidden 응답이 반환된다
  And "이 작업을 수행할 권한이 없습니다" 오류 메시지가 반환된다

# 수신자가 취소 시도 (신청자만 가능)
Given pending 상태의 커피챗에서 수신자(사용자 B)가
When PATCH /api/coffee-chat/[id]/respond { action: "cancel" }를 요청한다
Then 403 Forbidden 응답이 반환된다

# 제3자가 상태 변경 시도
Given 관계자가 아닌 제3자(사용자 C)가
When PATCH /api/coffee-chat/[id]/respond { action: "accept" }를 요청한다
Then 404 Not Found 응답이 반환된다 (RLS 정책에 의해 레코드 자체가 미조회)

# 신청자가 거절 시도 (수신자만 가능)
Given pending 상태의 커피챗에서 신청자가
When PATCH /api/coffee-chat/[id]/respond { action: "decline" }를 요청한다
Then 403 Forbidden 응답이 반환된다
```

## 9. 엣지 케이스 테스트 시나리오

### ACC-CONCURRENT-01: 동시 요청 처리

```gherkin
Given 사용자 A와 사용자 B 사이에 활성 커피챗이 없다
When 사용자 A와 사용자 B가 거의 동시에 서로에게 커피챗을 신청한다
Then 하나의 요청만 성공하고, 다른 요청은 Partial Unique Index violation으로 실패한다
  And 실패한 요청에 대해 "이미 진행 중인 커피챗이 있습니다" 응답이 반환된다

Given pending 상태의 커피챗이 있다
When 수신자가 "수락"과 "거절"을 거의 동시에 클릭한다 (네트워크 지연)
Then 먼저 도착한 요청만 처리되고, 두 번째 요청은 상태 불일치로 400이 반환된다
```

### ACC-PRIVATE-01: 비공개 프로필 차단

```gherkin
Given 대상 사용자의 is_public이 false이다
When 해당 사용자의 프로필 페이지를 방문한다
Then "커피챗 신청" 버튼이 표시되지 않는다

Given 대상 사용자의 is_public이 false이다
When API를 직접 호출하여 커피챗을 신청한다 (POST /api/coffee-chat)
Then 400 Bad Request 응답이 반환된다
  And "비공개 프로필 사용자에게는 커피챗을 신청할 수 없습니다" 오류가 반환된다

Given 회원 탐색 페이지(/community/coffee-chat)에 접근한다
When 회원 목록이 로드된다
Then is_public=false인 사용자는 목록에 표시되지 않는다
```

### ACC-RATE-01: Rate Limiting 검증

```gherkin
Given 인증된 사용자가 이미 5건의 커피챗을 24시간 내에 신청했다
When 6번째 커피챗을 신청하려 한다 (POST /api/coffee-chat)
Then 429 Too Many Requests 응답이 반환된다
  And "하루 최대 5건의 커피챗을 신청할 수 있습니다. 내일 다시 시도해주세요." 안내가 표시된다

Given 24시간이 경과한 후
When 커피챗을 신청한다
Then 정상적으로 신청이 처리된다 (Rate limit 초기화)

Given 상태 변경(수락/거절) 요청을 1시간 내에 20건 수행했다
When 21번째 상태 변경을 시도한다
Then 429 Too Many Requests 응답이 반환된다
```

## 10. 커피챗 목록/탐색 테스트 시나리오

### ACC-LIST-01: 내 커피챗 목록 조회

```gherkin
Given 인증된 사용자가 "내 커피챗" 페이지(/community/coffee-chat/my)에 접근한다
When "받은 요청" 탭(기본)이 활성화된다
Then 수신한 커피챗 요청 목록이 최신순으로 표시된다
  And 각 요청에 신청자 아바타, display_name, 메시지 미리보기, 상태 배지, 만남 선호 방식, 시간이 표시된다
  And pending 상태 요청에 "수락" / "정중히 거절" 버튼이 표시된다
  And accepted 상태 요청에 상대방 이메일과 "만남 완료" 버튼이 표시된다

Given "내 커피챗" 페이지에서
When "보낸 요청" 탭을 클릭한다
Then 보낸 커피챗 요청 목록이 최신순으로 표시된다
  And 각 요청에 수신자 아바타, display_name, 메시지 미리보기, 상태 배지가 표시된다
  And pending 상태 요청에 "취소" 버튼이 표시된다
```

### ACC-DISCOVER-01: 회원 탐색

```gherkin
Given 커뮤니티 커피챗 페이지(/community/coffee-chat)에 접근한다
When 페이지가 로드된다
Then 공개 프로필(is_public=true) 회원이 카드 형태로 표시된다
  And 각 카드에 아바타, display_name, Bio 미리보기, 명함 카드 수, 커피챗 신청 버튼이 표시된다
  And 자기 자신은 목록에 표시되지 않는다
  And "내 커피챗 보기 ->" 링크가 상단에 표시된다

Given 특정 회원에게 이미 pending 또는 accepted 상태의 요청이 있다
When 해당 회원의 카드를 본다
Then "커피챗 신청" 대신 "이미 요청됨" 표시가 된다
  And 해당 버튼은 비활성화되어 클릭할 수 없다

Given 회원 목록을 스크롤하여 하단에 도달한다
When IntersectionObserver가 감지된다
Then 다음 페이지의 회원 목록이 자동으로 로드된다 (무한 스크롤)
```

## 11. 프로필 통합 테스트 시나리오

### ACC-PROFILE-01: 프로필 커피챗 버튼

```gherkin
Given 인증된 사용자가 다른 공개 프로필 사용자의 프로필 페이지(/profile/[id])에 있다
  And 해당 사용자와 활성 커피챗이 없다
When 페이지가 로드된다
Then "커피챗 신청" 버튼이 소셜 아이콘 행 옆 또는 링크 섹션 아래에 표시된다

Given 인증된 사용자가 자기 자신의 프로필 페이지에 있다
When 페이지가 로드된다
Then "커피챗 신청" 버튼이 표시되지 않는다

Given 인증된 사용자가 비공개 프로필(is_public=false) 사용자의 프로필 페이지에 있다
When 페이지가 로드된다
Then "커피챗 신청" 버튼이 표시되지 않는다
```

### ACC-UNAUTH-01: 미인증 사용자 제한

```gherkin
Given 미인증 사용자가 공개 프로필 페이지에 있다
When 커피챗 버튼 영역을 본다
Then "로그인 후 커피챗을 신청하세요" 안내가 표시된다
  And 로그인 페이지로 이동하는 버튼이 함께 표시된다
```

## 12. 이메일 공개 테스트 시나리오

### ACC-EMAIL-01: 상태별 이메일 공개/비공개

```gherkin
# pending 상태: 이메일 비공개
Given pending 상태의 커피챗을 보고 있다
When GET /api/coffee-chat/[id] 응답을 확인한다
Then requester.email 필드가 존재하지 않는다
  And receiver.email 필드가 존재하지 않는다
  And UI에 이메일 영역이 표시되지 않는다

# accepted 상태: 이메일 공개
Given 수신자가 커피챗을 수락한 후 accepted 상태이다
When 신청자가 GET /api/coffee-chat/[id] 응답을 확인한다
Then requester.email에 신청자 본인의 이메일이 포함된다
  And receiver.email에 수신자의 이메일이 포함된다
  And "이메일로 연락하여 만남을 조율하세요" 안내가 표시된다

# declined 상태: 이메일 비공개
Given declined 상태의 커피챗 상세를 조회한다
When API 응답을 확인한다
Then requester.email 및 receiver.email 필드가 존재하지 않는다

# completed 상태: 이메일 비공개
Given completed 상태의 커피챗을 보고 있다
When 상세 정보를 확인한다
Then 이메일이 API 응답에 포함되지 않는다
  And UI에 이메일이 더 이상 표시되지 않는다
```

### ACC-EMAIL-02: 서버 사이드 이메일 필터링 검증

```gherkin
Given pending 상태의 커피챗이 있다
When 클라이언트가 GET /api/coffee-chat/[id] 요청을 보낸다
Then 서버가 이메일 필드를 응답 JSON에서 완전히 제거한다 (null이 아닌 필드 자체 미포함)
  And coffee_chat_requests 테이블에는 이메일이 저장되어 있지 않다 (auth.users에만 존재)
  And 이메일은 accepted 상태에서만 auth.users JOIN으로 조회한다
```

## 13. 배지 테스트 시나리오

### ACC-BADGE-01: 미확인 요청 배지

```gherkin
Given 사용자에게 pending 상태이면서 receiver_read=false인 커피챗 요청이 3건 있다
When 커뮤니티 페이지에 접근한다
Then CommunityNav의 "커피챗" 탭에 숫자 3의 배지가 표시된다

Given 사용자가 "내 커피챗" 페이지에서 모든 pending 요청을 확인(수락 또는 거절)한다
When 60초 폴링 주기가 도래하거나 페이지를 새로고침한다
Then "커피챗" 탭의 배지가 사라진다 (count=0)

Given 새로운 커피챗 요청이 수신된다
When 사용자가 다른 페이지에서 브라우저 탭을 다시 포커스한다
Then visibilitychange 이벤트에 의해 즉시 pending-count가 재조회된다
  And 배지 숫자가 갱신된다
```

## 14. 보안 테스트 시나리오

### ACC-AUTH-API-01: API 인증 검증

```gherkin
Given 미인증 상태(Authorization 헤더 없음)에서
When POST /api/coffee-chat 요청을 보낸다
Then 401 Unauthorized 응답이 반환된다

Given 미인증 상태에서
When GET /api/coffee-chat 요청을 보낸다
Then 401 Unauthorized 응답이 반환된다

Given 미인증 상태에서
When PATCH /api/coffee-chat/[id]/respond 요청을 보낸다
Then 401 Unauthorized 응답이 반환된다

Given 미인증 상태에서
When GET /api/coffee-chat/[id] 요청을 보낸다
Then 401 Unauthorized 응답이 반환된다

Given 미인증 상태에서
When GET /api/coffee-chat/pending-count 요청을 보낸다
Then 401 Unauthorized 응답이 반환된다
```

### ACC-AUTHZ-01: 관계자 접근 검증 (Authorization Matrix)

```gherkin
# 제3자 상세 조회 차단
Given 사용자 C가 사용자 A와 B 사이의 커피챗에 대해
When GET /api/coffee-chat/[id] 요청을 보낸다
Then 404 Not Found 응답이 반환된다 (RLS 정책에 의해 레코드 미조회)
  And 해당 커피챗의 존재 여부가 노출되지 않는다

# 권한 매트릭스 요약
# | 액션 | 신청자(requester) | 수신자(receiver) | 제3자 |
# |------|------------------|-----------------|-------|
# | accept | 403 | 200 (pending일 때) | 404 |
# | decline | 403 | 200 (pending일 때) | 404 |
# | cancel | 200 (pending일 때) | 403 | 404 |
# | complete | 200 (accepted일 때) | 200 (accepted일 때) | 404 |
# | 상세 조회 | 200 | 200 | 404 |
```

### ACC-XSS-01: XSS 방지 (HTML 태그 제거)

```gherkin
Given 커피챗 신청 메시지에
When "<script>alert('xss')</script>안녕하세요 프론트엔드 개발에 관심이 있습니다." 내용을 입력하고 제출한다
Then HTML 태그가 서버 사이드에서 제거된 "안녕하세요 프론트엔드 개발에 관심이 있습니다."만 DB에 저장된다
  And 태그 제거 후에도 메시지 최소 길이(20자) 검증이 적용된다

Given 응답 메시지에 "<img src=x onerror=alert(1)>좋습니다"를 입력하고 제출한다
Then "좋습니다"만 저장된다
```

## 15. 디자인 시스템 테스트 시나리오

### ACC-DESIGN-01: 디자인 일관성

```gherkin
Given 커피챗 관련 페이지가 로드된다
Then 배경색은 딥 네이비(#020912) 또는 오프 화이트(#fcfcfc)를 사용한다
  And 모든 카드/버튼/모달의 border-radius는 0px이다
  And 제목 폰트는 Figtree를 사용한다
  And 본문 폰트는 Anonymous Pro를 사용한다
  And 상태 배지 색상이 다음 명세와 일치한다:
    | 상태 | 라벨 | 배경색 | 텍스트색 |
    | pending | 대기중 | #f59e0b (amber) | #020912 |
    | accepted | 수락됨 | #10b981 (green) | #fcfcfc |
    | declined | 거절됨 | #6b7280 (gray) | #fcfcfc |
    | cancelled | 취소됨 | #6b7280 (gray) | #fcfcfc |
    | completed | 완료됨 | #020912 (navy) | #fcfcfc |
```

### ACC-RESPONSIVE-01: 반응형 레이아웃

```gherkin
Given 모바일(width < 768px)에서 회원 탐색 페이지를 조회한다
Then 회원 카드가 단일 컬럼(1열)으로 표시된다
  And 각 카드의 터치 타겟이 최소 44px이다

Given 데스크톱(width >= 1024px)에서 회원 탐색 페이지를 조회한다
Then 회원 카드가 2열 그리드로 표시된다

Given 모바일에서 커피챗 신청 모달을 열면
Then 모달이 화면 하단에서 슬라이드업되어 전체 너비를 차지한다

Given 데스크톱에서 커피챗 신청 모달을 열면
Then 모달이 화면 중앙에 고정 너비로 표시된다
```

### ACC-STATUS-01: 상태 배지 표시

```gherkin
Given pending 상태의 커피챗이 있다
Then amber(#f59e0b) 배경에 딥 네이비(#020912) 텍스트의 "대기중" 배지가 표시된다

Given accepted 상태의 커피챗이 있다
Then green(#10b981) 배경에 오프 화이트(#fcfcfc) 텍스트의 "수락됨" 배지가 표시된다

Given declined 상태의 커피챗이 있다
Then gray(#6b7280) 배경에 오프 화이트(#fcfcfc) 텍스트의 "거절됨" 배지가 표시된다

Given cancelled 상태의 커피챗이 있다
Then gray(#6b7280) 배경에 오프 화이트(#fcfcfc) 텍스트의 "취소됨" 배지가 표시된다

Given completed 상태의 커피챗이 있다
Then navy(#020912) 배경에 오프 화이트(#fcfcfc) 텍스트의 "완료됨" 배지가 표시된다
```

## 16. 성능 기준

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| 목록 조회 응답 시간 | < 500ms (P95) | GET /api/coffee-chat, GET /api/members/discoverable |
| 상태 변경 응답 시간 | < 300ms (P95) | PATCH /api/coffee-chat/[id]/respond |
| 커피챗 생성 응답 시간 | < 500ms (P95) | POST /api/coffee-chat |
| 미확인 수 조회 시간 | < 200ms (P95) | GET /api/coffee-chat/pending-count |
| 회원 탐색 초기 로딩 | < 1s (First Meaningful Paint) | /community/coffee-chat 페이지 |
| 무한 스크롤 다음 페이지 | < 500ms | IntersectionObserver 트리거 후 |
| 배지 폴링 간격 | 60초 | setInterval + visibilitychange |

## 17. Quality Gate 기준

| 항목 | 기준 |
|------|------|
| 상태 전환 검증 | VALID_TRANSITIONS 매트릭스의 모든 유효/무효 조합 검증 |
| 권한 매트릭스 검증 | 모든 액션에 대해 requester/receiver/제3자 권한 테스트 |
| 이메일 보안 | accepted 상태 외 모든 상태에서 이메일 미노출 (서버 사이드) |
| 중복 방지 | DB Partial Unique Index + API 레벨 이중 체크 |
| 자기 자신 방지 | API 레벨 검증 + DB CHECK 제약조건 이중 체크 |
| 입력 검증 | 모든 API에 서버 사이드 검증 적용 (message 길이, HTML strip, UUID 형식) |
| Rate Limiting | 5건/24시간 (신청), 20건/1시간 (상태 변경) |
| 접근성 | 모든 인터랙티브 요소에 aria-label 적용 |
| 빌드 | TypeScript 에러 0건, ESLint 에러 0건 |
| 반응형 | 모바일/데스크톱 레이아웃 정상 동작 |

## 18. Definition of Done

- [ ] 모든 ACC 시나리오가 수동 테스트를 통과한다
- [ ] DB 마이그레이션(012_add_coffee_chat.sql)이 성공적으로 실행된다
- [ ] 상태 전환 매트릭스의 모든 유효/무효 조합이 검증된다 (단위 테스트 포함)
- [ ] 이메일이 accepted 상태에서만 공개되고 그 외 상태에서는 서버 사이드에서 제거된다
- [ ] 중복 활성 요청이 DB Partial Unique Index 레벨에서 차단된다
- [ ] 자기 자신 신청이 DB CHECK 제약조건 레벨에서 차단된다
- [ ] Rate Limiting이 정상 동작한다 (5건/24시간 신청, 20건/1시간 상태 변경)
- [ ] HTML 태그가 서버 사이드에서 제거된다
- [ ] 모바일/데스크톱 반응형 레이아웃이 정상 동작한다
- [ ] 디자인 시스템 (색상, 폰트, border-radius 0px, 상태 배지)이 일관적으로 적용된다
- [ ] TypeScript 빌드 에러 0건, ESLint 에러 0건
- [ ] CommunityNav에 커피챗 탭이 추가되고 배지가 정상 표시된다
- [ ] 프로필 페이지에 CoffeeChatButton이 조건부로 통합된다
- [ ] 모든 인터랙티브 요소에 aria-label이 적용된다
