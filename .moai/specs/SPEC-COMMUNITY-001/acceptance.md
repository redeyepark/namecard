# SPEC-COMMUNITY-001: 수용 기준 (Acceptance Criteria)

---
spec_id: SPEC-COMMUNITY-001
version: 1.0.0
created: 2026-02-27
---

## 1. 데이터베이스 마이그레이션 테스트

### AC-DB-001: user_profiles 테이블 생성

```gherkin
Scenario: user_profiles 테이블이 올바르게 생성된다
  Given Supabase PostgreSQL 데이터베이스에 접속한 상태
  When user_profiles 마이그레이션 SQL을 실행하면
  Then user_profiles 테이블이 생성되어야 한다
    And id (UUID PK), display_name (VARCHAR 100), bio (VARCHAR 200), avatar_url (TEXT), is_public (BOOLEAN DEFAULT true), created_at, updated_at 컬럼이 존재해야 한다
    And id 컬럼이 auth.users(id)를 FK로 참조하며 ON DELETE CASCADE가 설정되어야 한다
    And RLS가 활성화되어 있어야 한다
```

### AC-DB-002: card_requests 테이블 확장

```gherkin
Scenario: card_requests에 user_id와 like_count 컬럼이 추가된다
  Given card_requests 테이블이 존재하는 상태
  When ALTER TABLE 마이그레이션을 실행하면
  Then user_id (UUID, NULLABLE) 컬럼이 추가되어야 한다
    And like_count (INTEGER, DEFAULT 0) 컬럼이 추가되어야 한다
    And 기존 데이터에 영향을 주지 않아야 한다
```

### AC-DB-003: user_id backfill

```gherkin
Scenario: 기존 card_requests의 user_id가 email 기반으로 채워진다
  Given card_requests에 created_by = "test@example.com"인 레코드가 3건 존재하고
    And auth.users에 email = "test@example.com", id = "uuid-123"인 사용자가 존재하는 상태
  When backfill UPDATE 쿼리를 실행하면
  Then 3건의 card_requests 레코드 모두 user_id = "uuid-123"으로 설정되어야 한다

Scenario: auth.users에 없는 email의 user_id는 NULL로 유지된다
  Given card_requests에 created_by = "unknown@example.com"인 레코드가 존재하고
    And auth.users에 해당 email이 없는 상태
  When backfill UPDATE 쿼리를 실행하면
  Then 해당 레코드의 user_id는 NULL로 유지되어야 한다
```

### AC-DB-004: RLS 정책 검증

```gherkin
Scenario: 공개 프로필은 모든 사용자가 조회할 수 있다
  Given user_profiles에 is_public = true인 프로필이 존재하는 상태
  When 미인증 사용자(anon 키)가 해당 프로필을 SELECT하면
  Then 프로필 데이터가 반환되어야 한다

Scenario: 비공개 프로필은 소유자만 조회할 수 있다
  Given user_profiles에 is_public = false, id = "user-A"인 프로필이 존재하는 상태
  When user-B가 해당 프로필을 SELECT하면
  Then 결과가 반환되지 않아야 한다
  When user-A 본인이 해당 프로필을 SELECT하면
  Then 프로필 데이터가 반환되어야 한다

Scenario: 타인의 프로필은 수정할 수 없다
  Given user-A의 프로필이 존재하는 상태
  When user-B가 user-A의 프로필을 UPDATE하려 하면
  Then RLS 정책에 의해 거부되어야 한다
```

---

## 2. 프로필 시스템 테스트

### AC-PROFILE-001: 프로필 페이지 렌더링

```gherkin
Scenario: 공개 프로필 페이지가 올바르게 표시된다
  Given user_profiles에 display_name = "홍길동", bio = "부캐를 사랑합니다"인 공개 프로필이 존재하고
    And 해당 사용자의 공개 카드가 5개 존재하는 상태
  When 방문자가 /profile/{userId}에 접속하면
  Then 아바타, "홍길동", "부캐를 사랑합니다"가 표시되어야 한다
    And 카드 수 "5"가 표시되어야 한다
    And 5개의 카드가 그리드 형태로 표시되어야 한다
    And Open Graph 메타 태그에 "홍길동" 이름이 포함되어야 한다

Scenario: 비공개 프로필 접근 시 제한 메시지 표시
  Given user_profiles에 is_public = false인 프로필이 존재하는 상태
  When 타인이 /profile/{userId}에 접속하면
  Then "비공개 프로필입니다" 메시지가 표시되어야 한다
    And 카드 그리드가 표시되지 않아야 한다

Scenario: 존재하지 않는 프로필 접근 시 404 반환
  Given 존재하지 않는 userId가 주어진 상태
  When /profile/{invalidUserId}에 접속하면
  Then 404 Not Found 페이지가 표시되어야 한다
```

### AC-PROFILE-002: 프로필 통계 정확성

```gherkin
Scenario: 카드 수와 좋아요 합계가 정확하게 계산된다
  Given 사용자 A가 공개 카드 3개 (like_count: 10, 5, 0)와 비공개 카드 1개 (like_count: 3)를 가진 상태
  When 사용자 A의 프로필 페이지에 접속하면
  Then 카드 수는 "3" (공개 카드만)으로 표시되어야 한다
    And 총 좋아요 수는 "15" (공개 카드의 like_count 합계)로 표시되어야 한다
```

### AC-PROFILE-003: 프로필 자동 생성

```gherkin
Scenario: 첫 로그인 시 프로필이 자동 생성된다
  Given auth.users에 등록되어 있으나 user_profiles에 레코드가 없는 사용자가
    And card_requests에 displayName = "김부캐"인 카드가 존재하는 상태
  When 해당 사용자가 로그인하면
  Then user_profiles에 display_name = "김부캐"인 새 레코드가 생성되어야 한다
    And is_public = true (기본값)로 설정되어야 한다

Scenario: 카드가 없는 사용자의 첫 로그인
  Given auth.users에 email = "new@example.com"으로 등록되어 있으나
    And card_requests에 해당 사용자의 카드가 없는 상태
  When 해당 사용자가 로그인하면
  Then user_profiles에 display_name = "new" (email 앞부분)인 레코드가 생성되어야 한다

Scenario: 이미 프로필이 있는 사용자의 재로그인
  Given user_profiles에 이미 레코드가 있는 사용자가
  When 다시 로그인하면
  Then 기존 프로필이 유지되어야 한다 (중복 생성 없음)
```

---

## 3. 피드 시스템 테스트

### AC-FEED-001: 기본 피드 뷰

```gherkin
Scenario: /cards 페이지가 시간순 피드를 기본으로 표시한다
  Given is_public = true AND status IN ('confirmed', 'delivered')인 카드가 20개 존재하는 상태
  When 방문자가 /cards에 접속하면
  Then 최신 12개의 카드가 시간순(최신순)으로 표시되어야 한다
    And 이벤트별 그룹 헤더가 표시되지 않아야 한다
    And 테마 필터 탭이 상단에 표시되어야 한다
    And 정렬 토글(최신순/인기순)이 표시되어야 한다
```

### AC-FEED-002: 테마 필터

```gherkin
Scenario: 특정 테마로 피드를 필터링한다
  Given pokemon 테마 카드 5개, classic 테마 카드 10개가 존재하는 상태
  When 사용자가 "Pokemon" 테마 탭을 클릭하면
  Then pokemon 테마 카드 5개만 표시되어야 한다
    And classic 테마 카드는 표시되지 않아야 한다

Scenario: "All" 탭 클릭 시 전체 카드 표시
  Given 테마 필터가 "Pokemon"으로 설정된 상태
  When 사용자가 "All" 탭을 클릭하면
  Then 모든 테마의 카드가 표시되어야 한다
```

### AC-FEED-003: 무한 스크롤

```gherkin
Scenario: 스크롤 시 추가 카드가 자동 로딩된다
  Given 총 30개의 공개 카드가 존재하고 초기 12개가 표시된 상태
  When 사용자가 피드 하단으로 스크롤하면
  Then IntersectionObserver가 트리거되어야 한다
    And GET /api/feed?cursor={lastCardTimestamp} 요청이 발생해야 한다
    And 다음 12개 카드가 기존 목록 아래에 추가되어야 한다
    And 로딩 인디케이터(스피너)가 로딩 중 표시되어야 한다

Scenario: 더 이상 카드가 없을 때 로딩이 중단된다
  Given 총 15개의 카드가 존재하고 초기 12개 + 추가 3개가 모두 표시된 상태
  When 사용자가 다시 하단으로 스크롤하면
  Then 추가 API 요청이 발생하지 않아야 한다
    And "더 이상 카드가 없습니다" 메시지가 표시되어야 한다
```

### AC-FEED-004: 정렬 토글

```gherkin
Scenario: 인기순 정렬로 전환한다
  Given 카드 A (like_count: 50), 카드 B (like_count: 100), 카드 C (like_count: 10)가 존재하는 상태
  When 사용자가 "인기순" 정렬 토글을 클릭하면
  Then 카드가 B(100) -> A(50) -> C(10) 순서로 표시되어야 한다

Scenario: 최신순 정렬로 복귀한다
  Given 인기순 정렬이 적용된 상태
  When 사용자가 "최신순" 토글을 클릭하면
  Then 카드가 submitted_at 내림차순으로 표시되어야 한다
```

---

## 4. 카드 썸네일 테스트

### AC-THUMB-001: 사용자 정보 오버레이

```gherkin
Scenario: 피드 카드에 작성자 정보가 표시된다
  Given 사용자 "홍길동"이 작성한 공개 카드가 피드에 표시된 상태
  When 카드 썸네일을 확인하면
  Then 카드 하단에 작은 원형 아바타(24px)와 "홍길동" 이름이 오버레이로 표시되어야 한다
    And 하트 아이콘과 함께 like_count가 표시되어야 한다

Scenario: user_id가 NULL인 카드의 사용자 정보
  Given user_id가 NULL인 카드 (backfill 되지 않은 경우)가 피드에 표시된 상태
  When 카드 썸네일을 확인하면
  Then 사용자 아바타와 이름 오버레이가 표시되지 않아야 한다
    And 나머지 카드 정보(테마 뱃지, like_count 등)는 정상 표시되어야 한다
```

### AC-THUMB-002: 프로필 네비게이션

```gherkin
Scenario: 카드의 사용자 정보 클릭 시 프로필로 이동한다
  Given 피드에 사용자 "홍길동" (userId: "abc-123")의 카드가 표시된 상태
  When 사용자가 카드 하단의 "홍길동" 이름 영역을 클릭하면
  Then /profile/abc-123 페이지로 네비게이션되어야 한다
    And 카드 상세 페이지(/cards/[id])로 이동하지 않아야 한다 (이벤트 전파 차단)

Scenario: 카드 본문 영역 클릭 시 카드 상세로 이동한다
  Given 피드에 카드 (id: "card-456")가 표시된 상태
  When 사용자가 카드의 이미지 영역을 클릭하면
  Then /cards/card-456 페이지로 네비게이션되어야 한다
```

---

## 5. API 테스트

### AC-API-001: 피드 API

```gherkin
Scenario: 기본 피드 요청이 올바른 데이터를 반환한다
  Given 공개 확정 카드가 15개 존재하는 상태
  When GET /api/feed 요청을 보내면
  Then 200 OK와 함께 12개의 cards 배열이 반환되어야 한다
    And nextCursor가 마지막 카드의 submitted_at 값이어야 한다
    And hasMore가 true여야 한다
    And 각 카드에 userId, userDisplayName, userAvatarUrl, likeCount 필드가 포함되어야 한다
    And created_by (email) 필드가 포함되지 않아야 한다

Scenario: cursor 기반 페이지네이션이 동작한다
  Given 공개 확정 카드가 15개 존재하는 상태
  When GET /api/feed?cursor={12번째카드의submitted_at} 요청을 보내면
  Then 나머지 3개의 cards 배열이 반환되어야 한다
    And hasMore가 false여야 한다
    And nextCursor가 null이어야 한다

Scenario: 테마 필터가 올바르게 적용된다
  Given pokemon 테마 카드 5개, classic 테마 카드 10개가 존재하는 상태
  When GET /api/feed?theme=pokemon 요청을 보내면
  Then 5개의 pokemon 테마 카드만 반환되어야 한다

Scenario: 잘못된 파라미터에 대한 에러 처리
  When GET /api/feed?limit=100 요청을 보내면
  Then limit이 50으로 클램핑되어 최대 50개까지만 반환되어야 한다
  When GET /api/feed?limit=-1 요청을 보내면
  Then limit이 1로 클램핑되어 1개가 반환되어야 한다
```

### AC-API-002: 프로필 수정 API

```gherkin
Scenario: 인증된 사용자가 자신의 프로필을 수정한다
  Given 인증된 사용자 A의 프로필이 존재하는 상태
  When PUT /api/profiles/me 요청에 { displayName: "새이름", bio: "새 소개" }를 보내면
  Then 200 OK와 함께 업데이트된 프로필이 반환되어야 한다
    And user_profiles 테이블이 업데이트되어야 한다

Scenario: 미인증 사용자의 프로필 수정 요청이 거부된다
  When 인증 토큰 없이 PUT /api/profiles/me 요청을 보내면
  Then 401 Unauthorized가 반환되어야 한다

Scenario: bio가 200자를 초과하면 거부된다
  Given 인증된 사용자의 프로필이 존재하는 상태
  When PUT /api/profiles/me 요청에 bio 길이 201자를 보내면
  Then 400 Bad Request와 함께 "bio는 200자를 초과할 수 없습니다" 메시지가 반환되어야 한다

Scenario: display_name이 비어있으면 거부된다
  Given 인증된 사용자의 프로필이 존재하는 상태
  When PUT /api/profiles/me 요청에 displayName: ""을 보내면
  Then 400 Bad Request와 함께 "display_name은 필수입니다" 메시지가 반환되어야 한다
```

---

## 6. 프로필 설정 테스트

### AC-SETTINGS-001: 프로필 편집 통합

```gherkin
Scenario: 설정 페이지에서 프로필을 편집하고 저장한다
  Given 인증된 사용자가 /dashboard/settings에 접속한 상태
  When 프로필 편집 섹션에서 display_name을 "새이름"으로 변경하고 "저장" 버튼을 클릭하면
  Then "프로필이 저장되었습니다" 성공 메시지가 표시되어야 한다
    And /profile/{userId} 페이지에서 "새이름"이 표시되어야 한다

Scenario: 설정 페이지에 프로필 편집 섹션과 비밀번호 변경 섹션이 함께 표시된다
  Given 인증된 사용자(email provider)가 /dashboard/settings에 접속한 상태
  When 페이지가 로딩되면
  Then 프로필 편집 섹션이 비밀번호 변경 섹션보다 위에 표시되어야 한다
    And 프로필 편집 섹션에 display_name, bio, 아바타 업로드, 공개/비공개 토글이 있어야 한다
```

---

## 7. 엣지 케이스 테스트

### AC-EDGE-001: 빈 프로필

```gherkin
Scenario: 카드가 하나도 없는 사용자의 프로필
  Given 프로필은 존재하지만 공개 카드가 0개인 사용자가
  When 해당 프로필 페이지에 접속하면
  Then "아직 등록된 카드가 없습니다" 빈 상태 메시지가 표시되어야 한다
    And 카드 수 "0", 좋아요 수 "0"이 표시되어야 한다
```

### AC-EDGE-002: 동시 프로필 생성 방지

```gherkin
Scenario: 동시에 두 번 로그인해도 프로필이 한 개만 생성된다
  Given user_profiles에 레코드가 없는 사용자가
  When 두 개의 탭에서 동시에 로그인하면
  Then user_profiles에 해당 사용자의 레코드가 정확히 1개만 존재해야 한다
    (UPSERT / ON CONFLICT DO NOTHING 패턴으로 보장)
```

### AC-EDGE-003: 하위 호환성

```gherkin
Scenario: 기존 이벤트별 갤러리 뷰가 여전히 접근 가능하다
  Given /cards 페이지가 기본 피드 뷰로 변경된 상태
  When 사용자가 "이벤트별 보기" 토글을 클릭하면
  Then 기존 이벤트별 그룹화된 카드 목록이 표시되어야 한다

Scenario: user_id가 NULL인 기존 카드도 피드에 정상 표시된다
  Given backfill 되지 않은 (user_id = NULL) 카드가 존재하는 상태
  When /cards 피드에서 해당 카드가 표시되면
  Then 카드 썸네일은 정상 렌더링되어야 한다
    And 사용자 정보 오버레이만 생략되어야 한다
```

### AC-EDGE-004: 모바일 반응형

```gherkin
Scenario: 모바일에서 피드가 올바르게 표시된다
  Given 모바일 뷰포트(375px)에서 /cards에 접속한 상태
  When 페이지가 로딩되면
  Then 카드가 2열 그리드로 표시되어야 한다
    And 테마 필터 탭이 가로 스크롤 가능해야 한다
    And 무한 스크롤이 터치 스크롤에서 정상 동작해야 한다

Scenario: 모바일에서 프로필 페이지가 올바르게 표시된다
  Given 모바일 뷰포트(375px)에서 /profile/{userId}에 접속한 상태
  When 페이지가 로딩되면
  Then 프로필 정보가 세로 배치로 표시되어야 한다
    And 카드 그리드가 2열로 표시되어야 한다
```

---

## 8. 성능 기준

| 항목 | 기준 | 측정 방법 |
|------|------|-----------|
| 피드 API 응답 시간 | P95 < 500ms | Supabase Dashboard / API 로그 |
| 프로필 페이지 TTFB | < 1s | Lighthouse / WebPageTest |
| 무한 스크롤 로딩 시간 | 추가 페이지 < 300ms | Browser Network 탭 |
| FeedCardThumbnail 렌더링 | 60fps 유지 (스크롤 중) | Chrome DevTools Performance |
| 이미지 lazy loading | viewport 진입 전까지 미로딩 | Network 탭에서 이미지 요청 타이밍 확인 |

---

## 9. 품질 게이트 기준

| 항목 | 기준 |
|------|------|
| TypeScript 타입 에러 | 0개 |
| ESLint 에러 | 0개 |
| 빌드 성공 | `npm run build` 에러 없음 |
| 기존 테스트 통과 | `npm test` 전체 통과 |
| 신규 API 입력값 검증 | 모든 API endpoint에 대한 잘못된 입력 처리 확인 |
| RLS 정책 동작 | 공개/비공개 프로필 접근 제어 확인 |
| 하위 호환성 | 기존 /cards, /cards/[id] 페이지 정상 동작 |
| 이메일 노출 없음 | 모든 공개 API 응답에서 created_by 필드 미포함 확인 |
| Cloudflare Workers 배포 | `npm run cf:build` 성공 |

---

## 10. Definition of Done

- [ ] 모든 데이터베이스 마이그레이션 SQL이 Supabase 대시보드에서 실행 완료
- [ ] user_profiles RLS 정책이 올바르게 적용됨
- [ ] 프로필 자동 생성이 로그인 시 동작함
- [ ] /profile/[id] 페이지가 공개 프로필을 올바르게 표시함
- [ ] /cards 피드가 시간순 기본 뷰로 전환됨
- [ ] 테마 필터, 정렬 토글, 무한 스크롤이 정상 동작함
- [ ] 피드 카드에 사용자 정보 오버레이와 좋아요 수가 표시됨
- [ ] /dashboard/settings에 프로필 편집 섹션이 추가됨
- [ ] 모든 API 엔드포인트가 올바른 인증/인가 규칙을 적용함
- [ ] 기존 이벤트별 갤러리 뷰가 옵션으로 여전히 접근 가능함
- [ ] 모바일 반응형 레이아웃 확인 완료
- [ ] TypeScript 타입 에러 0개, ESLint 에러 0개
- [ ] `npm run build` 및 `npm run cf:build` 성공
- [ ] 기존 테스트 전체 통과
