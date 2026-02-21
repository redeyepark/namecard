# SPEC-UI-001: Namecard Editor Web Application - 구현 계획서

> **SPEC ID**: SPEC-UI-001
> **Status**: Planned
> **Priority**: High
> **Created**: 2026-02-21

---

## 1. 구현 전략 (Implementation Strategy)

### DDD (Domain-Driven Development) 접근 방식

본 프로젝트는 신규 프로젝트로 기존 코드가 없으므로, DDD 사이클을 다음과 같이 적용합니다.

**ANALYZE (분석)**:
- 명함 편집기의 도메인 경계 정의 (카드 데이터, 편집 UI, 내보내기 기능)
- 컴포넌트 의존성 그래프 설계
- 사용자 워크플로우 분석 (입력 -> 미리보기 -> 내보내기)

**PRESERVE (보존)**:
- 각 Phase 완료 시 characterization test 작성
- 컴포넌트 단위 테스트로 기존 동작 보호
- Zustand store 상태 변화 스냅샷 테스트

**IMPROVE (개선)**:
- Phase별 점진적 기능 추가
- 각 변경 후 테스트 실행으로 회귀 방지
- 리팩토링 시 기존 테스트 통과 확인

---

## 2. Phase 1 - 핵심 편집기 (Core Editor)

**목표**: 명함 앞/뒷면 편집 및 실시간 미리보기 기능 구현

### 마일스톤

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 1-1 | Next.js 16 프로젝트 초기화 (TypeScript + Tailwind CSS 4) | 프로젝트 scaffolding, 기본 설정 파일 |
| 1-2 | Card 컴포넌트 레이아웃 (앞/뒷면) | `CardPreview.tsx`, `CardFront.tsx`, `CardBack.tsx` |
| 1-3 | 레퍼런스 디자인 CSS 스타일링 | 명함 비율(90x50mm), 그림자, 테두리, 타이포그래피 |
| 1-4 | 앞/뒷면 전환 UI | `TabSwitch.tsx` (앞면/뒷면 탭 전환) |
| 1-5 | 텍스트 편집 패널 | `EditorPanel.tsx`, `TextEditor.tsx`, `HashtagEditor.tsx`, `SocialLinkEditor.tsx` |
| 1-6 | 실시간 미리보기 동기화 | Zustand store 연동, 입력 즉시 카드 미리보기 반영 |

### 기술적 접근

- **Next.js 16 App Router** 사용 (Server Components 기본, 편집기는 Client Component)
- **Tailwind CSS 4** 유틸리티 클래스 기반 스타일링
- 명함 비율 **90mm x 50mm** (국제 표준) 기준 반응형 스케일링
- `contentEditable` 대신 **제어 컴포넌트(controlled component)** 방식 텍스트 입력
- 앞/뒷면 전환은 CSS `transform: rotateY()` 애니메이션 적용

---

## 3. Phase 2 - 이미지 및 색상 (Image & Color)

**목표**: 프로필 이미지 업로드, 배경색 커스터마이징, 상태 관리 완성

### 마일스톤

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 2-1 | 이미지 업로드 컴포넌트 (드래그 앤 드롭 지원) | `ImageUploader.tsx` |
| 2-2 | 이미지 미리보기 및 위치 조정 | 이미지 크롭/리사이즈 UI |
| 2-3 | 배경색 선택기 (앞면/뒷면 개별 색상) | `ColorPicker.tsx` (react-colorful 기반) |
| 2-4 | Zustand 상태 관리 + localStorage 자동 저장 | `useCardStore.ts` 완성 |
| 2-5 | 이미지 파일 크기 유효성 검사 (5MB 제한) | `validation.ts` |

### 기술적 접근

- **react-colorful**: 경량 색상 선택기 (2KB gzipped, 의존성 없음)
- **드래그 앤 드롭**: HTML5 Drag and Drop API 네이티브 사용 (외부 라이브러리 불필요)
- **이미지 처리**: `FileReader` API로 base64 변환 후 미리보기
- **Zustand persist middleware**: localStorage 자동 동기화
- **파일 유효성 검사**: 타입(image/jpeg, image/png, image/webp) + 크기(5MB) 제한

---

## 4. Phase 3 - 내보내기 및 완성도 (Export & Polish)

**목표**: PNG 이미지 내보내기, 반응형 디자인, 접근성 보장

### 마일스톤

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 3-1 | PNG 이미지 내보내기 (html-to-image) | `export.ts`, `ExportButton.tsx` |
| 3-2 | 앞면/뒷면 개별 또는 결합 다운로드 | 내보내기 옵션 UI |
| 3-3 | 반응형 디자인 최적화 (모바일/태블릿/데스크톱) | 미디어 쿼리, 레이아웃 조정 |
| 3-4 | 접근성 (키보드 내비게이션, ARIA 레이블) | 전체 컴포넌트 a11y 적용 |

### 기술적 접근

- **html-to-image**: DOM 노드를 PNG로 변환 (html2canvas 대비 경량, 더 정확한 렌더링)
- **내보내기 해상도**: 2x 스케일링으로 고해상도 출력 (Retina 대응)
- **반응형 브레이크포인트**: mobile(< 640px), tablet(640-1024px), desktop(> 1024px)
- **접근성**: WCAG 2.1 AA 기준 준수, `tabIndex`, `aria-label`, `role` 속성 적용
- **키보드 내비게이션**: Tab 순서 논리적 배치, Enter/Space 활성화 지원

---

## 5. Phase 4 - 부가 기능 (Optional)

**목표**: 사용자 경험 향상을 위한 추가 기능

### 마일스톤

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 4-1 | PDF 내보내기 | jsPDF 또는 브라우저 print API 활용 |
| 4-2 | 색상 템플릿 프리셋 | 미리 정의된 색상 조합 선택 UI |
| 4-3 | 다크 모드 지원 | Tailwind CSS `dark:` 유틸리티 + 시스템 설정 감지 |

### 기술적 접근

- **PDF 내보내기**: html-to-image로 PNG 생성 후 jsPDF로 PDF 삽입
- **색상 템플릿**: JSON 기반 프리셋 데이터 (비즈니스, 크리에이티브, 미니멀 등)
- **다크 모드**: `prefers-color-scheme` 미디어 쿼리 + 수동 전환 토글

---

## 6. 컴포넌트 아키텍처 (Component Architecture)

```
src/
  app/
    page.tsx                          # 메인 페이지 (편집기 + 미리보기 레이아웃)
    layout.tsx                        # 루트 레이아웃 (메타데이터, 폰트, 글로벌 스타일)
  components/
    card/
      CardPreview.tsx                 # 카드 미리보기 컨테이너 (앞/뒷면 전환)
      CardFront.tsx                   # 카드 앞면 렌더링
      CardBack.tsx                    # 카드 뒷면 렌더링
    editor/
      EditorPanel.tsx                 # 편집 패널 컨테이너
      TextEditor.tsx                  # 이름/직함 텍스트 입력
      ImageUploader.tsx               # 프로필 이미지 업로드 (드래그 앤 드롭)
      ColorPicker.tsx                 # 배경색 선택기 (react-colorful)
      SocialLinkEditor.tsx            # 소셜 링크 편집기
      HashtagEditor.tsx               # 해시태그 편집기
    export/
      ExportButton.tsx                # PNG/PDF 내보내기 버튼
    ui/
      TabSwitch.tsx                   # 앞면/뒷면 탭 전환 컴포넌트
  stores/
    useCardStore.ts                   # Zustand 카드 데이터 전역 상태
  types/
    card.ts                           # CardData, SocialLink 타입 정의
  lib/
    export.ts                         # 이미지/PDF 내보내기 유틸리티
    validation.ts                     # 파일 크기/타입 유효성 검사
```

### 컴포넌트 의존성 구조

```
page.tsx
  +-- CardPreview (미리보기 영역)
  |     +-- CardFront (앞면)
  |     +-- CardBack (뒷면)
  +-- TabSwitch (앞/뒷면 전환)
  +-- EditorPanel (편집 영역)
        +-- TextEditor (이름, 직함)
        +-- ImageUploader (프로필 사진)
        +-- ColorPicker (배경색)
        +-- HashtagEditor (해시태그)
        +-- SocialLinkEditor (소셜 링크)
        +-- ExportButton (내보내기)
```

---

## 7. 데이터 모델 (Data Model)

```typescript
// types/card.ts

interface CardData {
  front: {
    displayName: string;           // 표시 이름 (앞면)
    avatarImage: string | null;    // 프로필 이미지 (base64 또는 null)
    backgroundColor: string;       // 앞면 배경색 (hex)
  };
  back: {
    fullName: string;              // 전체 이름 (뒷면)
    title: string;                 // 직함/소속
    hashtags: string[];            // 해시태그 목록
    socialLinks: SocialLink[];     // 소셜 링크 목록
    backgroundColor: string;       // 뒷면 배경색 (hex)
  };
}

interface SocialLink {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'email' | 'custom';
  url: string;                     // 링크 URL 또는 이메일 주소
  label: string;                   // 표시 레이블
}
```

### Zustand Store 구조

```typescript
// stores/useCardStore.ts

interface CardStore {
  card: CardData;                  // 카드 데이터
  activeSide: 'front' | 'back';   // 현재 활성 면

  // Actions
  updateFront: (data: Partial<CardData['front']>) => void;
  updateBack: (data: Partial<CardData['back']>) => void;
  setActiveSide: (side: 'front' | 'back') => void;
  addSocialLink: (link: SocialLink) => void;
  removeSocialLink: (index: number) => void;
  addHashtag: (tag: string) => void;
  removeHashtag: (index: number) => void;
  resetCard: () => void;
}
```

---

## 8. 의존성 목록 (Dependencies)

### Production Dependencies

| 패키지 | 버전 | 용도 |
|---------|------|------|
| next | ^16.0.0 | React 프레임워크 (App Router, SSR) |
| react | ^19.0.0 | UI 라이브러리 |
| react-dom | ^19.0.0 | React DOM 렌더러 |
| typescript | ^5.9.0 | 타입 안전성 |
| tailwindcss | ^4.0.0 | 유틸리티 기반 CSS |
| zustand | ^5.0.0 | 경량 상태 관리 (2KB) |
| react-colorful | ^5.6.0 | 색상 선택기 (2KB, zero-dependency) |
| html-to-image | ^1.11.0 | DOM to PNG 변환 |

### Development Dependencies

| 패키지 | 버전 | 용도 |
|---------|------|------|
| @types/react | ^19.0.0 | React 타입 정의 |
| @types/node | ^22.0.0 | Node.js 타입 정의 |
| vitest | ^3.0.0 | 테스트 프레임워크 |
| @testing-library/react | ^16.0.0 | React 컴포넌트 테스트 |
| @testing-library/jest-dom | ^6.0.0 | DOM assertion 확장 |
| @playwright/test | ^1.50.0 | E2E 테스트 |
| eslint | ^9.0.0 | 코드 린팅 |
| eslint-config-next | ^16.0.0 | Next.js ESLint 설정 |
| prettier | ^3.5.0 | 코드 포매팅 |

### 선택적 Dependencies (Phase 4)

| 패키지 | 버전 | 용도 |
|---------|------|------|
| jspdf | ^2.5.0 | PDF 생성 |

---

## 9. 리스크 분석 (Risk Analysis)

| 리스크 | 영향도 | 발생 확률 | 대응 전략 |
|--------|--------|-----------|-----------|
| **이미지 내보내기 품질** (브라우저별 렌더링 차이) | **High** | **Medium** | html-to-image의 `pixelRatio` 옵션으로 고해상도 출력, 주요 브라우저(Chrome, Firefox, Safari) 테스트 자동화 |
| **웹 폰트 내보내기 문제** (PNG 변환 시 폰트 미포함) | **Medium** | **High** | 폰트를 base64로 인라인 임베딩, `@font-face` CSS 인라인 처리, 시스템 폰트 폴백 적용 |
| **대용량 이미지 업로드 성능** (base64 변환 시 메모리 사용) | **Medium** | **Low** | 5MB 파일 크기 제한, 클라이언트 사이드 이미지 리사이즈, `URL.createObjectURL` 대체 방안 |
| **모바일 편집 UX** (작은 화면에서의 편집 경험) | **Medium** | **Medium** | 모바일 전용 레이아웃 (편집/미리보기 탭 분리), 터치 친화적 입력 크기(min 44px), 접기/펌치기 섹션 |
| **localStorage 용량 제한** (브라우저별 5-10MB 제한) | **Low** | **Low** | 이미지 데이터 압축 저장, 용량 초과 시 경고 알림, 이미지만 별도 IndexedDB 저장 고려 |

---

## 10. 구현 일정 (Implementation Timeline)

### 우선순위 기반 마일스톤

**Primary Goal (핵심 목표) - Phase 1: 핵심 편집기**
- 프로젝트 초기화 및 기본 구조 설정
- 카드 앞/뒷면 컴포넌트 및 전환 UI
- 텍스트 편집 패널 및 실시간 미리보기
- 완료 기준: 텍스트 기반 명함 편집 및 미리보기 동작

**Secondary Goal (보조 목표) - Phase 2: 이미지 및 색상**
- Phase 1 완료 후 착수
- 이미지 업로드 및 배경색 커스터마이징
- 상태 관리 및 자동 저장 완성
- 완료 기준: 이미지/색상 포함 명함 편집 및 데이터 유지

**Final Goal (최종 목표) - Phase 3: 내보내기 및 완성도**
- Phase 2 완료 후 착수
- PNG 내보내기 및 반응형/접근성
- 완료 기준: 명함 이미지 다운로드 및 모든 디바이스 지원

**Optional Goal (부가 목표) - Phase 4: 부가 기능**
- Phase 3 완료 후 선택적 착수
- PDF 내보내기, 색상 프리셋, 다크 모드
- 완료 기준: 사용자 경험 향상 기능 제공

### Phase 간 의존성

```
Phase 1 (핵심 편집기)
    +-- Phase 2 (이미지 및 색상) - Phase 1의 컴포넌트 구조에 의존
          +-- Phase 3 (내보내기 및 완성도) - Phase 2의 완성된 카드 데이터에 의존
                +-- Phase 4 (부가 기능) - Phase 3의 내보내기 인프라에 의존
```

---

## Traceability

- **SPEC Reference**: SPEC-UI-001/spec.md
- **Acceptance Criteria**: SPEC-UI-001/acceptance.md
- **Tags**: `SPEC-UI-001`, `namecard-editor`, `next.js`, `react`, `typescript`
