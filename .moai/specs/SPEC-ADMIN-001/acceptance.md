# SPEC-ADMIN-001: 인수 기준

---
spec-id: SPEC-ADMIN-001
version: 1.0.0
status: Planned
created: 2026-02-21
updated: 2026-02-21
---

## 1. 의뢰 제출 (위저드 5단계)

### AC-001: 의뢰하기 버튼을 통한 의뢰 제출

```gherkin
Given 사용자가 위저드 5단계에 도달한 상태
  And 카드 앞면/뒷면 미리보기가 표시된 상태
When 사용자가 "의뢰하기" 버튼을 클릭하면
Then 시스템은 현재 카드 데이터를 POST /api/requests로 전송한다
  And "의뢰하기" 버튼이 비활성화되고 로딩 인디케이터가 표시된다
```

추적: REQ-E-001, REQ-S-005

### AC-002: 의뢰 제출 성공

```gherkin
Given 사용자가 "의뢰하기" 버튼을 클릭한 상태
  And API가 201 Created를 반환한 상태
When 응답이 수신되면
Then 시스템은 의뢰 확인 화면을 표시한다
  And 요청 ID가 화면에 표시된다
  And 제출 시간이 표시된다
  And "새 명함 만들기" 버튼이 표시된다
```

추적: REQ-E-002

### AC-003: 의뢰 제출 실패

```gherkin
Given 사용자가 "의뢰하기" 버튼을 클릭한 상태
  And API가 에러를 반환한 상태
When 에러 응답이 수신되면
Then 시스템은 에러 메시지를 표시한다
  And "재시도" 버튼이 표시된다
  And "의뢰하기" 버튼이 다시 활성화된다
```

추적: REQ-E-003

### AC-004: 메모 포함 의뢰 제출

```gherkin
Given 사용자가 위저드 5단계에 도달한 상태
When 사용자가 메모 필드에 "따뜻한 느낌으로 그려주세요"를 입력하고
  And "의뢰하기" 버튼을 클릭하면
Then 시스템은 메모를 포함하여 API로 전송한다
  And 저장된 의뢰에 메모가 포함된다
```

추적: REQ-O-001

### AC-005: 아바타 이미지 없이 의뢰 제출

```gherkin
Given 사용자가 아바타 이미지를 업로드하지 않은 상태
  And 위저드 5단계에 도달한 상태
When 사용자가 "의뢰하기" 버튼을 클릭하면
Then 시스템은 정상적으로 의뢰를 제출한다
  And 아바타 이미지 파일 없이 JSON 메타데이터만 저장된다
  And originalAvatarPath가 null로 저장된다
```

추적: REQ-N-002

### AC-006: 5단계 레이블 변경 확인

```gherkin
Given 사용자가 위저드 페이지에 접근한 상태
When ProgressBar가 렌더링되면
Then 5번째 단계의 레이블이 "의뢰"로 표시된다
```

추적: 5.4.2

---

## 2. API Routes

### AC-007: POST /api/requests - 정상 생성

```gherkin
Given 유효한 카드 데이터와 Base64 아바타 이미지가 준비된 상태
When POST /api/requests로 요청을 보내면
Then 서버는 201 Created를 반환한다
  And 응답에 id, status("submitted"), submittedAt이 포함된다
  And data/requests/ 디렉토리에 {id}.json 파일이 생성된다
  And data/requests/ 디렉토리에 {id}-avatar.png 파일이 생성된다
  And JSON 파일의 card.front.avatarImage는 null이다
  And JSON 파일의 originalAvatarPath에 아바타 파일명이 기록된다
```

추적: REQ-E-005, REQ-U-004, REQ-N-004

### AC-008: POST /api/requests - 잘못된 데이터

```gherkin
Given displayName이 비어있는 카드 데이터가 준비된 상태
When POST /api/requests로 요청을 보내면
Then 서버는 400 Bad Request를 반환한다
  And 응답에 error와 details 필드가 포함된다
```

추적: REQ-U-003

### AC-009: GET /api/requests - 의뢰 목록 조회

```gherkin
Given 3건의 의뢰가 저장된 상태
When GET /api/requests로 요청을 보내면
Then 서버는 200 OK를 반환한다
  And 응답의 requests 배열에 3건의 의뢰 요약이 포함된다
  And 각 항목에 id, displayName, status, submittedAt, hasIllustration이 포함된다
  And submittedAt 기준 내림차순으로 정렬된다
  And total이 3이다
```

추적: REQ-E-006

### AC-010: GET /api/requests/[id] - 의뢰 상세 조회

```gherkin
Given 의뢰 ID "abc-123"이 저장된 상태
When GET /api/requests/abc-123으로 요청을 보내면
Then 서버는 200 OK를 반환한다
  And 응답에 전체 카드 데이터가 포함된다
  And originalAvatarUrl에 아바타 이미지 URL이 포함된다
  And statusHistory에 상태 변경 이력이 포함된다
```

추적: REQ-E-007

### AC-011: GET /api/requests/[id] - 존재하지 않는 ID

```gherkin
Given 의뢰 ID "nonexistent"가 존재하지 않는 상태
When GET /api/requests/nonexistent로 요청을 보내면
Then 서버는 404 Not Found를 반환한다
  And 응답에 error 필드가 포함된다
  And 서버는 500 에러를 반환하지 않는다
```

추적: REQ-N-003

### AC-012: PATCH /api/requests/[id] - 상태 변경 (submitted -> processing)

```gherkin
Given 상태가 "submitted"인 의뢰가 있는 상태
  And 일러스트 이미지(Base64)가 준비된 상태
When PATCH /api/requests/[id]로 illustrationImage와 status:"processing"을 보내면
Then 서버는 200 OK를 반환한다
  And 의뢰 상태가 "processing"으로 변경된다
  And data/requests/ 디렉토리에 {id}-illustration.png 파일이 생성된다
  And JSON의 illustrationPath가 업데이트된다
  And statusHistory에 새 항목이 추가된다
  And updatedAt이 갱신된다
```

추적: REQ-E-008

### AC-013: PATCH /api/requests/[id] - 역방향 상태 변경 거부

```gherkin
Given 상태가 "confirmed"인 의뢰가 있는 상태
When PATCH /api/requests/[id]로 status:"processing"을 보내면
Then 서버는 400 Bad Request를 반환한다
  And 의뢰 상태가 변경되지 않는다
```

추적: REQ-N-001

---

## 3. 어드민 대시보드

### AC-014: 의뢰 목록 표시

```gherkin
Given 5건의 의뢰가 저장된 상태 (submitted 2건, processing 2건, confirmed 1건)
When 어드민이 /admin 페이지에 접근하면
Then 5건의 의뢰가 테이블 형태로 표시된다
  And 각 행에 요청 ID(축약), 이름, 제출일, 상태 배지가 표시된다
  And submitted 배지는 파란색이다
  And processing 배지는 주황색이다
  And confirmed 배지는 녹색이다
```

추적: REQ-E-009

### AC-015: 빈 의뢰 목록

```gherkin
Given 저장된 의뢰가 없는 상태
When 어드민이 /admin 페이지에 접근하면
Then "아직 의뢰가 없습니다" 메시지가 표시된다
```

추적: REQ-E-009

### AC-016: 의뢰 항목 클릭으로 상세 이동

```gherkin
Given 의뢰 목록이 표시된 상태
When 어드민이 의뢰 항목을 클릭하면
Then /admin/[id] 상세 페이지로 이동한다
```

추적: REQ-E-010

---

## 4. 어드민 상세 페이지

### AC-017: 의뢰 상세 정보 표시

```gherkin
Given 의뢰 ID "abc-123"이 존재하는 상태
When 어드민이 /admin/abc-123 페이지에 접근하면
Then 요청 ID와 상태 배지가 상단에 표시된다
  And 카드 데이터(displayName, fullName, title, hashtags, socialLinks, 배경색)가 읽기 전용으로 표시된다
  And 원본 아바타 이미지가 표시된다
  And 제출일과 수정일이 표시된다
```

추적: REQ-E-011

### AC-018: 일러스트 이미지 업로드 및 비교

```gherkin
Given 상태가 "submitted"인 의뢰의 상세 페이지에 접근한 상태
When 어드민이 일러스트 이미지 파일을 업로드하면
Then 좌측에 원본 사진이 표시된다
  And 우측에 업로드한 일러스트 이미지가 표시된다
  And 두 이미지를 나란히 비교할 수 있다
```

추적: REQ-E-011

### AC-019: 일러스트 등록 (submitted -> processing)

```gherkin
Given 상태가 "submitted"인 의뢰의 상세 페이지에 접근한 상태
  And 일러스트 이미지가 업로드된 상태
When 어드민이 "등록" 버튼을 클릭하면
Then 일러스트 이미지가 서버에 저장된다
  And 의뢰 상태가 "작업중(processing)"으로 변경된다
  And 상태 배지가 주황색으로 변경된다
```

추적: REQ-E-012, REQ-S-001

### AC-020: 일러스트 미업로드 시 등록 버튼 비활성화

```gherkin
Given 상태가 "submitted"인 의뢰의 상세 페이지에 접근한 상태
  And 일러스트 이미지가 아직 업로드되지 않은 상태
When 화면이 렌더링되면
Then "등록" 버튼이 비활성화(disabled) 상태이다
```

추적: REQ-S-004

### AC-021: 의뢰 확정 (processing -> confirmed)

```gherkin
Given 상태가 "processing"인 의뢰의 상세 페이지에 접근한 상태
When 어드민이 "확정" 버튼을 클릭하면
Then 의뢰 상태가 "확정(confirmed)"으로 변경된다
  And 상태 배지가 녹색으로 변경된다
  And 모든 편집 기능(일러스트 업로드, 등록/확정 버튼)이 비활성화된다
```

추적: REQ-E-013, REQ-S-003

### AC-022: 확정된 의뢰의 편집 불가

```gherkin
Given 상태가 "confirmed"인 의뢰의 상세 페이지에 접근한 상태
When 화면이 렌더링되면
Then 일러스트 업로드 영역이 비활성화되어 있다
  And "등록" 버튼이 표시되지 않거나 비활성화되어 있다
  And "확정" 버튼이 표시되지 않거나 비활성화되어 있다
  And 확정 완료 상태 메시지가 표시된다
```

추적: REQ-S-003

### AC-023: 사용자 메모 표시

```gherkin
Given 메모가 포함된 의뢰의 상세 페이지에 접근한 상태
When 화면이 렌더링되면
Then 사용자가 작성한 메모가 별도 섹션에 표시된다
```

추적: REQ-O-001

---

## 5. 기존 기능 보존

### AC-024: 위저드 1~4단계 무변경

```gherkin
Given 기존 위저드 1~4단계가 정상 동작하는 상태
When 이 SPEC의 변경사항이 적용된 후
Then 1단계(정보 입력), 2단계(사진 업로드), 3단계(소셜/태그), 4단계(미리보기)가 기존과 동일하게 동작한다
  And 각 단계의 유효성 검사가 기존과 동일하게 동작한다
  And StepNavigation이 기존과 동일하게 동작한다
```

추적: REQ-U-001

### AC-025: localStorage 데이터 호환성

```gherkin
Given 기존 localStorage에 저장된 명함 데이터가 있는 상태
When 업데이트된 애플리케이션에 접근하면
Then 기존 명함 데이터가 정상적으로 로드된다
  And 기존 wizardStep, wizardCompleted 상태가 유지된다
```

추적: REQ-U-002

---

## 6. 엣지 케이스

### AC-026: 매우 큰 이미지 파일 처리

```gherkin
Given 사용자가 10MB 초과 이미지를 업로드한 상태
When "의뢰하기" 버튼을 클릭하면
Then 시스템은 이미지 크기 초과 에러를 표시한다
  And 의뢰가 제출되지 않는다
```

추적: TC-009

### AC-027: 네트워크 오류 시 재시도

```gherkin
Given 네트워크 연결이 불안정한 상태
When 의뢰 제출 중 네트워크 오류가 발생하면
Then 에러 메시지가 표시된다
  And "재시도" 버튼이 제공된다
  And 재시도 시 동일한 데이터로 재전송한다
```

추적: REQ-E-003

### AC-028: data/requests 디렉토리 미존재 시 자동 생성

```gherkin
Given data/requests/ 디렉토리가 존재하지 않는 상태
When 첫 번째 의뢰가 제출되면
Then 시스템이 data/requests/ 디렉토리를 자동으로 생성한다
  And 의뢰가 정상적으로 저장된다
```

추적: M1 기반 인프라

---

## 7. 성능 기준

| 항목 | 기준 |
|------|------|
| 의뢰 제출 응답 시간 | 3초 이내 (이미지 포함) |
| 의뢰 목록 로드 시간 | 1초 이내 (100건 기준) |
| 의뢰 상세 로드 시간 | 1초 이내 (이미지 로드 제외) |
| 일러스트 업로드 및 등록 | 3초 이내 |
| 클라이언트 번들 크기 증가 | 기존 대비 20% 이내 |

---

## 8. 품질 게이트 (Quality Gate)

### 8.1 코드 품질

- [ ] TypeScript strict 모드에서 타입 에러 없음
- [ ] ESLint 경고 0건
- [ ] 신규 코드에 대한 단위 테스트 작성

### 8.2 기능 완전성

- [ ] 사용자: 위저드 5단계 의뢰 제출 플로우 정상 동작
- [ ] 어드민: 목록 조회 -> 상세 -> 일러스트 등록 -> 확정 플로우 정상 동작
- [ ] API: 모든 엔드포인트 정상 응답

### 8.3 호환성

- [ ] 기존 위저드 1~4단계 회귀 없음
- [ ] 기존 localStorage 데이터 호환
- [ ] 모바일/데스크톱 반응형 동작

### 8.4 접근성

- [ ] 어드민 페이지 ARIA 속성 적용
- [ ] 키보드 네비게이션 지원
- [ ] 최소 터치 영역 44px 보장

---

## 9. 완료 정의 (Definition of Done)

1. 모든 인수 기준(AC-001 ~ AC-028)이 통과한다
2. TypeScript 컴파일 에러가 없다
3. ESLint 경고가 없다
4. 기존 기능에 대한 회귀가 없다
5. 모바일 및 데스크톱에서 정상 동작한다
6. `data/requests/` 디렉토리가 `.gitignore`에 포함된다
7. 코드 리뷰 완료
