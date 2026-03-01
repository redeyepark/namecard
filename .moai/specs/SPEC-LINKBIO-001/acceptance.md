---
spec_id: SPEC-LINKBIO-001
type: acceptance-criteria
version: "1.0.0"
created: "2026-03-01"
updated: "2026-03-01"
---

# SPEC-LINKBIO-001: 인수 기준

## 1. 레이아웃 및 디자인

### ACC-LAYOUT-01: 모바일 퍼스트 세로 레이아웃 (REQ-U01)

**Scenario 1: 모바일 단일 컬럼 렌더링**
```gherkin
Given 사용자가 모바일 기기(375px 너비)를 사용하고
When /profile/[id] 페이지에 접근하면
Then 모든 섹션이 단일 컬럼으로 세로 배치되고
And 콘텐츠 영역의 최대 너비가 680px이고
And 좌우 패딩이 16px(px-4) 이상이다
```

**Scenario 2: 데스크톱 중앙 정렬**
```gherkin
Given 사용자가 데스크톱 기기(1280px 너비)를 사용하고
When /profile/[id] 페이지에 접근하면
Then 콘텐츠가 max-width 680px로 중앙 정렬되고
And 좌우에 여백이 균등하게 표시된다
```

### ACC-DESIGN-01: 디자인 시스템 일관성 (REQ-U02)

**Scenario 1: 색상 및 폰트 적용**
```gherkin
Given 프로필 페이지가 렌더링되면
Then 배경색이 딥 네이비(#020912) 또는 오프 화이트(#fcfcfc) 계열이고
And 모든 UI 요소의 border-radius가 0px이고
And 제목 텍스트에 Figtree 폰트가 적용되고
And 본문 텍스트에 Anonymous Pro 폰트가 적용된다
```

### ACC-META-01: OG 메타데이터 생성 (REQ-U03)

**Scenario 1: 공개 프로필 메타데이터**
```gherkin
Given 사용자 "테스트유저"의 공개 프로필이 존재하고
When /profile/[userId] 페이지의 HTML을 요청하면
Then og:title에 "테스트유저 | Namecard"가 포함되고
And og:description에 Bio 텍스트 또는 카드 수 정보가 포함된다
```

**Scenario 2: 아바타 이미지 포함**
```gherkin
Given 사용자에게 아바타 URL이 설정되어 있고
When /profile/[userId] 페이지의 메타데이터가 생성되면
Then og:image에 아바타 URL이 포함된다
```

## 2. 섹션 레이아웃 순서

### ACC-SECTION-01: 세로 섹션 순서 (REQ-E01)

**Scenario 1: 전체 데이터가 존재하는 프로필**
```gherkin
Given 사용자에게 소셜 링크 2개, 커스텀 링크 3개, 카드 5장이 있고
When /profile/[id] 페이지에 접근하면
Then 다음 순서로 섹션이 표시된다:
  | 순서 | 섹션 |
  | 1 | 아바타(80px) + 이름 + Bio |
  | 2 | 소셜 아이콘 행 |
  | 3 | 커스텀 링크 버튼 목록 |
  | 4 | 카드 포트폴리오 |
  | 5 | QR/공유 버튼 |
```

**Scenario 2: 최소 데이터 프로필**
```gherkin
Given 사용자에게 소셜 링크 0개, 커스텀 링크 0개, 카드 0장이 있고
And 접근자가 방문자인 경우
When /profile/[id] 페이지에 접근하면
Then 아바타 + 이름만 표시되고
And 소셜 아이콘 행은 숨겨지고
And 링크 섹션은 숨겨지고
And 카드 포트폴리오 섹션은 숨겨진다
```

## 3. 소유자 기능

### ACC-OWNER-01: 프로필 편집 버튼 (REQ-E02)

**Scenario 1: 소유자 방문 시 편집 버튼 표시**
```gherkin
Given 인증된 사용자 A가 존재하고
When 사용자 A가 자신의 프로필(/profile/[A의 ID])에 접근하면
Then 화면 하단에 "프로필 편집" 플로팅 버튼이 표시된다
```

**Scenario 2: 방문자에게 편집 버튼 숨김**
```gherkin
Given 인증된 사용자 B가 존재하고
When 사용자 B가 다른 사용자 A의 프로필(/profile/[A의 ID])에 접근하면
Then "프로필 편집" 플로팅 버튼이 표시되지 않는다
```

**Scenario 3: 미인증 사용자에게 편집 버튼 숨김**
```gherkin
Given 미인증 방문자가 존재하고
When 공개 프로필(/profile/[id])에 접근하면
Then "프로필 편집" 플로팅 버튼이 표시되지 않는다
```

## 4. 커스텀 링크 CRUD

### ACC-LINK-CRUD-01: 링크 생성 (REQ-E03)

**Scenario 1: 유효한 링크 추가**
```gherkin
Given 프로필 소유자가 편집 모드에서
When title="내 블로그", url="https://blog.example.com"을 입력하고 저장하면
Then POST /api/profiles/me/links가 호출되고
And 201 응답과 함께 링크가 생성되고
And 링크 목록에 "내 블로그" 버튼이 추가된다
```

**Scenario 2: title 누락 시 에러**
```gherkin
Given 프로필 소유자가 링크 추가 모달에서
When title을 비워두고 url만 입력한 후 저장하면
Then "제목을 입력해주세요" 에러 메시지가 표시되고
And 링크가 생성되지 않는다
```

**Scenario 3: title 100자 초과 시 에러**
```gherkin
Given 프로필 소유자가 링크 추가 모달에서
When 101자 이상의 title을 입력하면
Then "제목은 100자 이내로 입력해주세요" 에러 메시지가 표시된다
```

### ACC-LINK-CRUD-02: 링크 수정 (REQ-E03)

**Scenario 1: 링크 제목 수정**
```gherkin
Given 프로필 소유자에게 "내 블로그" 링크가 존재하고
When 해당 링크를 "기술 블로그"로 수정하고 저장하면
Then PUT /api/profiles/me/links/[linkId]가 호출되고
And 200 응답과 함께 링크가 수정되고
And 링크 목록에 "기술 블로그"로 표시된다
```

**Scenario 2: 링크 URL 수정**
```gherkin
Given 프로필 소유자에게 기존 링크가 존재하고
When URL을 "https://new-blog.com"으로 수정하고 저장하면
Then 해당 링크의 URL이 업데이트된다
```

### ACC-LINK-CRUD-03: 링크 삭제 (REQ-E03)

**Scenario 1: 링크 삭제 확인**
```gherkin
Given 프로필 소유자에게 "내 블로그" 링크가 존재하고
When 해당 링크의 삭제 버튼을 클릭하면
Then 삭제 확인 메시지가 표시되고
When 확인을 선택하면
Then DELETE /api/profiles/me/links/[linkId]가 호출되고
And 링크 목록에서 "내 블로그"가 제거된다
```

**Scenario 2: 삭제 취소**
```gherkin
Given 프로필 소유자가 링크 삭제 확인 메시지를 보고
When 취소를 선택하면
Then 링크가 유지된다
```

## 5. 링크 클릭

### ACC-LINK-CLICK-01: 방문자 링크 클릭 (REQ-E04)

**Scenario 1: 새 탭에서 URL 열기**
```gherkin
Given 프로필에 url="https://blog.example.com" 링크가 존재하고
When 방문자가 해당 링크 버튼을 클릭하면
Then https://blog.example.com이 새 탭(target="_blank")으로 열리고
And rel="noopener noreferrer" 속성이 적용된다
```

**Scenario 2: 링크 버튼 UI**
```gherkin
Given 프로필에 커스텀 링크가 존재하면
Then 각 링크가 전체 너비 버튼으로 표시되고
And title 텍스트가 중앙 정렬되고
And 호버 시 시각적 피드백이 제공된다
```

## 6. 소셜 링크

### ACC-SOCIAL-01: 소셜 링크 편집 (REQ-E05)

**Scenario 1: 소셜 링크 추가**
```gherkin
Given 프로필 소유자가 편집 모드에서
When Instagram URL "https://instagram.com/myuser"를 입력하고 저장하면
Then PUT /api/profiles/me가 socialLinks 필드와 함께 호출되고
And user_profiles.social_links JSONB에 저장되고
And 소셜 아이콘 행에 Instagram 아이콘이 표시된다
```

**Scenario 2: 여러 소셜 링크 설정**
```gherkin
Given 프로필 소유자가 편집 모드에서
When Instagram, LinkedIn, Email 소셜 링크를 설정하면
Then 3개의 소셜 아이콘이 가로 행으로 표시되고
And 각 아이콘 클릭 시 해당 URL이 새 탭으로 열린다
```

### ACC-SOCIAL-ICON-01: 소셜 아이콘 행 표시 (REQ-S04)

**Scenario 1: 소셜 링크 존재 시 아이콘 표시**
```gherkin
Given 사용자에게 Instagram, LinkedIn 소셜 링크가 설정되어 있고
When /profile/[id] 페이지에 접근하면
Then 프로필 이름 아래에 Instagram, LinkedIn 아이콘이 가로 행으로 표시된다
```

**Scenario 2: 소셜 링크 없을 때 방문자 뷰**
```gherkin
Given 사용자에게 소셜 링크가 0개이고
And 접근자가 방문자인 경우
When /profile/[id] 페이지에 접근하면
Then 소셜 아이콘 행이 표시되지 않는다
```

## 7. 비공개 프로필

### ACC-PRIVATE-01: 비공개 프로필 잠금 (REQ-S01)

**Scenario 1: 비소유자에게 잠금 화면**
```gherkin
Given 사용자 A의 프로필이 is_public=false로 설정되어 있고
When 다른 사용자 B가 /profile/[A의 ID]에 접근하면
Then 자물쇠 아이콘과 "비공개 프로필입니다" 메시지가 표시되고
And 프로필 상세 정보, 링크, 카드가 표시되지 않는다
```

**Scenario 2: 소유자는 비공개 프로필 접근 가능**
```gherkin
Given 사용자 A의 프로필이 is_public=false로 설정되어 있고
When 사용자 A가 자신의 프로필(/profile/[A의 ID])에 접근하면
Then 프로필 전체 내용이 정상적으로 표시되고
And "프로필 편집" 플로팅 버튼이 표시된다
```

## 8. 빈 상태 처리

### ACC-EMPTY-CARD-01: 카드 없음 (REQ-S02)

**Scenario 1: 카드 0장일 때 섹션 숨김**
```gherkin
Given 사용자에게 공개 카드가 0장이고
When /profile/[id] 페이지에 접근하면
Then 카드 포트폴리오 섹션이 렌더링되지 않는다
```

**Scenario 2: 카드 1장 이상일 때 섹션 표시**
```gherkin
Given 사용자에게 공개 카드가 3장 있고
When /profile/[id] 페이지에 접근하면
Then 카드 포트폴리오 섹션이 표시되고
And 3장의 카드 썸네일이 렌더링된다
```

### ACC-EMPTY-LINK-01: 링크 없음 (REQ-S03)

**Scenario 1: 소유자에게 안내 메시지**
```gherkin
Given 프로필 소유자에게 커스텀 링크가 0개이고
When 소유자가 자신의 프로필에 접근하면
Then "링크를 추가하세요" 안내 메시지가 표시되고
And "링크 추가" 버튼이 제공된다
```

**Scenario 2: 방문자에게 섹션 숨김**
```gherkin
Given 사용자에게 커스텀 링크가 0개이고
When 방문자가 해당 프로필에 접근하면
Then 링크 섹션이 렌더링되지 않는다
```

## 9. 보안

### ACC-XSS-01: javascript: URL 차단 (REQ-N01)

**Scenario 1: javascript 프로토콜 거부**
```gherkin
Given 프로필 소유자가 링크 추가 모달에서
When url="javascript:alert('xss')"를 입력하고 저장하면
Then "유효하지 않은 URL입니다" 에러 메시지가 표시되고
And 링크가 저장되지 않는다
```

**Scenario 2: data URI 거부**
```gherkin
Given 프로필 소유자가 링크 추가 모달에서
When url="data:text/html,<script>alert(1)</script>"를 입력하면
Then "유효하지 않은 URL입니다" 에러 메시지가 표시되고
And 링크가 저장되지 않는다
```

**Scenario 3: 유효한 URL 허용**
```gherkin
Given 프로필 소유자가 링크 추가 모달에서
When url="https://example.com"을 입력하고 저장하면
Then 링크가 정상적으로 저장된다
```

### ACC-AUTH-01: 미인증 수정 차단 (REQ-N02)

**Scenario 1: 미인증 링크 생성 거부**
```gherkin
Given 인증되지 않은 사용자가
When POST /api/profiles/me/links를 호출하면
Then 401 Unauthorized 응답이 반환된다
```

**Scenario 2: 미인증 프로필 수정 거부**
```gherkin
Given 인증되지 않은 사용자가
When PUT /api/profiles/me를 호출하면
Then 401 Unauthorized 응답이 반환된다
```

### ACC-AUTHZ-01: 타인 링크 수정 차단 (REQ-N03)

**Scenario 1: 타인 링크 수정 거부**
```gherkin
Given 사용자 A의 링크 linkId가 존재하고
When 사용자 B가 PUT /api/profiles/me/links/[linkId]를 호출하면
Then 404 Not Found 응답이 반환된다(소유권 검증 실패)
```

**Scenario 2: 타인 링크 삭제 거부**
```gherkin
Given 사용자 A의 링크 linkId가 존재하고
When 사용자 B가 DELETE /api/profiles/me/links/[linkId]를 호출하면
Then 404 Not Found 응답이 반환된다
```

## 10. 링크 순서 변경

### ACC-REORDER-01: 링크 순서 변경 (REQ-E03 확장)

**Scenario 1: 순서 변경 API**
```gherkin
Given 프로필 소유자에게 링크 A(sort_order=0), B(sort_order=1), C(sort_order=2)가 있고
When PATCH /api/profiles/me/links/reorder를 linkIds=[C, A, B]로 호출하면
Then 링크 순서가 C(0), A(1), B(2)로 업데이트되고
And 프로필 페이지에서 C, A, B 순서로 표시된다
```

## 11. 성능 기준

### ACC-PERF-01: 페이지 로드 성능

**Scenario 1: 초기 로드**
```gherkin
Given 프로필에 소셜 링크 5개, 커스텀 링크 10개, 카드 20장이 있고
When /profile/[id] 페이지에 처음 접근하면
Then 서버 사이드 렌더링이 완료되어 FCP(First Contentful Paint)가 1.5초 이내이다
```

**Scenario 2: API 응답 시간**
```gherkin
Given 링크 CRUD API가 호출되면
Then 응답 시간이 500ms 이내이다
```

### ACC-PERF-02: 번들 사이즈

**Scenario 1: 추가 패키지 없음**
```gherkin
Given SPEC-LINKBIO-001이 구현되면
Then 새로운 npm 패키지가 추가되지 않고
And 기존 lucide-react 아이콘만 활용된다
```

## 12. 접근성

### ACC-A11Y-01: 키보드 및 스크린 리더 지원

**Scenario 1: 소셜 아이콘 접근성**
```gherkin
Given 소셜 아이콘 행이 표시되면
Then 각 아이콘에 aria-label이 설정되고 (예: "Instagram 프로필")
And Tab 키로 아이콘 간 이동이 가능하고
And Enter 키로 링크가 열린다
```

**Scenario 2: 링크 버튼 접근성**
```gherkin
Given 커스텀 링크 버튼이 표시되면
Then 각 버튼이 <a> 태그로 렌더링되고
And Tab 키로 버튼 간 이동이 가능하고
And 터치 영역이 최소 44px 이상이다
```

**Scenario 3: 편집 모달 접근성**
```gherkin
Given 링크 편집 모달이 열리면
Then 포커스가 모달 내부로 트랩되고
And Escape 키로 모달이 닫히고
And 모달 닫힘 시 포커스가 트리거 버튼으로 복원된다
```

## 13. Definition of Done (완료 정의)

- [ ] 모든 ACC 시나리오가 수동 테스트를 통과
- [ ] 모바일(375px), 태블릿(768px), 데스크톱(1280px) 반응형 검증 완료
- [ ] REQ-N01~N03 보안 요구사항 API 레벨 검증 완료
- [ ] 기존 프로필 페이지 기능 회귀 없음 (카드 표시, OG 메타데이터, 비공개 프로필)
- [ ] TypeScript 컴파일 에러 0건
- [ ] ESLint 경고 0건
- [ ] Cloudflare Workers 빌드 성공
- [ ] 디자인 시스템 일관성 검증 (0px radius, 색상, 폰트)
