---
id: SPEC-THEME-002
type: plan
version: "1.0.0"
created: "2026-02-26"
updated: "2026-02-26"
---

# SPEC-THEME-002: 구현 계획

## 구현 전략

기존 테마 관리 페이지(`/admin/themes`)의 Section A(5열 그리드 갤러리)와 Section B(통계 카드)를 리스트 박스 + 대형 미리보기 + 편집 패널 패턴으로 재구성한다. 새 컴포넌트를 개별적으로 구현한 후 페이지 레이아웃을 통합하는 방식으로 진행하여, 기존 Section C(일괄 적용)의 동작을 100% 보존한다.

---

## Phase 1: ThemeListBox 컴포넌트 구현 (Primary Goal)

**목표**: 좌측 사이드바 테마 목록 컴포넌트 구현 및 통계 데이터 연동

**작업 내용**:
1. `src/components/admin/ThemeListBox.tsx` 신규 생성
   - 5개 테마 항목 세로 리스트 렌더링
   - 각 항목: 컬러 인디케이터(8px) + 한국어 테마명 + 의뢰 건수 배지
   - 선택 상태(active): `bg-[#020912] text-white`, 비선택: `bg-white hover:bg-gray-50`
   - 항목 높이 최소 56px, 터치 타겟 44px 준수
2. `THEME_LIST` 상수 정의 (테마별 id, name, nameEn, color, description)
3. 통계 데이터 prop 연동
   - `ThemeStats[]` 배열을 prop으로 수신
   - 각 테마 항목에 해당 건수 배지 표시
   - 로딩 중일 때 스켈레톤/스피너 표시
   - 0건일 때도 "0건" 표시 (배지 숨김 방지)
4. 접근성 속성 적용
   - 컨테이너: `role="listbox"`, `aria-label="테마 목록"`
   - 각 항목: `role="option"`, `aria-selected`
5. 콜백 prop: `onSelect: (theme: CardTheme) => void`
6. 기본 선택: `defaultSelected='classic'`

**관련 요구사항**: REQ-U-001, REQ-LB-001, REQ-LB-002, REQ-LB-003, REQ-DF-002, REQ-S-001, REQ-S-002

---

## Phase 2: ThemePreviewPanel 컴포넌트 구현 (Primary Goal)

**목표**: 대형 카드 미리보기 영역 구현

**작업 내용**:
1. `src/components/admin/ThemePreviewPanel.tsx` 신규 생성
   - `AdminCardPreview` 래핑, 크기 확장 (max-w-md 또는 max-w-lg)
   - 카드 높이 목표: 400~500px (aspect-ratio 29:45 기준으로 너비 258~323px)
   - 앞면/뒷면 토글은 기존 `AdminCardPreview` 내장 토글 활용
2. 테마 정보 헤더 표시
   - 선택된 테마 이름(한국어) + 영문명
   - 테마 설명 텍스트
3. CardData 생성 로직
   - 선택된 테마 + variant + 메타데이터를 기반으로 샘플 `CardData` 객체 생성
   - 기존 `sampleClassicCard`, `createSamplePokemonCard` 등의 함수 재사용/리팩토링
4. Props 인터페이스:
   - `selectedTheme: CardTheme`
   - `cardData: CardData`

**관련 요구사항**: REQ-U-002, REQ-PV-001, REQ-PV-002

---

## Phase 3: ThemeEditPanel 컴포넌트 구현 (Secondary Goal)

**목표**: 테마별 variant 선택기 및 메타데이터 편집 통합 패널 구현

**작업 내용**:
1. `src/components/admin/ThemeEditPanel.tsx` 신규 생성
2. 테마별 조건부 렌더링:
   - **classic**: "이 테마는 변형 옵션이 없습니다." 메시지 + 테마 설명
   - **pokemon**: 타입 칩 그리드(7종) + EXP 입력(0-999)
   - **hearthstone**: 직업 칩 그리드(9종) + Mana(0-10), Attack(0-12), Health(1-12) 입력
   - **harrypotter**: 기숙사 선택(4종) + Year(1-7), Spell Power(0-999) 입력
   - **tarot**: 아르카나 선택(5종) + Card Number(0-21), Mystique(0-999) 입력
3. 기존 variant 칩 버튼 스타일 재사용
   - `POKEMON_TYPES`, `HEARTHSTONE_CLASSES`, `HARRYPOTTER_HOUSES`, `TAROT_ARCANAS` import
   - SVG 아이콘 + 이름 표시, 선택 상태 강조
4. 메타데이터 입력 필드
   - number input 타입, min/max 범위 제한
   - 기존 themes page의 input 스타일 재사용
5. 테마별 상태 독립 관리
   - `ThemeEditState` 객체로 각 테마의 편집 상태를 별도 관리
   - 테마 전환 시 이전 상태 보존
6. 콜백 prop: `onChange: (cardData: CardData) => void` - 변경 시 부모에게 새로운 CardData 전달
7. 모든 변경은 로컬 상태로만 관리, API 호출 없음

**관련 요구사항**: REQ-ED-001, REQ-ED-002, REQ-ED-003, REQ-ED-004, REQ-PV-003, REQ-DF-001, REQ-N-001, REQ-N-002

---

## Phase 4: 페이지 레이아웃 재구성 (Secondary Goal)

**목표**: themes page에서 새 컴포넌트를 통합하고 레이아웃 재구성

**작업 내용**:
1. `src/app/admin/themes/page.tsx` 수정
   - 기존 Section A (5열 그리드 갤러리) 제거
   - 기존 Section B (통계 카드 나열) 제거 (리스트 박스 배지로 통합)
   - 새로운 Section A: 2컬럼 레이아웃 (ThemeListBox + ThemePreviewPanel + ThemeEditPanel)
   - 기존 Section C (일괄 적용): 하단에 그대로 유지
2. 상태 관리 통합
   - `selectedTheme: CardTheme` 상태 추가
   - `themeEditState: ThemeEditState` 상태 추가
   - 통계 데이터 fetch 로직 유지 (기존 `fetchStats`)
   - 일괄 적용 관련 상태 및 로직 유지
3. 데스크톱 레이아웃: `flex` 기반 2컬럼
   - 좌측: `ThemeListBox` (w-[280px] flex-shrink-0)
   - 우측: `ThemePreviewPanel` + `ThemeEditPanel` (flex-1)
4. 기존 bulk apply Section C 코드를 최소 변경으로 하단에 유지
5. 기존 샘플 카드 생성 함수 리팩토링
   - `createSampleCard(theme, editState)` 통합 함수 생성
   - 기존 개별 함수(`createSamplePokemonCard` 등) 통합

**관련 요구사항**: REQ-TL-001, REQ-TL-002, REQ-BA-001, REQ-BA-002, REQ-U-003

---

## Phase 5: 모바일 반응형 및 폴리싱 (Optional Goal)

**목표**: 모바일 대응 및 선택적 기능 구현

**작업 내용**:
1. `src/components/admin/ThemeMobileSelector.tsx` 신규 생성
   - 768px 미만: `<select>` 드롭다운으로 테마 선택
   - 768px~1023px: 수평 탭바 또는 축소된 사이드바(200px)
2. 반응형 조건부 렌더링
   - Tailwind 미디어 쿼리 클래스로 데스크톱/모바일 전환
   - `hidden lg:block` (사이드바), `block lg:hidden` (드롭다운)
3. (Optional) 리스트 박스 항목에 테마 축소 썸네일 추가
4. (Optional) 미리보기 영역 스와이프 제스처 지원

**관련 요구사항**: REQ-TL-003, REQ-O-001, REQ-O-002

---

## 리스크 및 대응

| 리스크                                          | 영향도 | 대응 방안                                                   |
| ----------------------------------------------- | ------ | ----------------------------------------------------------- |
| AdminCardPreview 크기 확대 시 렌더링 깨짐       | 중간   | max-w 조정 및 aspect-ratio 유지, 테마별 확인 필수            |
| 리스트 박스 + 미리보기 레이아웃 높이 초과        | 낮음   | 미리보기 영역에 max-height 설정 및 스크롤 처리               |
| 테마별 편집 상태 관리 복잡도 증가               | 중간   | ThemeEditState 객체로 일원화, useReducer 또는 useState 활용  |
| 기존 일괄 적용 기능 회귀                        | 높음   | Section C 코드 최소 변경, 기존 상태/로직 보존                |
| 모바일에서 드롭다운과 대형 미리보기 UX 저하      | 낮음   | 미리보기 크기를 모바일에서 축소, 터치 친화적 UI              |

---

## 기술적 접근

- **컴포넌트 분리 패턴**: 리스트 박스, 미리보기, 편집 패널을 독립 컴포넌트로 구현하여 관심사 분리
- **상태 끌어올리기(Lifting State Up)**: `selectedTheme`과 `themeEditState`를 page.tsx에서 관리하고, 하위 컴포넌트에 prop으로 전달
- **기존 코드 재사용**: `AdminCardPreview`, variant 타입 상수, 샘플 카드 생성 함수 등 최대 재사용
- **점진적 교체**: Section A/B를 새 레이아웃으로 교체하되, Section C는 그대로 유지하여 회귀 리스크 최소화
- **Tailwind CSS 반응형**: `lg:` 접두사로 데스크톱/모바일 분기, CSS-only 반응형 처리
