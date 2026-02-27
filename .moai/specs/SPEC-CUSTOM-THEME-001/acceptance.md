---
id: SPEC-CUSTOM-THEME-001
type: acceptance
version: "1.0.0"
status: planned
created: "2026-02-27"
updated: "2026-02-27"
---

# SPEC-CUSTOM-THEME-001: 인수 기준

## 인수 기준 목록

### AC-001: 빌트인 테마 하위 호환성 (REQ-U-001)

**Given** 기존 6개 빌트인 테마(classic, pokemon, hearthstone, harrypotter, tarot, nametag)가 존재하고
**When** 커스텀 테마 기능이 추가된 상태에서 기존 빌트인 테마를 사용하면
**Then** 기존과 동일한 렌더링 결과가 나타나야 하며 어떠한 시각적/기능적 변경도 없어야 한다

검증 방법: 빌트인 테마 6종 각각의 앞면/뒷면 스크린샷 비교 (변경 전 vs 변경 후)

---

### AC-002: ThemeSelector 통합 표시 (REQ-U-002)

**Given** 2개 이상의 활성 커스텀 테마가 존재하고
**When** 사용자가 에디터의 ThemeSelector를 열면
**Then** 빌트인 테마 6개와 활성 커스텀 테마가 모두 표시되어야 한다

검증 방법: ThemeSelector 렌더링 확인, 빌트인 섹션과 커스텀 섹션 구분 확인

---

### AC-003: html-to-image 호환성 (REQ-U-003)

**Given** 커스텀 테마가 선택된 카드가 존재하고
**When** 해당 카드를 PNG로 내보내기하면
**Then** 커스텀 색상, 폰트, 테두리가 모두 정확하게 반영된 이미지가 생성되어야 한다

검증 방법: 커스텀 테마 카드 PNG 내보내기 후 시각적 검증

---

### AC-004: DB 테이블 생성 (REQ-U-004)

**Given** 007_add_custom_themes.sql 마이그레이션이 적용되고
**When** custom_themes 테이블을 조회하면
**Then** slug, name, base_template, front/back 색상, font_family, border 스타일, custom_fields 등 모든 컬럼이 존재해야 한다

검증 방법: `\d custom_themes` 스키마 확인

---

### AC-005: 디자인 시스템 준수 (REQ-U-005)

**Given** 관리자 커스텀 테마 관리 UI가 구현되고
**When** UI를 렌더링하면
**Then** Deep navy (#020912), off-white (#fcfcfc), Sharp corners (0px), 최소 터치 타겟 44px 디자인 시스템을 준수해야 한다

검증 방법: 시각적 검증 + 접근성 감사

---

### AC-006: 커스텀 테마 생성 폼 (REQ-AC-001)

**Given** 관리자가 테마 관리 페이지에 접근하고
**When** "새 커스텀 테마 만들기" 버튼을 클릭하면
**Then** 테마 이름, slug, 기본 템플릿, 앞/뒷면 색상, 폰트, 테두리, 커스텀 필드 입력 폼이 표시되어야 한다

검증 방법: 폼 렌더링 확인, 모든 필드 존재 여부 확인

---

### AC-007: 커스텀 테마 생성 (REQ-AC-002)

**Given** 관리자가 커스텀 테마 생성 폼에 유효한 값을 입력하고
**When** 폼을 제출하면
**Then** custom_themes 테이블에 새 레코드가 생성되고 테마 목록이 갱신되어야 한다

검증 방법: POST API 호출 후 DB 레코드 확인, UI 목록 갱신 확인

---

### AC-008: 커스텀 테마 편집 폼 (REQ-AC-003)

**Given** 기존 커스텀 테마 'corporate-blue'가 존재하고
**When** 관리자가 해당 테마의 "편집" 버튼을 클릭하면
**Then** 현재 설정값이 채워진 편집 폼이 표시되어야 한다

검증 방법: 편집 폼의 초기값이 DB 저장값과 일치하는지 확인

---

### AC-009: 커스텀 테마 업데이트 (REQ-AC-004)

**Given** 관리자가 커스텀 테마의 배경색을 #FF0000에서 #0000FF로 변경하고
**When** 저장을 클릭하면
**Then** DB에 변경이 반영되고, 해당 테마를 사용하는 카드 미리보기에도 반영되어야 한다

검증 방법: PATCH API 후 DB 값 확인, 카드 렌더링에 새 색상 적용 확인

---

### AC-010: 커스텀 테마 삭제 확인 (REQ-AC-005)

**Given** 관리자가 커스텀 테마의 "삭제" 버튼을 클릭하고
**When** 시스템이 사용 현황을 확인하면
**Then** 해당 테마를 사용하는 의뢰 건수가 조회되어야 한다

검증 방법: DELETE API 응답의 usageCount 필드 확인

---

### AC-011: 미사용 커스텀 테마 삭제 (REQ-AC-006)

**Given** 커스텀 테마 'test-theme'에 연결된 의뢰가 0건이고
**When** 관리자가 삭제를 확인하면
**Then** custom_themes 테이블에서 해당 레코드가 삭제되어야 한다

검증 방법: DELETE API 200 응답 확인, DB 레코드 부재 확인

---

### AC-012: 사용 중 커스텀 테마 삭제 차단 (REQ-AC-007)

**Given** 커스텀 테마 'corporate-blue'에 연결된 의뢰가 5건 존재하고
**When** 관리자가 삭제를 시도하면
**Then** "이 테마를 사용하는 의뢰가 5건 있어 삭제할 수 없습니다" 메시지가 표시되고 삭제가 차단되어야 한다

검증 방법: DELETE API 409 응답 확인, UI 에러 메시지 표시 확인

---

### AC-013: 실시간 미리보기 (REQ-PV-001)

**Given** 관리자가 커스텀 테마 생성 폼에서 작업 중이고
**When** 배경색을 변경하면
**Then** 옆의 카드 미리보기가 즉시(500ms 이내) 변경된 색상을 반영해야 한다

검증 방법: 색상 변경 시 미리보기 업데이트 타이밍 확인

---

### AC-014: 미리보기 앞면/뒷면 토글 (REQ-PV-002)

**Given** 커스텀 테마 미리보기가 표시된 상태에서
**When** 앞면/뒷면 토글을 클릭하면
**Then** 해당 면의 커스텀 스타일이 적용된 카드가 표시되어야 한다

검증 방법: 토글 동작 확인, 앞면/뒷면 별도 스타일 적용 확인

---

### AC-015: 사용자 ThemeSelector 커스텀 테마 표시 (REQ-US-001)

**Given** 활성 커스텀 테마 2개와 비활성 커스텀 테마 1개가 존재하고
**When** 사용자가 ThemeSelector를 열면
**Then** 빌트인 6개 + 활성 커스텀 2개 = 총 8개 테마가 표시되어야 한다

검증 방법: ThemeSelector에 표시된 테마 수와 목록 확인

---

### AC-016: 커스텀 테마 카드 렌더링 (REQ-US-002)

**Given** classic 기반 커스텀 테마가 frontBgColor=#1E40AF, fontFamily=Pretendard로 설정되어 있고
**When** 사용자가 해당 커스텀 테마를 선택하면
**Then** 카드 앞면이 classic 레이아웃으로 표시되되 배경색이 #1E40AF이고 폰트가 Pretendard로 적용되어야 한다

검증 방법: 커스텀 테마 카드의 inline style 검사

---

### AC-017: 커스텀 테마 카드 제출 저장 (REQ-US-003)

**Given** 사용자가 커스텀 테마 'corporate-blue'로 카드를 생성하고
**When** 카드를 제출하면
**Then** card_requests.theme 값이 'corporate-blue'로 저장되어야 한다

검증 방법: DB 레코드의 theme 컬럼 값 확인

---

### AC-018: GET /api/admin/custom-themes (REQ-API-001)

**Given** custom_themes 테이블에 3개의 테마가 존재하고
**When** 관리자 인증으로 GET /api/admin/custom-themes를 호출하면
**Then** 3개의 커스텀 테마 전체 정보가 반환되어야 한다

검증 방법: API 응답 body 확인

---

### AC-019: POST /api/admin/custom-themes (REQ-API-002)

**Given** 유효한 커스텀 테마 데이터가 준비되고
**When** 관리자 인증으로 POST /api/admin/custom-themes를 호출하면
**Then** 201 응답과 함께 생성된 테마 데이터가 반환되어야 한다

검증 방법: API 응답 코드 + body 확인, DB 레코드 확인

---

### AC-020: PATCH /api/admin/custom-themes/[id] (REQ-API-003)

**Given** 기존 커스텀 테마 ID가 존재하고
**When** 관리자 인증으로 PATCH 요청에 { name: '새 이름' }을 보내면
**Then** 200 응답과 함께 업데이트된 테마 데이터가 반환되어야 한다

검증 방법: API 응답 + DB 값 변경 확인

---

### AC-021: DELETE /api/admin/custom-themes/[id] (REQ-API-004)

**Given** 사용 중이지 않은 커스텀 테마 ID가 존재하고
**When** 관리자 인증으로 DELETE 요청을 보내면
**Then** 200 응답과 `{ deleted: true }`가 반환되고 DB에서 삭제되어야 한다

검증 방법: API 응답 + DB 레코드 부재 확인

---

### AC-022: GET /api/themes 공개 API (REQ-API-005)

**Given** 빌트인 6개 + 활성 커스텀 2개 + 비활성 커스텀 1개가 존재하고
**When** 인증 없이 GET /api/themes를 호출하면
**Then** builtin 배열에 6개, custom 배열에 활성 2개가 반환되어야 한다

검증 방법: API 응답 body의 builtin/custom 배열 크기 확인

---

### AC-023: ThemeSelector 로딩 상태 (REQ-S-001)

**Given** 커스텀 테마 API가 느리게 응답하는 상황에서
**When** ThemeSelector가 렌더링되면
**Then** 빌트인 테마 6개가 즉시 표시되고, 커스텀 테마 영역에 로딩 스켈레톤이 표시되어야 한다

검증 방법: 네트워크 지연 시뮬레이션 후 UI 확인

---

### AC-024: 삭제된 커스텀 테마 fallback (REQ-S-002)

**Given** card_requests.theme='deleted-theme' 레코드가 존재하고 해당 slug의 custom_themes가 삭제된 상태에서
**When** 해당 카드를 렌더링하면
**Then** classic 테마로 fallback 렌더링되어야 한다

검증 방법: 삭제된 테마 slug를 가진 카드의 렌더링 결과 확인

---

### AC-025: 비활성 커스텀 테마 필터링 (REQ-S-003)

**Given** 커스텀 테마 'test-theme'의 is_active가 false인 상태에서
**When** 사용자 ThemeSelector에서 테마를 표시하면
**Then** 'test-theme'이 목록에 나타나지 않아야 한다

**And When** 관리자 패널에서 테마를 표시하면
**Then** 'test-theme'이 비활성 상태로 표시되어야 한다

검증 방법: 사용자/관리자 각각의 테마 목록 확인

---

### AC-026: API 실패 graceful degradation (REQ-S-004)

**Given** GET /api/themes API가 500 에러를 반환하는 상황에서
**When** ThemeSelector가 렌더링되면
**Then** 빌트인 테마 6개만 정상적으로 표시되고 에러 메시지 없이 동작해야 한다

검증 방법: API 에러 시뮬레이션 후 ThemeSelector 동작 확인

---

### AC-027: 빌트인 테마 무변경 검증 (REQ-N-001)

**Given** 커스텀 테마 기능이 추가된 코드베이스에서
**When** TypeScript 빌드를 실행하면
**Then** 기존 빌트인 테마 관련 파일에서 타입 에러가 0건이어야 한다

검증 방법: `npx tsc --noEmit` 실행 결과 확인

---

### AC-028: slug 빌트인 충돌 방지 (REQ-N-002)

**Given** 관리자가 커스텀 테마 slug로 'pokemon'을 입력하고
**When** 생성 폼을 제출하면
**Then** 400 에러와 함께 "빌트인 테마 이름과 중복됩니다" 메시지가 반환되어야 한다

검증 방법: POST API에 빌트인 slug 전달 후 400 응답 확인

---

### AC-029: 관리자 인증 강제 (REQ-N-003)

**Given** 인증되지 않은 요청이
**When** POST /api/admin/custom-themes를 호출하면
**Then** 401 에러가 반환되어야 한다

검증 방법: 인증 토큰 없이 API 호출 후 401 응답 확인

---

### AC-030: inline style 전용 렌더링 (REQ-N-004)

**Given** 커스텀 테마 카드가 렌더링된 상태에서
**When** CustomThemeCardFront의 DOM을 검사하면
**Then** 색상, 폰트, 테두리 등 모든 시각적 속성이 style 속성에 직접 적용되어야 하며, Tailwind 클래스에 의존하지 않아야 한다

검증 방법: DOM 검사, Tailwind 색상/폰트 클래스 부재 확인

---

### AC-031: 테마 복제 기능 (REQ-O-001, Optional)

**Given** 커스텀 테마 'corporate-blue'가 존재하고
**When** 관리자가 "복제" 버튼을 클릭하면
**Then** 동일한 설정값이 채워진 새 테마 생성 폼이 표시되되 slug는 비어있어야 한다

---

### AC-032: 배경 이미지 업로드 (REQ-O-002, Optional)

**Given** 관리자가 커스텀 테마에 배경 이미지를 업로드하고
**When** 해당 테마가 적용된 카드를 렌더링하면
**Then** 배경 이미지가 카드 배경에 표시되어야 한다

---

### AC-033: 테마 순서 변경 (REQ-O-003, Optional)

**Given** 커스텀 테마 A(sortOrder=0), B(sortOrder=1)가 존재하고
**When** 관리자가 B를 A 위로 드래그하면
**Then** B(sortOrder=0), A(sortOrder=1)로 순서가 변경되어야 한다

---

## Quality Gate 기준

| 항목 | 기준 |
| --- | --- |
| TypeScript 빌드 | 에러 0건 |
| 빌트인 테마 회귀 | 6개 테마 모두 기존과 동일한 렌더링 |
| PNG 내보내기 | 커스텀 테마 카드 PNG 내보내기 성공 |
| API 응답 | 모든 CRUD 엔드포인트 정상 응답 |
| 접근성 | 모든 인터랙티브 요소 키보드 접근 가능, ARIA 속성 적용 |
| 디자인 시스템 | 관리자 UI가 프로젝트 디자인 시스템 준수 |
| 보안 | 관리자 API에 인증 미들웨어 적용, 비인증 요청 차단 |

## Definition of Done

- [ ] 모든 Primary Goal 마일스톤(Phase 1~3) 완료
- [ ] AC-001 ~ AC-030 전체 PASS
- [ ] TypeScript 빌드 에러 0건
- [ ] 기존 빌트인 6개 테마 회귀 테스트 통과
- [ ] 커스텀 테마 카드 PNG 내보내기 성공
- [ ] 관리자 CRUD 전체 동작 확인
- [ ] ThemeSelector에 빌트인 + 커스텀 테마 통합 표시
- [ ] 삭제된/비활성 테마 fallback 동작 확인
- [ ] 코드 리뷰 완료
