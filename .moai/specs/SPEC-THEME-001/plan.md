---
id: SPEC-THEME-001
type: plan
version: "1.0.0"
created: "2026-02-25"
updated: "2026-02-25"
---

# SPEC-THEME-001: 구현 계획

## 구현 전략

기존 카드 렌더링 시스템을 테마 분기 래퍼 패턴으로 확장하여, 기존 Classic 렌더링을 100% 보존하면서 Pokemon 테마를 추가한다. 데이터 모델 변경을 최소화하고, 컴포넌트 합성(composition) 패턴으로 테마별 렌더링을 분리한다.

---

## Phase 1: 데이터 모델 및 타입 시스템 (Primary Goal)

**목표**: 테마 시스템의 기반이 되는 타입 정의와 Store 확장

**작업 내용**:
1. `src/types/card.ts`에 `CardTheme`, `PokemonType`, `PokemonMeta` 타입 추가
2. `CardData` 인터페이스에 `theme?`, `pokemonMeta?` optional 필드 추가
3. `src/components/card/pokemon-types.ts` 생성 - 7가지 타입 정의, 색상 맵, SVG 아이콘 데이터
4. `src/stores/useCardStore.ts`에 `setTheme`, `setPokemonType`, `setPokemonExp` 액션 추가
5. 기존 `DEFAULT_CARD`에 `theme: 'classic'` 기본값 추가 (optional이므로 생략 가능하나 명시)

**하위 호환성 검증**:
- `theme` 필드 없는 기존 localStorage 데이터가 정상 로드되는지 확인
- `pokemonMeta` 없는 상태에서 기존 렌더링이 변경 없이 동작하는지 확인

**관련 요구사항**: REQ-U-001, REQ-U-002, REQ-S-001

---

## Phase 2: Pokemon 테마 카드 컴포넌트 (Primary Goal)

**목표**: Pokemon 스타일의 앞면/뒷면 카드 렌더링 컴포넌트 구현

**작업 내용**:
1. `PokemonCardFront.tsx` 구현
   - 타입 색상 기반 4px solid 테두리 프레임
   - 좌상단 네임 플레이트 (이름 표시)
   - 우상단 EXP 스탯 표시 + 타입 배지 아이콘
   - 중앙 일러스트 윈도우 (프로필 사진, 카드 높이의 ~35-40%)
   - 하단 해시태그 정보 섹션
2. `PokemonCardBack.tsx` 구현
   - blue-to-purple 그라데이션 배경
   - CSS 기반 장식적 소용돌이 패턴 (radial-gradient, conic-gradient 활용)
   - 풀네임, 직함, 해시태그 표시
   - 하단 소셜 링크 섹션
3. 7가지 타입별 커스텀 SVG 아이콘 디자인
   - Fire: 불꽃, Water: 물방울, Grass: 잎, Electric: 번개
   - Psychic: 눈/별, Steel: 기어, Normal: 원
4. `CardFront.tsx`, `CardBack.tsx`를 테마 분기 래퍼로 변경
   - 기존 렌더링 로직을 내부 `ClassicCardFront` / `ClassicCardBack`으로 추출
   - `theme` 값에 따라 Classic 또는 Pokemon 컴포넌트 렌더링

**디자인 원칙**:
- 트레이딩 카드에서 "영감을 받은" 오리지널 디자인
- 포켓몬 브랜드 요소 완전 배제
- Nanum Myeongjo 폰트 유지

**관련 요구사항**: REQ-U-003, REQ-E-002, REQ-E-003, REQ-E-004, REQ-N-001

---

## Phase 3: 에디터 및 위자드 통합 (Secondary Goal)

**목표**: 사용자가 테마를 선택하고 Pokemon 옵션을 설정할 수 있는 UI 구현

**작업 내용**:
1. `ThemeSelector.tsx` 구현
   - Classic / Pokemon 2개 테마 선택 UI
   - 아이콘 + 라벨 카드 형태, radio group 접근성
   - 선택 시 즉시 미리보기 반영
2. `PokemonTypeSelector.tsx` 구현
   - 7가지 타입 색상 칩 그리드
   - 선택된 타입 강조 표시
   - 타입 이름 + 대응 직군 라벨
3. `ExpInput.tsx` 구현
   - 숫자 입력 필드 (0-999 범위)
   - 기본값: 100
   - 증감 버튼 또는 직접 입력
4. `ThemeSelectionStep.tsx` 구현
   - 위자드 플로우 내 테마 선택 단계
   - Pokemon 선택 시 타입/EXP 설정 인라인 표시
5. 에디터 패널 통합
   - `EditorPanel.tsx`에 ThemeSelector 섹션 추가
   - Pokemon 테마 활성 시 PokemonTypeSelector + ExpInput 표시
6. 테마 전환 시 데이터 보존 로직 검증

**관련 요구사항**: REQ-E-001, REQ-E-005, REQ-E-006, REQ-S-003, REQ-N-002

---

## Phase 4: 미리보기 및 내보내기 통합 (Secondary Goal)

**목표**: 관리자/대시보드 미리보기와 PNG 내보내기에서 Pokemon 테마 정상 동작

**작업 내용**:
1. `AdminCardPreview.tsx` 수정 - 테마별 분기 렌더링
2. `ConfirmedCardPreview.tsx` 수정 - 테마별 분기 렌더링
3. PNG 내보내기 기능에서 Pokemon 테마 렌더링 검증
   - SVG 아이콘이 PNG에 정확히 포함되는지 확인
   - CSS gradient/pattern이 이미지에 캡처되는지 확인
   - html-to-image 라이브러리의 SVG inline 렌더링 호환성 검증
4. CSV 일괄 업로드 하위 호환성 검증

**관련 요구사항**: REQ-S-002

---

## Phase 5: 폴리싱 및 확장 준비 (Optional Goal)

**목표**: 코드 품질 개선과 향후 테마 확장 기반 마련

**작업 내용**:
1. 범용 `ThemeConfig` 인터페이스 설계 (향후 Minimalist, Cyberpunk 등 추가 대비)
2. 테마별 렌더러 등록 패턴 구현 (Strategy Pattern)
3. 접근성 검증 (WCAG 2.1 AA 기준, 색상 대비 등)
4. 반응형 레이아웃 최적화

**관련 요구사항**: REQ-O-001

---

## 리스크 및 대응

| 리스크                                       | 영향도 | 대응 방안                                          |
| -------------------------------------------- | ------ | -------------------------------------------------- |
| html-to-image에서 CSS gradient 캡처 실패     | 높음   | inline style 사용, gradient를 canvas로 대체 가능성 검토 |
| SVG 아이콘이 PNG 내보내기에 포함 안 됨       | 높음   | SVG를 inline으로 삽입, base64 data URI 방식 대비    |
| 기존 localStorage 데이터 마이그레이션 문제   | 중간   | optional 필드로 설계하여 하위 호환 보장              |
| Pokemon 테마 디자인이 저작권 침해로 인식      | 중간   | 완전 오리지널 디자인, 타입명도 직군 중심으로 표현    |
| 위자드 단계 추가로 UX 복잡도 증가            | 낮음   | 기존 Step 1에 통합하여 단계 수 유지                 |

---

## 기술적 접근

- **컴포넌트 합성 패턴**: 테마별 컴포넌트를 독립적으로 구현하고, 래퍼 컴포넌트에서 분기
- **Strategy Pattern**: 향후 테마 확장을 위해 테마별 렌더러를 등록 가능하도록 설계
- **CSS-in-JS (inline style)**: html-to-image 호환성을 위해 Tailwind 유틸리티 + inline style 병용
- **SVG Inline**: 타입 아이콘을 React 컴포넌트로 구현하여 DOM에 직접 삽입
- **Optional Fields**: 하위 호환성을 위해 모든 신규 필드를 optional로 설계
