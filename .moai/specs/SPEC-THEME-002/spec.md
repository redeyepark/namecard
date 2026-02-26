---
id: SPEC-THEME-002
version: "1.0.0"
status: completed
created: "2026-02-26"
updated: "2026-02-26"
author: MoAI
priority: high
---

## HISTORY

| 버전  | 날짜       | 작성자 | 변경 내용               |
| ----- | ---------- | ------ | ----------------------- |
| 1.0.0 | 2026-02-26 | MoAI   | 초기 SPEC 문서 작성     |

---

# SPEC-THEME-002: 테마 미리보기 리스트 박스 UI 개선

## 요약

관리자 테마 관리 페이지(`/admin/themes`)의 테마 미리보기 섹션을 현재 5열 그리드 갤러리 레이아웃에서 리스트 박스 + 대형 미리보기 패턴으로 전환한다. 왼쪽 사이드바에 5개 테마 목록을 배치하고, 오른쪽에 선택된 테마 하나의 대형 미리보기와 변형/메타데이터 편집 패널을 제공하여, 관리자가 각 테마를 한 가지씩 집중적으로 확인하고 수정할 수 있도록 한다. 기존 테마 일괄 적용(Section C) 기능은 하단에 그대로 유지한다.

## 배경 (Environment)

- **프로젝트**: Namecard Editor - Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4 기반 클라이언트 사이드 SPA
- **배포 환경**: Cloudflare Workers
- **현재 상태**: 관리자 테마 관리 페이지 구현 완료 (5열 그리드 미리보기, 테마 통계, 일괄 적용)
- **현재 레이아웃**:
  - Section A: 5열 그리드 미리보기 갤러리 (각 테마별 `AdminCardPreview` + variant 선택 버튼)
  - Section B: 테마별 의뢰 현황 통계 (수평 카드 나열)
  - Section C: 테마 일괄 적용 (필터 + 대상 테마 선택 + 메타데이터 옵션 + 적용 버튼)
- **카드 테마 시스템**: 5개 테마 (classic, pokemon, hearthstone, harrypotter, tarot) - SPEC-THEME-001에서 구현 완료
- **AdminCardPreview 컴포넌트**: 모든 5개 테마의 앞면/뒷면 렌더링 지원, 내부 front/back 토글 포함
- **디자인 시스템**: Deep navy (#020912) + off-white (#fcfcfc), Sharp corners (0px border-radius), Figtree (headings) + Anonymous Pro (body), 한국어 UI, 최소 터치 타겟 44px
- **기존 API**: `GET /api/admin/themes` (통계 반환), `PATCH /api/admin/themes` (일괄 적용)
- **기존 SPEC 참조**: SPEC-THEME-001 (카드 테마 시스템 구현)

## 가정 (Assumptions)

- 리스트 박스 + 미리보기 패턴은 기존 5열 그리드를 완전히 대체하며, Section A 전체가 새로운 레이아웃으로 교체된다
- Section B(통계)는 리스트 박스의 각 테마 항목에 배지(badge) 형태로 통합하여 별도 섹션을 제거한다
- Section C(일괄 적용)는 기존 기능 그대로 유지하되, 새로운 레이아웃 하단에 배치한다
- 편집 패널에서의 변형/메타데이터 변경은 로컬 상태(local state)로만 미리보기에 반영하며, API 호출은 수행하지 않는다
- 기존 `AdminCardPreview` 컴포넌트를 재사용하되, 대형 미리보기 영역에서는 더 큰 크기로 렌더링한다
- 모바일 환경에서는 사이드바가 상단 드롭다운 또는 수평 탭으로 변환된다
- 각 테마의 variant 타입 데이터(`POKEMON_TYPES`, `HEARTHSTONE_CLASSES`, `HARRYPOTTER_HOUSES`, `TAROT_ARCANAS`)는 기존 정의를 재사용한다

---

## 요구사항 (Requirements)

### Ubiquitous (보편적 요구사항)

**REQ-U-001**: 시스템은 **항상** 5개의 테마(classic, pokemon, hearthstone, harrypotter, tarot) 모두를 리스트 박스에서 선택 가능하도록 표시해야 한다.

**REQ-U-002**: 시스템은 **항상** 한 번에 하나의 테마만 미리보기 영역에 표시해야 한다.

**REQ-U-003**: 시스템은 **항상** 프로젝트 디자인 시스템(Deep navy #020912, off-white #fcfcfc, Sharp corners 0px, 최소 터치 타겟 44px)을 준수해야 한다.

### Event-Driven (이벤트 기반 요구사항)

#### 테마 레이아웃 (REQ-TL)

**REQ-TL-001**: **WHEN** 관리자가 테마 관리 페이지에 접근할 때 **THEN** 좌측에 테마 리스트 박스(사이드바), 우측에 대형 미리보기 영역이 2컬럼 레이아웃으로 표시되어야 한다.

**REQ-TL-002**: **WHEN** 데스크톱(1024px 이상) 화면에서 표시될 때 **THEN** 좌측 리스트 박스는 약 280px 고정 너비, 우측 미리보기 영역은 나머지 공간을 차지해야 한다.

**REQ-TL-003**: **WHEN** 모바일(1024px 미만) 화면에서 표시될 때 **THEN** 리스트 박스는 상단 드롭다운 선택기 또는 수평 스크롤 탭바로 변환되고, 미리보기 영역이 아래에 전체 너비로 표시되어야 한다.

#### 테마 리스트 박스 (REQ-LB)

**REQ-LB-001**: **WHEN** 테마 리스트 박스가 렌더링될 때 **THEN** 각 항목에 테마 컬러 인디케이터, 테마 이름(한국어 라벨), 의뢰 건수 배지가 표시되어야 한다.

**REQ-LB-002**: **WHEN** 관리자가 리스트 박스에서 테마 항목을 클릭할 때 **THEN** 해당 항목이 시각적으로 활성 상태(active state)로 강조되고, 미리보기 영역이 해당 테마로 즉시 전환되어야 한다.

**REQ-LB-003**: **WHEN** 페이지가 최초 로드될 때 **THEN** 첫 번째 테마(classic)가 기본 선택 상태로 표시되어야 한다.

#### 미리보기 영역 (REQ-PV)

**REQ-PV-001**: **WHEN** 테마가 선택된 상태에서 미리보기 영역이 표시될 때 **THEN** `AdminCardPreview` 컴포넌트가 대형 크기(카드 높이 400~500px)로 렌더링되어야 한다.

**REQ-PV-002**: **WHEN** 미리보기 영역에서 앞면/뒷면 토글을 클릭할 때 **THEN** 선택된 테마 카드의 앞면과 뒷면이 전환되어야 한다.

**REQ-PV-003**: **WHEN** 편집 패널에서 variant 또는 메타데이터를 변경할 때 **THEN** 미리보기 영역의 카드가 변경 사항을 즉시(실시간) 반영해야 한다.

#### 편집 패널 (REQ-ED)

**REQ-ED-001**: **WHEN** 테마별 variant가 있는 테마(pokemon, hearthstone, harrypotter, tarot)가 선택된 상태 **THEN** 해당 테마의 variant 선택기(타입 그리드, 직업 그리드, 기숙사 선택, 아르카나 선택)가 미리보기 아래에 표시되어야 한다.

**REQ-ED-002**: **WHEN** 테마별 메타데이터가 있는 테마가 선택된 상태 **THEN** 해당 테마의 메타데이터 입력 필드(EXP, Mana, Attack, Health, Year, Spell Power, Card Number, Mystique 등)가 variant 선택기 아래에 표시되어야 한다.

**REQ-ED-003**: **WHEN** classic 테마가 선택된 상태 **THEN** variant 선택기와 메타데이터 편집 필드가 표시되지 않고, 테마 설명과 미리보기만 표시되어야 한다.

**REQ-ED-004**: **WHEN** variant 또는 메타데이터 값을 변경할 때 **THEN** 미리보기의 카드 디자인이 페이지 새로고침 없이 즉시 업데이트되어야 한다.

#### 일괄 적용 통합 (REQ-BA)

**REQ-BA-001**: **WHEN** 관리자가 페이지를 스크롤할 때 **THEN** 기존 테마 일괄 적용 섹션이 리스트 박스 + 미리보기 레이아웃 하단에 독립 섹션으로 존재해야 한다.

**REQ-BA-002**: **WHEN** 관리자가 일괄 적용을 실행할 때 **THEN** 기존과 동일한 `PATCH /api/admin/themes` API를 사용하여 동작해야 한다.

#### 데이터 흐름 (REQ-DF)

**REQ-DF-001**: **WHEN** 미리보기 영역에서 variant/메타데이터를 변경할 때 **THEN** 변경 사항은 로컬 상태(React state)로만 관리되며 API 호출을 발생시키지 않아야 한다.

**REQ-DF-002**: **WHEN** 페이지가 로드될 때 **THEN** 테마별 의뢰 통계가 `GET /api/admin/themes`에서 조회되어 리스트 박스의 배지에 표시되어야 한다.

### State-Driven (상태 기반 요구사항)

**REQ-S-001**: **IF** 테마 통계 데이터가 로딩 중인 상태 **THEN** 리스트 박스의 배지 영역에 로딩 인디케이터(스켈레톤 또는 스피너)가 표시되어야 한다.

**REQ-S-002**: **IF** 특정 테마에 의뢰가 0건인 상태 **THEN** 배지에 "0건"이 표시되어야 한다 (배지 자체를 숨기지 않음).

### Unwanted (금지 요구사항)

**REQ-N-001**: 리스트 박스에서 테마를 전환할 때 편집 중이던 다른 테마의 메타데이터 상태를 삭제**하지 않아야 한다** (각 테마별 상태 독립 관리).

**REQ-N-002**: 미리보기 영역에서의 variant/메타데이터 변경이 실제 카드 데이터나 서버 상태를 변경**하지 않아야 한다**.

### Optional (선택적 요구사항)

**REQ-O-001**: **가능하면** 리스트 박스의 테마 항목에 해당 테마의 축소 미리보기 썸네일(아이콘 또는 소형 카드 이미지)을 포함한다.

**REQ-O-002**: **가능하면** 미리보기 영역에서 카드를 좌우 스와이프하여 앞면/뒷면을 전환할 수 있는 제스처를 지원한다.

---

## 명세 (Specifications)

### 1. 전체 레이아웃 구조

현재 3-섹션 구조(A: 갤러리, B: 통계, C: 일괄 적용)를 2-섹션 구조로 재편한다:

```
+------------------------------------------------------------------+
| 테마 관리 (헤더)                                                   |
+------------------------------------------------------------------+
| Section A (NEW): 리스트 박스 + 미리보기 + 편집 패널                |
| +----------+---------------------------------------------------+  |
| | 리스트    |  대형 미리보기 영역                                |  |
| | 박스      |  (AdminCardPreview, 400-500px 높이)              |  |
| | (280px)   |                                                   |  |
| |           |  [앞면 | 뒷면] 토글                               |  |
| | Classic   +---------------------------------------------------+  |
| | Pokemon   |  편집 패널                                        |  |
| | Hearth..  |  - variant 선택기 (테마에 따라 다름)              |  |
| | Harry P.. |  - 메타데이터 입력 (테마에 따라 다름)             |  |
| | Tarot     |                                                   |  |
| +----------+---------------------------------------------------+  |
+------------------------------------------------------------------+
| Section B (기존 Section C 유지): 테마 일괄 적용                    |
+------------------------------------------------------------------+
```

모바일 레이아웃(1024px 미만):

```
+----------------------------------+
| 테마 관리 (헤더)                  |
+----------------------------------+
| [Classic v] (드롭다운 선택기)     |
+----------------------------------+
| 대형 미리보기 영역               |
| (전체 너비)                      |
+----------------------------------+
| [앞면 | 뒷면] 토글              |
+----------------------------------+
| 편집 패널                        |
+----------------------------------+
| 테마 일괄 적용                   |
+----------------------------------+
```

### 2. 컴포넌트 아키텍처

| 컴포넌트명             | 파일 경로                                      | 유형 | 설명                                                |
| ---------------------- | ---------------------------------------------- | ---- | --------------------------------------------------- |
| `ThemeListBox`         | `src/components/admin/ThemeListBox.tsx`         | 신규 | 좌측 사이드바 테마 목록, 선택/활성 상태 관리         |
| `ThemePreviewPanel`    | `src/components/admin/ThemePreviewPanel.tsx`    | 신규 | 대형 카드 미리보기 영역, AdminCardPreview 래핑       |
| `ThemeEditPanel`       | `src/components/admin/ThemeEditPanel.tsx`       | 신규 | 테마별 variant 선택기 + 메타데이터 편집 통합 패널    |
| `ThemeMobileSelector`  | `src/components/admin/ThemeMobileSelector.tsx`  | 신규 | 모바일용 드롭다운/탭바 테마 선택기                   |
| `ThemesPage`           | `src/app/admin/themes/page.tsx`                 | 수정 | 페이지 레이아웃 재구성, 새 컴포넌트 통합             |
| `AdminCardPreview`     | `src/components/admin/AdminCardPreview.tsx`     | 유지 | 기존 컴포넌트 재사용, 외부에서 크기 제어             |

### 3. 데이터 모델

#### 3.1 테마 설정 정의

```typescript
// Theme configuration for list box display
interface ThemeListItem {
  id: CardTheme;
  name: string;        // Korean display name
  nameEn: string;      // English name
  color: string;       // Theme indicator color
  description: string; // Short Korean description
}

const THEME_LIST: ThemeListItem[] = [
  { id: 'classic', name: '클래식', nameEn: 'Classic', color: '#020912', description: '기본 클래식 명함 디자인' },
  { id: 'pokemon', name: '포켓몬', nameEn: 'Pokemon', color: '#EED171', description: '포켓몬 트레이딩 카드 스타일' },
  { id: 'hearthstone', name: '하스스톤', nameEn: 'Hearthstone', color: '#8B6914', description: '하스스톤 카드 스타일' },
  { id: 'harrypotter', name: '해리포터', nameEn: 'Harry Potter', color: '#740001', description: '해리포터 마법사 카드 스타일' },
  { id: 'tarot', name: '타로', nameEn: 'Tarot', color: '#4A0E4E', description: '타로 카드 스타일' },
];
```

#### 3.2 편집 패널 로컬 상태

```typescript
// Per-theme local editing state
interface ThemeEditState {
  pokemon: { type: PokemonType; exp: number };
  hearthstone: { classType: HearthstoneClass; mana: number; attack: number; health: number };
  harrypotter: { house: HarrypotterHouse; year: number; spellPower: number };
  tarot: { arcana: TarotArcana; cardNumber: number; mystique: number };
}
```

각 테마의 편집 상태는 독립적으로 관리되어, 테마 전환 시 이전 편집 상태가 보존된다.

### 4. ThemeListBox 컴포넌트 상세

- 세로 리스트 형태, 280px 고정 너비
- 각 항목 구성:
  - 8px 원형 또는 사각형 컬러 인디케이터 (테마 대표 색상)
  - 테마 이름 (한국어, 예: "클래식")
  - 의뢰 건수 배지 (예: "12건")
- 활성 항목: `bg-[#020912] text-white` 스타일, 비활성: `bg-white text-[#020912] hover:bg-gray-50`
- 항목 높이: 최소 56px (44px 터치 타겟 + 패딩)
- 접근성: `role="listbox"`, 각 항목에 `role="option"`, `aria-selected` 속성

### 5. ThemePreviewPanel 컴포넌트 상세

- `AdminCardPreview`를 감싸되, `max-w-xs` 제약을 `max-w-md` 또는 `max-w-lg`로 확장하여 400~500px 카드 높이를 달성
- 앞면/뒷면 토글은 기존 `AdminCardPreview` 내장 토글을 활용
- 선택된 테마와 현재 variant/메타데이터에 기반한 `CardData` 객체를 생성하여 prop으로 전달
- 테마 이름 + 설명을 미리보기 상단에 표시

### 6. ThemeEditPanel 컴포넌트 상세

- 테마별 조건부 렌더링:
  - **classic**: "변형 옵션 없음" 메시지, 테마 설명만 표시
  - **pokemon**: 7가지 타입 칩 그리드 + EXP 숫자 입력(0-999)
  - **hearthstone**: 9가지 직업 칩 그리드 + Mana(0-10), Attack(0-12), Health(1-12) 입력
  - **harrypotter**: 4가지 기숙사 선택 + Year(1-7), Spell Power(0-999) 입력
  - **tarot**: 5가지 아르카나 선택 + Card Number(0-21), Mystique(0-999) 입력
- variant 선택기 스타일: 기존 themes page의 칩 버튼 스타일 재사용
- 메타데이터 입력 스타일: 기존 themes page의 number input 스타일 재사용
- 모든 변경은 `onChange` 콜백으로 부모 컴포넌트에 전달

### 7. 반응형 처리

- **데스크톱 (>= 1024px)**: 2컬럼 레이아웃 (사이드바 + 메인)
- **태블릿 (768px ~ 1023px)**: 사이드바 축소(200px) + 메인
- **모바일 (< 768px)**: 사이드바를 드롭다운 select로 변환, 단일 컬럼

### 8. 기존 Section C(일괄 적용) 통합

- Section C의 코드는 거의 그대로 유지
- 위치만 새로운 리스트 박스 + 미리보기 섹션 아래로 이동
- 기존 Section B(통계 카드)는 리스트 박스 배지로 통합하여 삭제

---

## 영향 분석 (File Impact Analysis)

| 파일 경로                                           | 변경 유형 | 설명                                              |
| --------------------------------------------------- | --------- | ------------------------------------------------- |
| `src/app/admin/themes/page.tsx`                     | 수정      | 페이지 레이아웃 재구성, 새 컴포넌트 통합, Section A/B 대체 |
| `src/components/admin/ThemeListBox.tsx`              | 신규      | 좌측 사이드바 테마 목록 컴포넌트                    |
| `src/components/admin/ThemePreviewPanel.tsx`         | 신규      | 대형 카드 미리보기 영역 컴포넌트                    |
| `src/components/admin/ThemeEditPanel.tsx`            | 신규      | 테마별 variant/메타데이터 편집 통합 패널             |
| `src/components/admin/ThemeMobileSelector.tsx`       | 신규      | 모바일용 테마 드롭다운 선택기                       |
| `src/components/admin/AdminCardPreview.tsx`          | 유지      | 변경 없음, 기존 컴포넌트 재사용                     |

---

## 트레이서빌리티 (Traceability)

| 요구사항   | plan.md 연결                       | acceptance.md 연결 |
| ---------- | ---------------------------------- | ------------------ |
| REQ-U-001  | Phase 1: ThemeListBox 구현          | AC-001             |
| REQ-U-002  | Phase 2: ThemePreviewPanel 구현     | AC-002             |
| REQ-U-003  | 전체: 디자인 시스템 준수            | AC-003             |
| REQ-TL-001 | Phase 4: 페이지 레이아웃 재구성     | AC-004             |
| REQ-TL-002 | Phase 4: 데스크톱 레이아웃          | AC-005             |
| REQ-TL-003 | Phase 5: 모바일 반응형              | AC-006             |
| REQ-LB-001 | Phase 1: ThemeListBox 항목 구성     | AC-007             |
| REQ-LB-002 | Phase 1: 선택/활성 상태 관리        | AC-008             |
| REQ-LB-003 | Phase 1: 기본 선택 상태             | AC-009             |
| REQ-PV-001 | Phase 2: 대형 미리보기 렌더링       | AC-010             |
| REQ-PV-002 | Phase 2: 앞면/뒷면 토글            | AC-011             |
| REQ-PV-003 | Phase 3: 실시간 미리보기 업데이트   | AC-012             |
| REQ-ED-001 | Phase 3: variant 선택기 구현        | AC-013             |
| REQ-ED-002 | Phase 3: 메타데이터 입력 구현       | AC-014             |
| REQ-ED-003 | Phase 3: classic 테마 처리          | AC-015             |
| REQ-ED-004 | Phase 3: 실시간 업데이트 연동       | AC-016             |
| REQ-BA-001 | Phase 4: 일괄 적용 섹션 배치        | AC-017             |
| REQ-BA-002 | Phase 4: API 동작 유지              | AC-018             |
| REQ-DF-001 | Phase 3: 로컬 상태 관리             | AC-019             |
| REQ-DF-002 | Phase 1: 통계 데이터 연동           | AC-020             |
| REQ-S-001  | Phase 1: 로딩 상태 표시             | AC-021             |
| REQ-S-002  | Phase 1: 0건 표시                   | AC-022             |
| REQ-N-001  | Phase 3: 테마별 상태 독립 관리      | AC-023             |
| REQ-N-002  | Phase 3: 서버 상태 미변경           | AC-024             |
| REQ-O-001  | Phase 5: 썸네일 표시                | AC-025             |
| REQ-O-002  | Phase 5: 스와이프 제스처            | AC-026             |
