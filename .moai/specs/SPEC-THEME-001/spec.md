---
id: SPEC-THEME-001
version: "2.0.0"
status: completed
created: "2026-02-25"
updated: "2026-02-26"
author: MoAI
priority: high
---

## HISTORY

| 버전  | 날짜       | 작성자 | 변경 내용                          |
| ----- | ---------- | ------ | ---------------------------------- |
| 1.0.0 | 2026-02-25 | MoAI   | 초기 SPEC 문서 작성                |
| 1.1.0 | 2026-02-25 | MoAI   | Pokemon 테마 구현 완료, Hearthstone 테마 추가 구현 |
| 2.0.0 | 2026-02-26 | MoAI   | Harry Potter 테마 및 Tarot 테마 추가 구현 (총 5개 테마) |

---

# SPEC-THEME-001: 카드 테마 시스템 구현 (Pokemon + Hearthstone + Harry Potter + Tarot)

## 요약

기존 기본(클래식) 테마를 유지하면서, 포켓몬 트레이딩 카드에서 영감을 받은 새로운 명함 테마를 추가 옵션으로 제공한다. 사용자는 명함 생성 또는 편집 시 "Classic"과 "Pokemon" 테마 중 하나를 선택할 수 있으며, Pokemon 테마 선택 시 타입별 색상 프레임, HP/EXP 스탯 표시, 타입 아이콘 등 트레이딩 카드 고유의 시각적 요소가 적용된다. 기존 카드 구조는 최소한으로 변경하며, 하위 호환성을 완전히 보장한다.

## 배경 (Environment)

- **프로젝트**: Namecard Editor - Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand 5 기반 클라이언트 사이드 SPA
- **현재 상태**: 기본 명함 편집기 구현 완료 (앞면/뒷면 편집, PNG 내보내기, localStorage 저장, 위자드 플로우 5단계, 관리자 페이지)
- **카드 비율**: 29:45 (세로형, 포켓몬 카드 비율 1:1.4와 유사)
- **현재 데이터 모델**: `CardData { front: CardFrontData, back: CardBackData }` - 테마 필드 없음
- **현재 렌더링**: `CardFront.tsx`, `CardBack.tsx` 단일 디자인 컴포넌트
- **폰트**: Nanum Myeongjo serif
- **상태 관리**: `useCardStore` (Zustand + persist, key: `namecard-storage`)
- **색상 시스템**: 10개 프리셋 배경색, 2개 텍스트 색상
- **기존 SPEC 참조**: SPEC-TPL-001 (템플릿 시스템), SPEC-UI-001 (기본 UI)

## 가정 (Assumptions)

- 테마 시스템은 기존 템플릿 시스템(SPEC-TPL-001)과 독립적으로 동작하며, 템플릿은 색상 조합, 테마는 레이아웃/시각적 스타일을 담당한다
- Pokemon 테마의 디자인은 트레이딩 카드 게임에서 "영감을 받은" 것이며, 포켓몬 상표, 로고, 저작권 이미지를 사용하지 않는다
- 타입 아이콘은 원본 SVG로 자체 디자인하며, 외부 아이콘 라이브러리에 의존하지 않는다
- 기존 `CardData` 인터페이스를 확장하되, `theme` 필드 없는 기존 카드는 자동으로 `'classic'`으로 처리된다
- 테마별 렌더링은 클라이언트 사이드에서만 처리되며, 서버 API 변경이 필요하지 않다
- PNG 내보내기(`html-to-image`)는 테마별 렌더링을 정확히 캡처해야 한다
- 위자드 플로우에 테마 선택 단계를 추가하되, 기존 5단계 구조를 크게 변경하지 않는다
- CSV 일괄 업로드는 기존 방식 그대로 동작하며, 테마 필드가 없는 데이터는 classic으로 기본 처리된다

---

## 요구사항 (Requirements)

### Ubiquitous (보편적 요구사항)

**REQ-U-001**: 시스템은 **항상** 최소 5개의 테마(`classic`, `pokemon`, `hearthstone`, `harrypotter`, `tarot`)를 지원해야 한다.

**REQ-U-002**: 시스템은 **항상** `theme` 필드가 없는 기존 카드 데이터를 `'classic'` 테마로 렌더링해야 한다.

**REQ-U-003**: 시스템은 **항상** Pokemon 테마에서 원본 SVG 타입 아이콘을 사용해야 하며, 포켓몬 상표 또는 저작권 이미지를 사용**하지 않아야 한다**.

### Event-Driven (이벤트 기반 요구사항)

**REQ-E-001**: **WHEN** 사용자가 명함을 생성하거나 편집할 때 **THEN** 시스템은 테마 선택기를 제공해야 한다.

**REQ-E-002**: **WHEN** 사용자가 Pokemon 테마를 선택 **THEN** 카드 앞면에 다음 요소가 표시되어야 한다:
- 선택한 타입에 따른 색상 테두리/프레임 (4px solid border + inner padding)
- 좌상단 네임 플레이트 영역에 사용자 이름
- 우상단에 EXP 또는 LV 스탯 표시
- 스탯 옆에 타입 배지/아이콘
- 중앙 영역에 프레임 처리된 일러스트 윈도우 (카드 높이의 ~35-40%)
- 사진 아래 스타일링된 정보 섹션에 해시태그 표시

**REQ-E-003**: **WHEN** 사용자가 Pokemon 테마를 선택 **THEN** 카드 뒷면에 다음 요소가 표시되어야 한다:
- 그라데이션 배경 (blue-to-purple)
- CSS로 생성된 장식적 소용돌이/나선 패턴 (포켓몬 브랜드 아님)
- 사용자의 풀네임과 직함
- 스타일링된 하단 섹션에 소셜 링크
- 해시태그

**REQ-E-004**: **WHEN** 사용자가 타입을 선택 **THEN** 해당 타입의 색상이 카드 프레임에 즉시 반영되어야 한다.

**REQ-E-005**: **WHEN** 사용자가 테마를 전환 **THEN** 공통 데이터(이름, 직함, 해시태그, 소셜 링크, 사진)는 보존되어야 한다.

**REQ-E-006**: **WHEN** 사용자가 EXP 값(0-999) 또는 Level(1-100)을 설정 **THEN** 카드 우상단 영역에 해당 값이 표시되어야 한다.

### State-Driven (상태 기반 요구사항)

**REQ-S-001**: **IF** 카드 데이터에 `theme` 필드가 없는 상태 **THEN** 시스템은 `'classic'` 테마로 기본 렌더링해야 한다.

**REQ-S-002**: **IF** Pokemon 테마가 선택된 상태 **AND WHEN** 카드를 PNG로 내보내기 **THEN** 타입 프레임, EXP 스탯, 타입 아이콘을 포함한 전체 Pokemon 스타일이 정확하게 렌더링되어야 한다.

**REQ-S-003**: **IF** Pokemon 테마가 선택된 상태 **THEN** 에디터는 테마별 옵션(타입 선택기, EXP 입력)을 표시해야 한다.

### Unwanted (금지 요구사항)

**REQ-N-001**: 시스템은 포켓몬 상표, 로고, 저작권이 있는 이미지를 사용**하지 않아야 한다**.

**REQ-N-002**: 테마 전환 시 사용자가 입력한 콘텐츠 데이터(이름, 사진, 소셜 링크 등)를 삭제**하지 않아야 한다**.

### Optional (선택적 요구사항)

**REQ-O-001**: **가능하면** 향후 추가 테마(예: Minimalist, Cyberpunk) 확장을 위한 범용 테마 인터페이스를 제공한다. *(구현 완료: Hearthstone 테마 추가를 통해 확장성 검증됨)*

---

## 명세 (Specifications)

### 1. 타입 시스템 정의

7개의 타입과 연관 색상을 다음과 같이 정의한다:

| 타입 이름  | ID         | 색상 코드   | 대응 직군              |
| ---------- | ---------- | ----------- | ---------------------- |
| Fire       | `fire`     | `#FF6B35`   | Creative / Design      |
| Water      | `water`    | `#3B82F6`   | Engineering / Backend  |
| Grass      | `grass`    | `#22C55E`   | Growth / DevOps        |
| Electric   | `electric` | `#EAB308`   | Development / Fullstack|
| Psychic    | `psychic`  | `#A855F7`   | Strategy / PM          |
| Steel      | `steel`    | `#6B7280`   | Security / Systems     |
| Normal     | `normal`   | `#9CA3AF`   | General                |

각 타입은 간단한 커스텀 SVG 아이콘을 가진다 (불꽃, 물방울, 잎, 번개, 눈, 기어, 원 등).

### 2. 데이터 모델 확장

#### 2.1 신규 타입 정의

```typescript
// src/types/card.ts (확장)

export type CardTheme = 'classic' | 'pokemon';

export type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'steel' | 'normal';

export interface PokemonMeta {
  type: PokemonType;
  exp: number; // 0-999
}

export interface CardData {
  front: CardFrontData;
  back: CardBackData;
  theme?: CardTheme;          // default: 'classic' (optional for backward compat)
  pokemonMeta?: PokemonMeta;  // optional, only used when theme === 'pokemon'
}
```

#### 2.2 Zustand Store 확장

```typescript
// src/stores/useCardStore.ts (확장)

interface CardStore {
  // ... existing fields
  setTheme: (theme: CardTheme) => void;
  setPokemonType: (type: PokemonType) => void;
  setPokemonExp: (exp: number) => void;
}
```

- `setTheme`: 테마 변경 시 공통 데이터 보존, Pokemon 테마 선택 시 기본 `pokemonMeta` 자동 생성
- `setPokemonType`: 타입 변경
- `setPokemonExp`: EXP 값 변경 (0-999 범위 제한)
- 기본값: `theme: 'classic'`, `pokemonMeta: undefined`

### 3. 컴포넌트 아키텍처

#### 3.1 파일 구조

```
src/
├── types/
│   └── card.ts                              # CardTheme, PokemonType, PokemonMeta 타입 추가
├── stores/
│   └── useCardStore.ts                      # setTheme, setPokemonType, setPokemonExp 액션 추가
├── components/
│   ├── card/
│   │   ├── CardFront.tsx                    # 테마 분기 렌더링 래퍼로 변경
│   │   ├── CardBack.tsx                     # 테마 분기 렌더링 래퍼로 변경
│   │   ├── PokemonCardFront.tsx             # [신규] Pokemon 테마 앞면 컴포넌트
│   │   ├── PokemonCardBack.tsx              # [신규] Pokemon 테마 뒷면 컴포넌트
│   │   └── pokemon-types.ts                 # [신규] 타입 정의, 색상, SVG 아이콘 데이터
│   ├── editor/
│   │   ├── ThemeSelector.tsx                # [신규] 테마 선택 UI (Classic / Pokemon 전환)
│   │   ├── PokemonTypeSelector.tsx          # [신규] 타입 선택기 (7가지 타입 그리드)
│   │   └── ExpInput.tsx                     # [신규] EXP/Level 숫자 입력
│   ├── wizard/
│   │   └── ThemeSelectionStep.tsx           # [신규] 위자드 테마 선택 단계
│   ├── admin/
│   │   └── AdminCardPreview.tsx             # 테마별 렌더링 지원 추가
│   └── dashboard/
│       └── ConfirmedCardPreview.tsx          # 테마별 렌더링 지원 추가
```

#### 3.2 렌더링 전략

기존 `CardFront.tsx`와 `CardBack.tsx`를 테마 분기 래퍼로 변경한다:

```typescript
// CardFront.tsx (수정)
export function CardFront() {
  const theme = useCardStore((state) => state.card.theme ?? 'classic');

  if (theme === 'pokemon') {
    return <PokemonCardFront />;
  }
  return <ClassicCardFront />;  // 기존 렌더링 로직 이동
}
```

기존 `CardFront` 렌더링 로직은 `ClassicCardFront`(내부 컴포넌트)로 추출하여, 기존 동작을 100% 보존한다.

#### 3.3 PokemonCardFront 레이아웃

```
+---------------------------------------+
|  [Name Plate]          [EXP 100] [T]  |  <- 상단 바 (타입 색상 배경)
|---------------------------------------|
|                                       |
|  +-------------------------------+    |
|  |                               |    |
|  |     [프로필 사진 영역]          |    |  <- 중앙 일러스트 윈도우
|  |     카드 높이의 ~35-40%        |    |     (타입 색상 테두리)
|  |                               |    |
|  +-------------------------------+    |
|                                       |
|  #hashtag1 #hashtag2 #hashtag3        |  <- 하단 정보 섹션
|                                       |
+---------------------------------------+
    ^-- 전체 프레임: 4px solid 타입 색상
```

#### 3.4 PokemonCardBack 레이아웃

```
+---------------------------------------+
|                                       |
|  ~~~~ 소용돌이 패턴 (CSS) ~~~~        |  <- 그라데이션 배경 (blue-to-purple)
|                                       |
|         [풀네임]                       |
|         [직함]                         |
|                                       |
|  #hashtag1 #hashtag2                   |
|                                       |
|  ------------------------------------ |
|  instagram/@handle                     |  <- 하단 소셜 링크 섹션
|  linkedin/username                     |
+---------------------------------------+
```

### 4. 에디터 통합

#### 4.1 ThemeSelector 컴포넌트

- 에디터 패널 상단에 배치
- 2개 옵션: Classic (기본 아이콘) / Pokemon (트레이딩 카드 아이콘)
- 선택 시 즉시 미리보기에 반영
- 접근성: `role="radiogroup"`, 키보드 탐색 지원

#### 4.2 Pokemon 테마 전용 에디터 섹션

- `PokemonTypeSelector`: 7가지 타입을 색상 칩 그리드로 표시, 선택 시 타입 색상 즉시 반영
- `ExpInput`: 숫자 입력 필드 (0-999), 스피너 또는 슬라이더

#### 4.3 위자드 통합

- 기존 위자드 플로우에 테마 선택 단계를 추가 (Step 1 이전 또는 Step 1에 통합)
- Pokemon 테마 선택 시 추가로 타입과 EXP 설정 UI 표시
- 테마 전환 시 기존 입력 데이터 보존

### 5. 하위 호환성 보장

- `theme` 필드는 `optional`로 정의하여 기존 데이터와 호환
- `localStorage`의 기존 `namecard-storage` 데이터는 `theme` 필드 없이도 정상 동작
- CSV 일괄 업로드는 `theme` 컬럼 없이도 기존과 동일하게 동작 (`classic` 기본)
- `AdminCardPreview`와 `ConfirmedCardPreview`는 `theme` 필드에 따라 분기 렌더링

---

## 영향 분석 (File Impact Analysis)

| 파일 경로                                         | 변경 유형 | 설명                                       |
| ------------------------------------------------- | --------- | ------------------------------------------ |
| `src/types/card.ts`                               | 수정      | CardTheme, PokemonType, PokemonMeta 타입 추가 |
| `src/stores/useCardStore.ts`                      | 수정      | setTheme, setPokemonType, setPokemonExp 액션 추가 |
| `src/components/card/CardFront.tsx`               | 수정      | 테마 분기 래퍼로 변경, 기존 로직을 ClassicCardFront로 추출 |
| `src/components/card/CardBack.tsx`                | 수정      | 테마 분기 래퍼로 변경, 기존 로직을 ClassicCardBack으로 추출 |
| `src/components/card/PokemonCardFront.tsx`        | 신규      | Pokemon 테마 앞면 컴포넌트                  |
| `src/components/card/PokemonCardBack.tsx`         | 신규      | Pokemon 테마 뒷면 컴포넌트                  |
| `src/components/card/pokemon-types.ts`            | 신규      | 타입 정의, 색상 맵, SVG 아이콘 데이터       |
| `src/components/editor/ThemeSelector.tsx`         | 신규      | 테마 선택 UI 컴포넌트                       |
| `src/components/editor/PokemonTypeSelector.tsx`   | 신규      | Pokemon 타입 선택 그리드 컴포넌트           |
| `src/components/editor/ExpInput.tsx`              | 신규      | EXP/Level 숫자 입력 컴포넌트                |
| `src/components/wizard/ThemeSelectionStep.tsx`    | 신규      | 위자드 테마 선택 단계 컴포넌트              |
| `src/components/admin/AdminCardPreview.tsx`       | 수정      | 테마별 렌더링 분기 지원                     |
| `src/components/dashboard/ConfirmedCardPreview.tsx`| 수정     | 테마별 렌더링 분기 지원                     |

---

## 구현 결과 (Implementation Results)

### 구현 완료 항목

#### Pokemon 테마 (v1.0.0)
- 7개 타입 시스템 (Fire, Water, Grass, Electric, Psychic, Steel, Normal)
- 골드 프레임(#EED171, 10px border) + 장식 내부 테두리
- 앞면: 풀블리드 일러스트, 반투명 정보 섹션, 오렌지 HP 배지, 좌상단 이름 오버레이
- 뒷면: 다크 그라데이션 배경, 장식 패턴, 중앙 이름/타이틀, 소셜 링크
- 에디터: ThemeSelector, PokemonTypeSelector, ExpInput 컴포넌트
- 관리자/대시보드 프리뷰 지원

#### Hearthstone 테마 (v1.1.0)
- 9개 직업 시스템 (Warrior, Mage, Rogue, Priest, Hunter, Paladin, Shaman, Warlock, Druid)
- 석재/금색 프레임(#8B6914, 8px border)
- 앞면: 마나 크리스탈(파란 보석), 포트레이트 프레임, 양피지 이름 배너, 공격/체력 스탯
- 뒷면: 다크 브라운 그라데이션, 장식 패턴, 클래스 아이콘 뱃지
- 에디터: HearthstoneClassSelector, HearthstoneStatInput 컴포넌트
- 관리자/대시보드 프리뷰 지원

#### Harry Potter 테마 (v2.0.0)
- 4개 기숙사 시스템 (Gryffindor, Slytherin, Hufflepuff, Ravenclaw)
- 기숙사별 고유 색상: Gryffindor(#740001/gold), Slytherin(#1A472A/silver), Hufflepuff(#FFD800/black), Ravenclaw(#0E1A40/bronze)
- 양피지/석재 프레임, 기숙사 문장 배지, 지팡이 장식
- 메타데이터: `{ house: HarrypotterHouse, year: number (1-7), spellPower: number (0-999) }`
- 앞면: 기숙사 색상 프레임, 문장 배지, 주문 파워 스탯 표시
- 뒷면: 기숙사 테마 배경, 지팡이 장식 패턴
- 에디터: HarrypotterHouseSelector, HarrypotterStatInput 컴포넌트
- 관리자/대시보드 프리뷰 지원

#### Tarot 테마 (v2.0.0)
- 5개 아르카나 시스템 (Major, Wands, Cups, Swords, Pentacles)
- 아르카나별 고유 색상: Major(#4A0E4E/gold), Wands(#8B2500/orange), Cups(#1B4D6E/skyblue), Swords(#4A4A4A/silver), Pentacles(#2E4E1E/goldenrod)
- 아르누보 보더, 천체 별 패턴, 신비로운 눈 모티프
- 메타데이터: `{ arcana: TarotArcana, cardNumber: number (0-21), mystique: number (0-999) }`
- 앞면: 아르카나 색상 프레임, 천체 패턴, 미스틱 스탯 표시
- 뒷면: 신비로운 눈 모티프, 별 패턴 배경
- 에디터: TarotArcanaSelector, TarotStatInput 컴포넌트
- 관리자/대시보드 프리뷰 지원

#### 공통 인프라
- 테마 관리 페이지 (/admin/themes): 미리보기 갤러리, 통계, 일괄 적용
- 테마 API (GET/PATCH /api/admin/themes)
- DB 컬럼: theme TEXT, pokemon_meta JSONB, hearthstone_meta JSONB, harrypotter_meta JSONB, tarot_meta JSONB
- 하위 호환성 100% 보장

---

## 트레이서빌리티 (Traceability)

| 요구사항   | plan.md 연결                  | acceptance.md 연결 |
| ---------- | ----------------------------- | ------------------ |
| REQ-U-001  | Phase 1: 데이터 모델 확장      | AC-001             |
| REQ-U-002  | Phase 1: 하위 호환성           | AC-002             |
| REQ-U-003  | Phase 2: SVG 아이콘 디자인     | AC-003             |
| REQ-E-001  | Phase 3: 에디터 통합           | AC-004             |
| REQ-E-002  | Phase 2: PokemonCardFront     | AC-005             |
| REQ-E-003  | Phase 2: PokemonCardBack      | AC-006             |
| REQ-E-004  | Phase 2: 타입 색상 연동        | AC-007             |
| REQ-E-005  | Phase 3: 테마 전환 로직        | AC-008             |
| REQ-E-006  | Phase 3: ExpInput 컴포넌트     | AC-009             |
| REQ-S-001  | Phase 1: 하위 호환성           | AC-010             |
| REQ-S-002  | Phase 4: PNG 내보내기 검증     | AC-011             |
| REQ-S-003  | Phase 3: 테마별 에디터         | AC-012             |
| REQ-N-001  | 전체: 디자인 검증              | AC-013             |
| REQ-N-002  | Phase 3: 테마 전환 로직        | AC-014             |
| REQ-O-001  | Phase 5: 범용 테마 인터페이스  | AC-015             |
