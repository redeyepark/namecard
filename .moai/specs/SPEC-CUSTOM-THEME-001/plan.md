---
id: SPEC-CUSTOM-THEME-001
type: plan
version: "1.0.0"
status: planned
created: "2026-02-27"
updated: "2026-02-27"
---

# SPEC-CUSTOM-THEME-001: 구현 계획

## 마일스톤 개요

| 단계 | 이름 | 우선순위 | 범위 |
| --- | --- | --- | --- |
| Phase 1 | 기반 인프라 | Primary Goal | DB 스키마, 타입 시스템, 기본 훅 |
| Phase 2 | API + 렌더링 엔진 | Primary Goal | CRUD API, 커스텀 카드 렌더러, 공개 API |
| Phase 3 | 관리자 UI + 사용자 통합 | Primary Goal | 관리자 폼, ThemeSelector 확장, 에디터 통합 |
| Phase 4 | 선택적 기능 | Optional Goal | 테마 복제, 배경 이미지, 순서 변경 |

---

## Phase 1: 기반 인프라 (Primary Goal)

### 목표
데이터베이스 스키마, TypeScript 타입 시스템, 커스텀 테마 데이터 조회 기본 인프라를 구축한다.

### 작업 목록

**P1-1: DB 마이그레이션 생성**
- `supabase/migrations/007_add_custom_themes.sql` 작성
- `custom_themes` 테이블 생성 (slug, name, base_template, colors, font, border, custom_fields 등)
- `card_requests.custom_theme_meta` JSONB 컬럼 추가
- 인덱스 및 RLS 정책 설정
- 연결 요구사항: REQ-U-004

**P1-2: TypeScript 타입 확장**
- `src/types/card.ts`에 `BuiltinTheme` 타입, `BUILTIN_THEMES` 상수, `isBuiltinTheme()` 가드 추가
- `CardTheme` 타입을 `BuiltinTheme | (string & {})` 으로 확장
- `CardData` 인터페이스에 `customThemeMeta` 필드 추가
- 기존 코드 타입 호환성 확인 (빌드 테스트)
- 연결 요구사항: REQ-U-001, REQ-N-001

**P1-3: CustomTheme 인터페이스 정의**
- `src/types/custom-theme.ts` 신규 생성
- `CustomTheme`, `CustomThemeFieldDef`, `CustomThemeMeta` 인터페이스 정의
- 연결 요구사항: REQ-U-004

**P1-4: useCustomThemes 훅 구현**
- `src/hooks/useCustomThemes.ts` 신규 생성
- `GET /api/themes` 호출 + 상태 관리 (loading, error, data)
- 브라우저 메모리 캐싱 (stale-while-revalidate 패턴)
- API 실패 시 빈 배열 반환 (graceful degradation)
- 연결 요구사항: REQ-S-001, REQ-S-004

**P1-5: Zustand Store 확장**
- `useCardStore.ts`에 `setCustomThemeMeta`, `removeCustomThemeMeta` 액션 추가
- `setTheme` 로직 확장: 커스텀 테마 전환 시 `customThemeMeta` 초기화
- 연결 요구사항: REQ-US-003

### 검증 기준
- TypeScript 빌드 성공 (기존 코드 타입 에러 0건)
- `isBuiltinTheme()` 가드가 모든 빌트인 테마에 대해 `true` 반환
- DB 마이그레이션 성공 적용

---

## Phase 2: API + 렌더링 엔진 (Primary Goal)

### 목표
커스텀 테마 CRUD API와 카드 렌더링 엔진을 구현한다.

### 작업 목록

**P2-1: 공개 테마 API 구현**
- `src/app/api/themes/route.ts` 신규 생성
- `GET /api/themes`: 빌트인 테마 메타 + 활성 커스텀 테마 목록 반환
- 인증 불필요 (공개 API)
- 연결 요구사항: REQ-API-005

**P2-2: 관리자 커스텀 테마 CRUD API 구현**
- `src/app/api/admin/custom-themes/route.ts`: GET (목록), POST (생성)
- `src/app/api/admin/custom-themes/[id]/route.ts`: PATCH (수정), DELETE (삭제)
- 관리자 인증 (requireAdminToken) 적용
- slug 유니크 검증, 빌트인 테마명 충돌 방지
- DELETE 시 사용 중인 의뢰 건수 확인 후 차단
- 입력값 검증 (색상 형식, slug 형식, 숫자 범위 등)
- 연결 요구사항: REQ-API-001 ~ REQ-API-004, REQ-AC-002, REQ-AC-005 ~ REQ-AC-007, REQ-N-002, REQ-N-003

**P2-3: 커스텀 테마 카드 렌더러 구현**
- `src/components/card/CustomThemeCardFront.tsx` 신규 생성
- `src/components/card/CustomThemeCardBack.tsx` 신규 생성
- `baseTemplate`에 따라 classic 또는 nametag 레이아웃 구조 재사용
- 모든 색상, 폰트, 테두리를 inline style로 적용 (html-to-image 호환)
- 커스텀 메타데이터 필드 값 표시 지원
- 테마 정의를 찾을 수 없을 때 classic fallback
- 연결 요구사항: REQ-U-003, REQ-US-002, REQ-S-002, REQ-N-004

**P2-4: CardFront/CardBack 라우팅 수정**
- `CardFront.tsx`, `CardBack.tsx`에 커스텀 테마 분기 추가
- `isBuiltinTheme()` 체크 후 커스텀 테마면 `CustomThemeCardFront/Back`으로 라우팅
- 기존 빌트인 테마 분기 로직 변경 없음
- 연결 요구사항: REQ-U-001, REQ-N-001

**P2-5: 기존 admin themes API 확장**
- `src/app/api/admin/themes/route.ts`의 `VALID_THEMES` 배열을 동적으로 확장
- custom_themes 테이블에서 활성 slug 목록 조회 후 VALID_THEMES에 추가
- 일괄 적용(PATCH) 시 커스텀 테마도 대상으로 지원
- 연결 요구사항: REQ-U-002

### 검증 기준
- 모든 CRUD API 정상 동작 (200/201/400/409 응답)
- slug 중복 및 빌트인 충돌 시 400 에러 반환
- 사용 중인 테마 삭제 시 409 에러 반환
- CustomThemeCardFront/Back이 inline style로만 렌더링
- 기존 빌트인 테마 렌더링 무변경 (회귀 없음)
- PNG 내보내기 테스트 통과

---

## Phase 3: 관리자 UI + 사용자 통합 (Primary Goal)

### 목표
관리자 커스텀 테마 관리 UI와 사용자 테마 선택기 통합을 완성한다.

### 작업 목록

**P3-1: CustomThemeForm 컴포넌트 구현**
- `src/components/admin/CustomThemeForm.tsx` 신규 생성
- 2컬럼 레이아웃: 좌측 속성 입력, 우측 실시간 미리보기
- 색상 피커 (react-colorful 재사용)
- 폰트 선택 드롭다운 (6개 프리셋 웹 폰트)
- 기본 레이아웃 템플릿 선택 (classic / nametag)
- 테두리 스타일/두께 설정
- 커스텀 메타데이터 필드 동적 추가/삭제/편집
- 생성 모드 / 편집 모드 통합
- 연결 요구사항: REQ-AC-001, REQ-AC-003

**P3-2: CustomThemePreview 컴포넌트 구현**
- `src/components/admin/CustomThemePreview.tsx` 신규 생성
- CustomThemeCardFront/Back를 래핑하여 관리자 미리보기 제공
- 앞면/뒷면 토글
- 입력값 변경 시 즉시 반영 (로컬 상태 바인딩)
- 연결 요구사항: REQ-PV-001, REQ-PV-002

**P3-3: CustomThemeManager 컴포넌트 구현**
- `src/components/admin/CustomThemeManager.tsx` 신규 생성
- 커스텀 테마 카드 목록 (이름, 축소 미리보기, 의뢰 수, 활성/비활성)
- "새 커스텀 테마 만들기" 버튼
- 각 테마: 편집/삭제 버튼
- 삭제 확인 다이얼로그 + 사용 중 차단 메시지
- 연결 요구사항: REQ-AC-005 ~ REQ-AC-007

**P3-4: 관리자 테마 페이지 통합**
- `src/app/admin/themes/page.tsx` 수정
- 기존 섹션 하단에 "커스텀 테마 관리" 섹션 추가
- CustomThemeManager 컴포넌트 배치
- 연결 요구사항: REQ-AC-001

**P3-5: ThemeSelector 동적 확장**
- `src/components/editor/ThemeSelector.tsx` 수정
- `useCustomThemes` 훅으로 커스텀 테마 목록 가져오기
- 빌트인 테마 섹션 + 커스텀 테마 섹션 분리 표시
- 커스텀 테마 로딩 중 스켈레톤 표시
- API 실패 시 빌트인 테마만 표시
- 연결 요구사항: REQ-US-001, REQ-S-001, REQ-S-003, REQ-S-004

**P3-6: CustomThemeFieldsEditor 구현**
- `src/components/editor/CustomThemeFieldsEditor.tsx` 신규 생성
- 사용자 에디터에서 커스텀 테마 선택 시 해당 테마의 custom_fields에 따라 입력 필드 동적 생성
- text 타입: 텍스트 입력, number 타입: min/max 범위 제한 숫자 입력
- 값 변경 시 useCardStore의 customThemeMeta 업데이트
- 연결 요구사항: REQ-US-002

**P3-7: ThemeListBox 확장**
- `src/components/admin/ThemeListBox.tsx` 수정
- `THEME_LIST`에 커스텀 테마를 동적으로 추가
- 빌트인 테마 구분선 + 커스텀 테마 목록 아래 추가
- 연결 요구사항: REQ-U-002

**P3-8: GalleryCardThumbnail 확장**
- `src/components/gallery/GalleryCardThumbnail.tsx` 수정
- `themeConfig` Record에 커스텀 테마 동적 추가
- 알 수 없는 테마 slug인 경우 classic config를 fallback으로 사용
- 연결 요구사항: REQ-S-002

### 검증 기준
- 관리자가 커스텀 테마 생성/편집/삭제 가능
- 실시간 미리보기가 속성 변경을 즉시 반영
- ThemeSelector에 빌트인 + 커스텀 테마 표시
- 커스텀 테마 선택 시 카드 미리보기 정상 표시
- 삭제 차단 시 에러 메시지 표시
- 비활성 커스텀 테마가 사용자 ThemeSelector에 미표시

---

## Phase 4: 선택적 기능 (Optional Goal)

### 작업 목록

**P4-1: 테마 복제 기능**
- 기존 빌트인/커스텀 테마를 기반으로 새 커스텀 테마를 복제 생성
- CustomThemeForm에 "복제" 시작점 추가
- 연결 요구사항: REQ-O-001

**P4-2: 배경 이미지/패턴 업로드**
- Supabase Storage에 테마 배경 이미지 업로드
- CustomThemeCardFront/Back에서 배경 이미지 적용
- 연결 요구사항: REQ-O-002

**P4-3: 테마 순서 변경**
- custom_themes.sort_order 기반 순서 관리
- 관리자 드래그 앤 드롭 또는 up/down 버튼 UI
- 연결 요구사항: REQ-O-003

---

## 기술 접근 방식

### 아키텍처 설계 방향

1. **빌트인/커스텀 분리 전략**: 기존 빌트인 테마의 전용 컴포넌트(PokemonCardFront 등)는 건드리지 않음. 커스텀 테마는 별도의 범용 렌더러(`CustomThemeCardFront/Back`)를 통해 처리.

2. **데이터 기반 렌더링**: 커스텀 테마의 시각적 속성은 모두 DB에 저장된 데이터에서 읽어와 inline style로 적용. 코드 변경 없이 관리자가 새 테마를 추가 가능.

3. **점진적 향상(Progressive Enhancement)**: 커스텀 테마 API 실패 시 빌트인 테마만으로 정상 동작. 사용자 경험 중단 없음.

4. **타입 안전성 유지**: `BuiltinTheme` 리터럴 유니온을 별도 유지하여 기존 코드의 타입 자동완성 보존. `CardTheme`는 `string`으로 확장하되 `isBuiltinTheme()` 가드로 안전 분기.

### 의존성

- Phase 1이 Phase 2, 3의 전제조건
- Phase 2의 API가 Phase 3 UI의 전제조건
- Phase 4는 독립적으로 진행 가능 (Phase 3 완료 후)

### 리스크 대응

| 리스크 | 대응 |
| --- | --- |
| html-to-image 호환성 | Phase 2에서 즉시 PNG 내보내기 테스트 수행. 실패 시 스타일 적용 방식 조정 |
| CardTheme 타입 변경 영향 | Phase 1에서 빌드 테스트로 즉시 확인. 타입 에러 발생 시 `isBuiltinTheme` 가드로 해결 |
| API 지연 | useCustomThemes에 캐싱 적용, 빌트인 테마 먼저 표시 |
