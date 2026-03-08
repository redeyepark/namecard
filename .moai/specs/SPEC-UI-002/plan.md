---
id: SPEC-UI-002
version: "1.0.0"
status: planned
created: "2026-03-08"
updated: "2026-03-08"
author: MoAI
priority: high
---

# SPEC-UI-002: Design System Unification - Implementation Plan

## Overview

이 구현 계획은 3개 모듈(Design Token Integration, UI Primitive Components, Existing Component Migration)의 단계별 실행 전략을 정의한다. 각 모듈은 의존 관계에 따라 순차적으로 실행되어야 한다.

---

## Milestone 1: Design Token Integration (Primary Goal)

### 목표

globals.css의 CSS 커스텀 프로퍼티를 Tailwind CSS v4 `@theme` 디렉티브로 등록하고, 시맨틱 색상 별칭을 생성한다.

### Task Decomposition

**Task 1.1: Tailwind CSS v4 @theme 디렉티브 설정**

- globals.css의 `:root` 블록 내 CSS 커스텀 프로퍼티를 `@theme` 디렉티브로 등록
- Tailwind CSS v4의 CSS-first configuration 방식에 맞게 구성
- 색상, 반경, 그림자, 폰트 토큰 모두 포함
- 관련 요구사항: REQ-U-001

**Task 1.2: 시맨틱 색상 토큰 추가**

- 에러/성공/경고/정보 상태 색상 토큰 정의 (--color-error, --color-success, --color-warning, --color-info)
- 포커스 링 색상 토큰 정의 (--color-focus-ring)
- 관련 요구사항: REQ-U-003

**Task 1.3: Tailwind 기본 색상 사용 금지 설정**

- Tailwind CSS v4에서 프로젝트 디자인 토큰만 사용하도록 설정
- 기본 색상 팔레트(gray, blue, red 등) 사용을 프로젝트 토큰으로 대체하는 전략 수립
- 관련 요구사항: REQ-N-001

**Task 1.4: 다크 모드 확장 구조 준비**

- `:root` / `.dark` 선택자 분리 구조 설계 (현재 구현은 하지 않되 확장 가능한 구조)
- 관련 요구사항: REQ-S-001

**Task 1.5: 스페이싱 스케일 표준 정의 (Optional)**

- 4px 기반 스페이싱 스케일 문서화
- 관련 요구사항: REQ-O-001

### Dependencies

- 없음 (최초 실행 모듈)

### Technical Approach

```
// Tailwind CSS v4 @theme 디렉티브 예시 (globals.css)
@theme {
  --color-primary: #020912;
  --color-secondary: #fcfcfc;
  --color-bg: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --color-accent-blue: #e4f6ff;
  --color-accent-green: #dbe9e0;
  --color-accent-peach: #ffdfc8;
  --color-accent-orange: #ffa639;
  --color-border-light: rgba(2, 9, 18, 0.08);
  --color-border-medium: rgba(2, 9, 18, 0.15);
  --color-border-dark: rgba(252, 252, 252, 0.15);
  --color-divider: #E5E7EB;
  --color-error: #DC2626;
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-info: #2563EB;
  --color-focus-ring: rgba(2, 9, 18, 0.3);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  --shadow-sm: ...;
  --shadow-md: ...;
  --shadow-lg: ...;
  --shadow-card: ...;
  --font-heading: 'Figtree', sans-serif;
  --font-body: 'Anonymous Pro', monospace;
  --font-card: 'Nanum Myeongjo', serif;
}
```

### Risks

| 리스크                                     | 영향도 | 대응 전략                                                    |
| ------------------------------------------ | ------ | ------------------------------------------------------------ |
| Tailwind v4 @theme 문법 변경               | 중     | 공식 문서 최신 버전 확인, WebFetch로 검증                    |
| 기존 Tailwind 기본 색상 사용 코드 깨짐     | 중     | 마이그레이션 전 영향 범위 스캔, 점진적 교체                  |
| CSS 커스텀 프로퍼티 우선순위 충돌           | 낮     | @theme 디렉티브와 :root 블록 분리 검증                      |

---

## Milestone 2: UI Primitive Components (Secondary Goal)

### 목표

재사용 가능한 UI 프리미티브 컴포넌트 8종을 생성하고, 디자인 토큰 기반으로 일관된 스타일링을 적용한다.

### Task Decomposition

**Task 2.1: Button 컴포넌트 생성**

- 5가지 variant (primary, secondary, accent, danger, ghost)
- 3가지 size (sm, md, lg)
- disabled, loading 상태 처리
- forwardRef + HTML button 속성 전달
- 기존 240개 버튼 요소의 6+ 패딩 변형을 3단계로 표준화
- 관련 요구사항: REQ-U-004, REQ-U-005, REQ-E-002, REQ-S-002

**Task 2.2: Input 컴포넌트 생성**

- default, error variant
- 3가지 size (sm, md, lg)
- 통합 포커스 링 스타일 적용
- label, helperText, errorMessage 슬롯
- forwardRef + HTML input 속성 전달
- 관련 요구사항: REQ-U-004, REQ-U-005, REQ-E-003, REQ-S-003

**Task 2.3: Textarea 컴포넌트 생성**

- Input과 동일한 스타일 시스템 적용
- autoResize 옵션
- 관련 요구사항: REQ-U-004, REQ-U-005

**Task 2.4: Select 컴포넌트 생성**

- default, error variant
- 3가지 size (sm, md, lg)
- 통합 포커스 링 스타일 적용
- 관련 요구사항: REQ-U-004, REQ-U-005

**Task 2.5: Modal 컴포넌트 생성**

- 기존 5개 모달 구현체 분석 및 공통 패턴 추출
- default, fullscreen variant
- sm, md, lg size
- 오버레이 클릭 닫기, ESC 키 닫기, 포커스 트랩
- React Portal 기반 렌더링
- 관련 요구사항: REQ-U-004, REQ-E-004

**Task 2.6: Avatar 컴포넌트 생성**

- circle, rounded variant
- sm (32px), md (48px), lg (64px) size
- fallback 이니셜/아이콘 지원
- 관련 요구사항: REQ-U-004, REQ-U-005

**Task 2.7: Badge 컴포넌트 생성 (Optional)**

- default, success, warning, error, info variant
- sm, md size
- 관련 요구사항: REQ-O-003

**Task 2.8: Skeleton 컴포넌트 생성 (Optional)**

- text, circle, rect variant
- pulse 애니메이션
- 관련 요구사항: REQ-O-002

**Task 2.9: Barrel Export 파일 생성**

- `src/components/ui/index.ts`에서 모든 UI 프리미티브 re-export
- 관련 요구사항: REQ-U-004

### Dependencies

- Milestone 1 완료 필수 (디자인 토큰이 Tailwind 테마에 등록되어야 함)

### Technical Approach

```typescript
// Button 컴포넌트 구조 예시
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, ...rest }, ref) => {
    // Tailwind 디자인 토큰 기반 클래스 매핑
  }
);
```

### Risks

| 리스크                                     | 영향도 | 대응 전략                                                    |
| ------------------------------------------ | ------ | ------------------------------------------------------------ |
| 기존 5개 모달의 동작 차이 통합 어려움      | 높     | 각 모달의 기능 매트릭스 작성 후 공통 인터페이스 설계         |
| forwardRef 패턴과 서버 컴포넌트 호환       | 중     | 'use client' 디렉티브 필수, 서버/클라이언트 경계 명확화     |
| 컴포넌트 API 설계 후 변경 어려움           | 중     | 기존 240개 버튼 패턴 분석 후 API 확정                       |

---

## Milestone 3: Existing Component Migration (Tertiary Goal)

### 목표

84개 하드코딩 색상 컴포넌트를 디자인 토큰 기반으로 마이그레이션하고, 인라인 버튼/입력/모달 패턴을 UI 프리미티브로 교체한다.

### Task Decomposition

**Task 3.1: 마이그레이션 대상 컴포넌트 스캔 및 분류**

- 84개 하드코딩 색상 컴포넌트 전수 목록 작성
- 카드 내보내기 파이프라인 포함 여부 판별 (제외 대상)
- 테마별 고유 색상 사용 여부 판별 (부분 마이그레이션)
- 도메인별 그룹핑 (편집기, 대시보드, 커뮤니티, 갤러리, 인증, 공통)
- 관련 요구사항: REQ-S-004, REQ-S-005

**Task 3.2: 하드코딩 색상 -> 디자인 토큰 교체 (Phase 1: 고빈도 값)**

- `#020912` (775회) -> `bg-primary`, `text-primary`
- `rgba(2,9,18,0.15)` (147회) -> `border-border-medium`
- `#fcfcfc` (74회) -> `bg-secondary`, `text-secondary`
- `#e4f6ff` (28회) -> `bg-accent-blue`
- `#ffa639` (20회) -> `bg-accent-orange`
- 관련 요구사항: REQ-U-006

**Task 3.3: 하드코딩 색상 -> 디자인 토큰 교체 (Phase 2: 저빈도 값)**

- 나머지 40개 고유 하드코딩 색상 값 매핑 및 교체
- Tailwind 기본 색상(gray-300, blue-500 등) 사용을 프로젝트 토큰으로 교체
- 관련 요구사항: REQ-U-006, REQ-N-001

**Task 3.4: 인라인 버튼 패턴 -> Button 컴포넌트 교체**

- 240개 버튼 요소 중 마이그레이션 대상 식별
- 인라인 스타일 버튼을 Button 컴포넌트로 교체
- 관련 요구사항: REQ-E-005

**Task 3.5: 인라인 입력 패턴 -> Input/Textarea/Select 컴포넌트 교체**

- 포커스 상태 불일치(ring-blue-500, ring-[#020912]/30, ring-gray-400) 해소
- 인라인 입력 필드를 Input/Textarea/Select 컴포넌트로 교체
- 관련 요구사항: REQ-E-005

**Task 3.6: 인라인 모달 패턴 -> Modal 컴포넌트 교체**

- 5개 별도 모달 구현체를 Modal 컴포넌트 기반으로 리팩토링
- 관련 요구사항: REQ-E-005

**Task 3.7: Border Radius 표준화 (Optional)**

- rounded-lg (75x), rounded-full (59x), rounded (49x), rounded-md (20x) 사용 분석
- 글로벌 기본값(0px)과 명시적 반경 토큰 사용 패턴 정리
- 관련 요구사항: REQ-O-004

**Task 3.8: 시각적 회귀 테스트**

- 마이그레이션 전후 주요 페이지 스크린샷 비교
- 카드 내보내기(PNG) 출력 비교
- 반응형 레이아웃(320px, 768px, 1024px, 1440px) 검증
- 관련 요구사항: REQ-U-007, REQ-N-003, REQ-N-004

### Dependencies

- Milestone 1 완료 필수 (디자인 토큰 등록)
- Milestone 2 완료 필수 (UI 프리미티브 컴포넌트 생성)

### Technical Approach

마이그레이션 전략: **도메인별 점진적 마이그레이션**

1. 편집기/폼 컴포넌트 (~25개) - 가장 많은 하드코딩 패턴 보유
2. 대시보드 컴포넌트 (~15개) - 버튼/입력 패턴 중복 다수
3. 커뮤니티 컴포넌트 (~20개) - 모달 중복 구현 해소
4. 갤러리/공유 컴포넌트 (~10개)
5. 인증/관리 컴포넌트 (~10개)
6. 공통/레이아웃 컴포넌트 (~10개, 부분)

각 도메인 마이그레이션 후 시각적 회귀 테스트 실행.

### Risks

| 리스크                                     | 영향도 | 대응 전략                                                    |
| ------------------------------------------ | ------ | ------------------------------------------------------------ |
| 카드 내보내기 출력 품질 저하               | 높     | 내보내기 파이프라인 컴포넌트 제외, 마이그레이션 전후 출력 비교 |
| 대규모 파일 변경으로 인한 머지 충돌         | 높     | 도메인별 점진적 마이그레이션, 작은 커밋 단위                 |
| 하드코딩 색상의 의도적 사용 미식별         | 중     | 컴포넌트별 색상 사용 의도 분석 후 교체                       |
| 반응형 레이아웃 깨짐                       | 중     | 주요 브레이크포인트별 시각적 검증                             |
| Tailwind 클래스 충돌 (기본 vs 커스텀)      | 낮     | @theme 등록 후 기본 색상과 충돌 여부 테스트                  |

---

## Milestone 4: Quality Assurance (Final Goal)

### 목표

전체 마이그레이션 완료 후 품질 검증 및 문서화.

### Task Decomposition

**Task 4.1: 디자인 토큰 사용률 검증**

- 하드코딩 색상 잔여 수 확인 (목표: 카드 테마 외 0개)
- CSS 변수 참조 비율 확인 (목표: 하드코딩 대비 10:1 이상)

**Task 4.2: UI 프리미티브 사용률 검증**

- 인라인 버튼/입력/모달 패턴 잔여 수 확인
- UI 프리미티브 Import 횟수 확인

**Task 4.3: 빌드 및 배포 검증**

- `npm run build` 성공 확인
- 번들 크기 증가량 확인 (기존 대비 +5KB 이내)
- Cloudflare Workers 배포 정상 동작 확인

**Task 4.4: 디자인 시스템 문서화**

- 사용 가능한 디자인 토큰 목록 문서
- UI 프리미티브 컴포넌트 API 문서
- 마이그레이션 가이드 (신규 컴포넌트 작성 시 참고)

### Dependencies

- Milestone 3 완료 필수

---

## Expert Consultation Recommendations

### Frontend Expert (expert-frontend) - 강력 권장

이 SPEC은 UI 컴포넌트, 디자인 시스템, 클라이언트 사이드 구현에 집중하므로 expert-frontend 전문가 상담을 권장한다.

상담 범위:

- Tailwind CSS v4 @theme 디렉티브 설정 검증
- UI 프리미티브 컴포넌트 API 설계 리뷰
- React 19 forwardRef 패턴 및 서버/클라이언트 컴포넌트 호환성
- 대규모 컴포넌트 마이그레이션 전략

### Design/UX Expert (expert-stitch) - 권장

디자인 시스템 토큰 구조와 컴포넌트 시각적 일관성 검증을 위해 expert-stitch 상담을 권장한다.

상담 범위:

- 시맨틱 색상 토큰 체계 검증
- 스페이싱/타이포그래피 스케일 검증
- 접근성(WCAG 2.1 AA) 색상 대비 검증

---

## Summary

| Milestone | 우선순위       | 의존 관계     | 주요 산출물                             |
| --------- | -------------- | ------------- | --------------------------------------- |
| M1        | Primary Goal   | 없음          | @theme 디자인 토큰, 시맨틱 색상         |
| M2        | Secondary Goal | M1            | UI 프리미티브 8종                       |
| M3        | Tertiary Goal  | M1, M2        | 84개 컴포넌트 마이그레이션              |
| M4        | Final Goal     | M3            | 품질 검증 및 문서화                     |
