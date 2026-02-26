---
id: SPEC-VISIBILITY-001
document: acceptance
version: "1.0.0"
created: "2026-02-26"
updated: "2026-02-26"
---

# SPEC-VISIBILITY-001 수락 기준: 명함 공개/비공개 설정

---

## 테스트 시나리오

### AC-001: 카드 요청에 is_public 필드 존재 확인 (REQ-U-001)

**Given** card_requests 테이블에 is_public 컬럼이 존재하고
**And** CardRequest TypeScript 인터페이스에 isPublic 필드가 정의되어 있을 때
**When** 기존 카드 요청을 조회하면
**Then** isPublic 필드가 boolean 타입으로 반환되어야 하고
**And** 기존 레코드의 isPublic 값은 모두 false여야 한다

### AC-002: 신규 카드 요청 기본 비공개 (REQ-U-002)

**Given** 인증된 사용자가 카드 생성 폼을 완성했을 때
**When** POST /api/requests로 새 카드 요청을 제출하면
**Then** 생성된 카드 요청의 is_public 값이 false로 설정되어야 하고
**And** 데이터베이스의 해당 레코드에서 is_public = false를 확인할 수 있어야 한다

### AC-003: 사용자 공개/비공개 토글 (REQ-E-001)

**Given** 인증된 사용자가 자신의 confirmed 상태 카드 상세 페이지(/dashboard/[id])에 있을 때
**When** 공개/비공개 토글 스위치를 클릭하면
**Then** PATCH /api/requests/my/[id]/visibility API가 호출되어야 하고
**And** 카드의 isPublic 상태가 반전되어야 하고
**And** UI에 변경된 상태가 즉시 반영되어야 하고
**And** 공개로 전환된 경우 공유 URL이 표시되어야 한다

### AC-004: 공개 카드 URL 접근 (REQ-E-002)

**Given** 카드 요청이 is_public = true이고 status = 'delivered'일 때
**When** 인증되지 않은 방문자가 /cards/[id] 페이지에 접근하면
**Then** 해당 카드의 앞면과 뒷면이 읽기 전용으로 렌더링되어야 하고
**And** 카드 테마에 맞는 컴포넌트(Classic/Pokemon/Hearthstone/Harrypotter/Tarot)가 사용되어야 하고
**And** 카드 플립(앞면/뒷면 전환) 기능이 동작해야 하고
**And** Open Graph 메타데이터가 HTML head에 포함되어야 한다

### AC-005: 관리자 공개/비공개 변경 (REQ-E-003)

**Given** 관리자가 관리자 요청 상세 페이지(/admin/[id])에 있을 때
**When** 공개/비공개 토글 스위치를 클릭하면
**Then** PATCH /api/admin/requests/[id]/visibility API가 호출되어야 하고
**And** 카드의 isPublic 상태가 변경되어야 하고
**And** 관리자 UI에 변경 결과가 반영되어야 한다

### AC-006: 공개 전환 시 공유 URL 표시 (REQ-E-004)

**Given** 사용자가 자신의 카드를 비공개에서 공개로 전환했을 때
**When** 토글이 성공적으로 완료되면
**Then** `{BASE_URL}/cards/{id}` 형식의 공유 URL이 표시되어야 하고
**And** 클립보드 복사 버튼이 URL 옆에 표시되어야 하고
**When** 복사 버튼을 클릭하면
**Then** URL이 클립보드에 복사되어야 하고
**And** 복사 성공 피드백(아이콘 변경 또는 toast)이 표시되어야 한다

### AC-007: 비공개 카드 공개 URL 접근 차단 (REQ-S-001)

**Given** 카드 요청이 is_public = false일 때
**When** 방문자가 /cards/[id] 페이지에 접근하면
**Then** 404 Not Found 페이지가 렌더링되어야 하고
**And** 카드 데이터가 응답에 포함되지 않아야 한다

**Given** 카드 요청이 is_public = true이지만 status = 'submitted'일 때
**When** 방문자가 /cards/[id] 페이지에 접근하면
**Then** 404 Not Found 페이지가 렌더링되어야 한다

### AC-008: 비확정 카드 토글 비활성화 (REQ-S-002)

**Given** 인증된 사용자가 status = 'processing' 카드 상세 페이지에 있을 때
**When** 공개/비공개 토글 영역을 확인하면
**Then** 토글 스위치가 비활성(disabled) 상태여야 하고
**And** "확정 또는 전달 완료된 카드만 공개할 수 있습니다" 툴팁이 표시되어야 하고
**And** 토글 클릭 시 API 호출이 발생하지 않아야 한다

### AC-009: 비공개 카드 데이터 노출 방지 (REQ-N-001)

**Given** 카드 요청이 is_public = false일 때
**When** GET /api/cards/[id] API를 직접 호출하면
**Then** HTTP 404 응답이 반환되어야 하고
**And** 응답 body에 카드 데이터가 포함되지 않아야 한다

**Given** 카드 요청이 is_public = true일 때
**When** GET /api/cards/[id] API 응답을 확인하면
**Then** created_by(사용자 이메일) 필드가 응답에 포함되지 않아야 한다

### AC-010: 공개 카드 갤러리 (REQ-O-001, Optional)

**Given** 공개 카드가 5개 이상 존재할 때
**When** 방문자가 /cards 페이지에 접근하면
**Then** 공개 카드가 그리드 형태로 표시되어야 하고
**And** 카드 앞면 썸네일이 표시되어야 하고
**When** 카드 썸네일을 클릭하면
**Then** /cards/[id] 상세 페이지로 이동해야 한다

---

## 엣지 케이스

### EC-001: 소유자가 아닌 사용자의 토글 시도

**Given** 인증된 사용자 A가 사용자 B의 카드 ID를 알고 있을 때
**When** PATCH /api/requests/my/[card-b-id]/visibility API를 호출하면
**Then** HTTP 403 Forbidden 또는 404 Not Found 응답이 반환되어야 하고
**And** 카드의 isPublic 상태가 변경되지 않아야 한다

### EC-002: 상태 변경 경합 조건

**Given** 카드가 confirmed 상태이고 사용자가 공개로 설정했을 때
**When** 관리자가 카드 상태를 revision_requested로 변경한 후
**And** 사용자가 공개/비공개 토글을 다시 시도하면
**Then** API가 422 Unprocessable Entity를 반환해야 하고
**And** "확정 또는 전달 완료된 카드만 공개할 수 있습니다" 에러 메시지가 표시되어야 한다

### EC-003: 존재하지 않는 카드 ID로 공개 URL 접근

**Given** 유효하지 않은 UUID 형식의 카드 ID가 있을 때
**When** 방문자가 /cards/[invalid-id] 페이지에 접근하면
**Then** 404 Not Found 페이지가 렌더링되어야 한다

### EC-004: 삭제(cancelled) 카드의 공개 접근

**Given** 이전에 공개였던 카드가 cancelled 상태로 변경되었을 때
**When** 방문자가 기존 공개 URL로 접근하면
**Then** 404 Not Found 페이지가 렌더링되어야 한다

### EC-005: 동시 토글 요청

**Given** 사용자가 토글 버튼을 빠르게 연속 클릭할 때
**When** 첫 번째 API 요청이 완료되기 전에 두 번째 클릭이 발생하면
**Then** 두 번째 클릭은 무시되어야 하고 (debounce 또는 loading state)
**And** 최종 상태가 일관성 있게 유지되어야 한다

---

## 보안 테스트 시나리오

### SEC-001: 인증 없는 토글 API 접근

**Given** 인증 토큰이 없는 상태에서
**When** PATCH /api/requests/my/[id]/visibility API를 호출하면
**Then** HTTP 401 Unauthorized 응답이 반환되어야 한다

### SEC-002: 관리자 토큰 없는 관리자 API 접근

**Given** admin-token 쿠키가 없는 상태에서
**When** PATCH /api/admin/requests/[id]/visibility API를 호출하면
**Then** HTTP 401 Unauthorized 응답이 반환되어야 한다

### SEC-003: 공개 카드 API 응답의 개인정보 제외 확인

**Given** 공개 카드가 존재할 때
**When** GET /api/cards/[id] API 응답을 검사하면
**Then** 응답 JSON에 `created_by`, `createdBy`, `email` 키가 존재하지 않아야 하고
**And** `statusHistory` 배열이 포함되지 않아야 하고
**And** `note` 필드가 포함되지 않아야 한다

### SEC-004: SQL Injection 방지

**Given** 악의적인 ID 값(`'; DROP TABLE card_requests; --`)이 주어졌을 때
**When** /cards/[id] 또는 /api/cards/[id]로 접근하면
**Then** 404 응답이 반환되어야 하고
**And** 데이터베이스에 영향이 없어야 한다

### SEC-005: is_public 필드 직접 조작 방지

**Given** 사용자가 PATCH /api/requests/my/[id]/visibility 이외의 API로
**When** is_public 필드를 포함한 업데이트를 시도하면
**Then** is_public 필드는 무시되거나 거부되어야 한다
(기존 updateRequest API에서 is_public 직접 수정 차단)

---

## 성능 기준

| 항목 | 기준 | 측정 방법 |
|------|------|-----------|
| 공개 카드 페이지 로딩 (SSR) | P95 < 500ms | Server Component 렌더링 시간 |
| 공개/비공개 토글 API 응답 | P95 < 300ms | API 응답 시간 |
| 공개 카드 조회 API 응답 | P95 < 200ms | API 응답 시간 |
| 갤러리 페이지 (12개 카드) | P95 < 800ms | 페이지 로딩 시간 |
| 토글 UI 반응 | < 100ms | 사용자 체감 반응 시간 |

---

## Quality Gate 기준

### TRUST 5 검증

| 항목 | 기준 | 검증 방법 |
|------|------|-----------|
| **Tested** | 신규 코드 85%+ coverage | `vitest --coverage` |
| **Tested** | 모든 API 엔드포인트 테스트 | 유닛 테스트 + 통합 테스트 |
| **Readable** | 영문 코드 주석, 명확한 네이밍 | 코드 리뷰 |
| **Unified** | ESLint/Prettier 통과 | `npm run lint` |
| **Secured** | 인증/인가 검증 완료 | SEC-001 ~ SEC-005 통과 |
| **Secured** | 비공개 카드 데이터 미노출 | AC-009 통과 |
| **Trackable** | Conventional Commits | Git log 검증 |

### LSP Quality Gate

| 항목 | 기준 |
|------|------|
| TypeScript 에러 | 0개 |
| ESLint 에러 | 0개 |
| ESLint 경고 | 10개 이하 |

---

## Definition of Done

- [ ] card_requests 테이블에 is_public 컬럼 추가 완료
- [ ] CardRequest 인터페이스에 isPublic 필드 추가 완료
- [ ] storage.ts 데이터 액세스 레이어 수정 완료
- [ ] 사용자 공개/비공개 토글 API 구현 완료 (PATCH /api/requests/my/[id]/visibility)
- [ ] 관리자 공개/비공개 변경 API 구현 완료 (PATCH /api/admin/requests/[id]/visibility)
- [ ] 공개 카드 조회 API 구현 완료 (GET /api/cards/[id])
- [ ] 미들웨어에 공개 경로 추가 완료 (/cards, /api/cards)
- [ ] VisibilityToggle 컴포넌트 구현 완료
- [ ] ShareUrlDisplay 컴포넌트 구현 완료
- [ ] 대시보드 상세 페이지에 토글/공유 URL 통합 완료
- [ ] 관리자 상세 페이지에 토글 통합 완료
- [ ] 공개 카드 뷰 페이지 (/cards/[id]) 구현 완료
- [ ] Open Graph 메타데이터 포함 완료
- [ ] AC-001 ~ AC-009 테스트 시나리오 전체 통과
- [ ] SEC-001 ~ SEC-005 보안 테스트 전체 통과
- [ ] EC-001 ~ EC-005 엣지 케이스 전체 통과
- [ ] TypeScript 컴파일 에러 0개
- [ ] ESLint 에러 0개
