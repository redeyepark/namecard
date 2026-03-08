---
id: SPEC-UI-002
version: "1.0.0"
status: planned
created: "2026-03-08"
updated: "2026-03-08"
author: MoAI
priority: high
---

# SPEC-UI-002: Design System Unification - Acceptance Criteria

---

## Module 1: Design Token Integration

### Scenario 1.1: Tailwind CSS v4 @theme 디렉티브 등록

```gherkin
Given globals.css에 15개 색상 토큰, 5개 반경 토큰, 4개 그림자 토큰, 3개 폰트 토큰이 CSS 커스텀 프로퍼티로 정의되어 있다
When @theme 디렉티브를 통해 모든 CSS 커스텀 프로퍼티를 Tailwind 테마 토큰으로 등록한다
Then 컴포넌트에서 `bg-primary`, `text-secondary`, `border-border-medium`, `rounded-radius-md`, `shadow-card`, `font-heading` 등의 Tailwind 유틸리티 클래스가 정상 동작해야 한다
And `npm run build` 명령이 에러 없이 완료되어야 한다
```

### Scenario 1.2: 시맨틱 색상 토큰 추가 및 포커스 링 통합

```gherkin
Given globals.css에 --color-error, --color-success, --color-warning, --color-info, --color-focus-ring 토큰이 정의되어 있지 않다
When 5개 시맨틱 색상 토큰을 추가하고 @theme에 등록한다
Then `bg-error`, `text-success`, `border-warning`, `text-info` 유틸리티 클래스가 동작해야 한다
And `focus-visible:ring-2 ring-focus-ring` 클래스 조합이 rgba(2,9,18,0.3) 색상의 포커스 링을 렌더링해야 한다
```

### Scenario 1.3: Tailwind 기본 색상 사용 차단 (Edge Case)

```gherkin
Given Tailwind CSS v4의 기본 색상 팔레트(gray-300, blue-500, red-600 등)가 활성화되어 있다
When 프로젝트 디자인 토큰만 사용하도록 설정한다
Then 컴포넌트에서 `text-gray-300` 대신 `text-text-tertiary`를, `bg-blue-500` 대신 `bg-info`를, `bg-red-600` 대신 `bg-error`를 사용해야 한다
And 기본 색상 팔레트 사용이 린트 경고 또는 코드 리뷰에서 감지 가능해야 한다
```

### Scenario 1.4: 다크 모드 확장 가능 구조 검증

```gherkin
Given 디자인 토큰이 :root 선택자에 정의되어 있다
When .dark 선택자에 대체 색상 값을 정의하여 테스트한다
Then :root 토큰이 .dark 선택자의 값으로 올바르게 오버라이드되어야 한다
And 기존 라이트 모드 렌더링에 영향이 없어야 한다
```

---

## Module 2: UI Primitive Components

### Scenario 2.1: Button 컴포넌트 variant 및 size 렌더링

```gherkin
Given Button 컴포넌트가 `src/components/ui/Button.tsx`에 생성되어 있다
When variant="primary" size="md"로 Button을 렌더링한다
Then 버튼은 bg-primary 배경색, text-secondary 글자색, px-4 py-2 패딩이 적용되어야 한다
And 하드코딩된 색상 값(#020912, #fcfcfc 등)이 className에 포함되지 않아야 한다
```

```gherkin
Given Button 컴포넌트에 5가지 variant가 정의되어 있다
When variant="ghost" size="sm"으로 Button을 렌더링한다
Then 버튼은 bg-transparent 배경, text-primary 글자색, px-3 py-1.5 패딩이 적용되어야 한다
And hover 시 bg-primary/5 배경이 나타나야 한다
```

### Scenario 2.2: Button disabled 상태 처리

```gherkin
Given Button 컴포넌트에 disabled 속성이 전달된다
When disabled={true}로 Button을 렌더링한다
Then 버튼은 opacity-50 스타일과 cursor-not-allowed가 적용되어야 한다
And onClick 이벤트가 호출되지 않아야 한다
And aria-disabled="true" 속성이 설정되어야 한다
```

### Scenario 2.3: Input 컴포넌트 포커스 링 통합

```gherkin
Given Input 컴포넌트가 `src/components/ui/Input.tsx`에 생성되어 있다
When Input 필드에 포커스가 들어온다
Then focus-visible:ring-2 ring-focus-ring border-primary 스타일이 적용되어야 한다
And 기존 불일치 스타일(ring-blue-500, ring-[#020912]/30, ring-gray-400)이 사용되지 않아야 한다
```

### Scenario 2.4: Input error 상태 렌더링

```gherkin
Given Input 컴포넌트에 error 상태와 에러 메시지가 전달된다
When variant="error" errorMessage="필수 입력 항목입니다"로 렌더링한다
Then Input 테두리가 border-error 색상으로 변경되어야 한다
And 입력 필드 하단에 "필수 입력 항목입니다" 에러 메시지가 text-error 색상으로 표시되어야 한다
And aria-invalid="true" 속성이 설정되어야 한다
```

### Scenario 2.5: Modal 컴포넌트 통합 동작

```gherkin
Given Modal 컴포넌트가 `src/components/ui/Modal.tsx`에 생성되어 있다
When Modal이 open={true}로 열린다
Then 반투명 오버레이가 화면 전체를 덮어야 한다
And 모달 컨텐츠가 화면 중앙에 위치해야 한다
And ESC 키를 누르면 onClose 콜백이 호출되어야 한다
And 오버레이 클릭 시 onClose 콜백이 호출되어야 한다
And 모달 내부로 포커스가 트랩되어야 한다
```

### Scenario 2.6: Modal 기존 5개 구현체 대체 (Edge Case)

```gherkin
Given 기존 5개 별도 모달 구현체가 각각 다른 오버레이 스타일과 닫기 동작을 가지고 있다
When 모든 모달을 통합 Modal 컴포넌트 기반으로 리팩토링한다
Then 각 모달의 기존 기능(컨텐츠 렌더링, 폼 제출, 닫기 동작)이 동일하게 유지되어야 한다
And 오버레이 스타일이 통일되어야 한다
And 애니메이션(열기/닫기) 동작이 일관되어야 한다
```

### Scenario 2.7: 컴포넌트 타입 안전성 및 forwardRef 지원

```gherkin
Given 모든 UI 프리미티브 컴포넌트가 forwardRef로 구현되어 있다
When Button에 ref={buttonRef}를 전달하고, 추가 HTML 속성(data-testid, aria-label)을 전달한다
Then ref가 올바른 DOM 요소를 참조해야 한다
And 추가 HTML 속성이 렌더링된 요소에 정상 전달되어야 한다
And TypeScript 타입 에러가 발생하지 않아야 한다
```

### Scenario 2.8: 컴포넌트 비즈니스 로직 분리 검증

```gherkin
Given UI 프리미티브 컴포넌트 소스 코드가 존재한다
When 각 컴포넌트 파일을 검사한다
Then fetch, axios, supabase 등 API 호출 코드가 포함되지 않아야 한다
And useAuth, useCardStore 등 비즈니스 훅 import가 없어야 한다
And 컴포넌트가 순수 프레젠테이셔널 역할만 수행해야 한다
```

---

## Module 3: Existing Component Migration

### Scenario 3.1: 고빈도 하드코딩 색상 마이그레이션

```gherkin
Given 편집기 도메인 컴포넌트에서 #020912가 하드코딩되어 사용되고 있다
When 해당 컴포넌트의 #020912를 bg-primary 또는 text-primary Tailwind 클래스로 교체한다
Then 컴포넌트의 시각적 렌더링이 교체 전과 동일해야 한다
And 소스 코드에서 #020912 문자열이 더 이상 존재하지 않아야 한다 (카드 테마 컴포넌트 제외)
```

```gherkin
Given 커뮤니티 도메인 컴포넌트에서 rgba(2,9,18,0.15)가 border 색상으로 사용되고 있다
When 해당 값을 border-border-medium Tailwind 클래스로 교체한다
Then 테두리 색상이 교체 전과 시각적으로 동일해야 한다
And Tailwind 클래스 문자열에서 rgba 값이 사라져야 한다
```

### Scenario 3.2: 카드 내보내기 파이프라인 컴포넌트 제외 검증

```gherkin
Given CardFront, CardBack, 테마별 카드 컴포넌트가 html-to-image 내보내기에 사용된다
When 마이그레이션 대상 스캔을 실행한다
Then 카드 내보내기 파이프라인에 포함된 컴포넌트는 마이그레이션 대상에서 제외되어야 한다
And 해당 컴포넌트의 인라인 스타일이 그대로 유지되어야 한다
```

```gherkin
Given 마이그레이션이 완료된 상태에서 명함을 PNG로 내보내기한다
When 내보내기 버튼을 클릭한다
Then 생성된 PNG 이미지의 색상, 레이아웃, 텍스트가 마이그레이션 전과 동일해야 한다
And 이미지 해상도가 변경되지 않아야 한다
```

### Scenario 3.3: 테마별 고유 색상 부분 마이그레이션

```gherkin
Given Pokemon 테마 카드 컴포넌트에 테마 고유 색상과 공통 레이아웃 스타일이 혼합되어 있다
When 해당 컴포넌트를 마이그레이션한다
Then Pokemon 테마 고유 색상(배경, 타입 색상 등)은 인라인 스타일로 유지되어야 한다
And 공통 레이아웃/구조 스타일(마진, 패딩, 폰트 크기 등)은 내보내기에 영향 없는 범위에서만 토큰화 가능하다
```

### Scenario 3.4: 인라인 버튼 패턴 -> Button 컴포넌트 교체

```gherkin
Given 대시보드 컴포넌트에 <button className="bg-[#020912] text-white px-3 py-1 rounded-lg ..."> 패턴의 인라인 버튼이 있다
When 해당 버튼을 <Button variant="primary" size="sm"> 컴포넌트로 교체한다
Then 버튼의 시각적 렌더링이 교체 전과 유사해야 한다 (패딩이 sm 표준으로 통일됨)
And onClick 이벤트 핸들러가 정상 동작해야 한다
And 소스 코드에서 인라인 버튼 패턴이 Button import로 대체되어야 한다
```

### Scenario 3.5: 포커스 상태 불일치 해소

```gherkin
Given 다양한 컴포넌트에서 ring-blue-500, ring-[#020912]/30, ring-gray-400 등 서로 다른 포커스 링 스타일이 사용되고 있다
When 모든 인터랙티브 요소의 포커스 링을 Input/Button 컴포넌트의 통합 스타일로 교체한다
Then 모든 포커스 가능 요소의 포커스 링 색상이 ring-focus-ring으로 통일되어야 한다
And Tab 키 네비게이션 시 일관된 시각적 피드백이 제공되어야 한다
```

### Scenario 3.6: 반응형 레이아웃 유지 검증

```gherkin
Given 마이그레이션이 완료된 페이지가 있다
When 320px, 768px, 1024px, 1440px 뷰포트에서 페이지를 렌더링한다
Then 각 브레이크포인트에서의 레이아웃이 마이그레이션 전과 동일해야 한다
And 요소가 잘리거나 겹치는 현상이 없어야 한다
And 스크롤 동작이 정상이어야 한다
```

---

## Quality Gate Criteria

### Definition of Done

- [ ] Module 1: 모든 CSS 커스텀 프로퍼티가 @theme 디렉티브에 등록되어 Tailwind 유틸리티 클래스로 접근 가능
- [ ] Module 1: 5개 시맨틱 색상 토큰(error, success, warning, info, focus-ring) 추가 완료
- [ ] Module 2: UI 프리미티브 6종(Button, Input, Textarea, Select, Modal, Avatar) 생성 완료
- [ ] Module 2: 모든 UI 프리미티브가 디자인 토큰만 사용하고 하드코딩 색상 미사용
- [ ] Module 2: 모든 UI 프리미티브가 forwardRef 및 rest props 패턴 지원
- [ ] Module 2: 모든 UI 프리미티브에 TypeScript 타입 정의 완료
- [ ] Module 3: 카드 내보내기 파이프라인 컴포넌트가 마이그레이션에서 제외됨
- [ ] Module 3: 마이그레이션 대상 컴포넌트의 하드코딩 색상이 디자인 토큰으로 교체됨
- [ ] Module 3: 인라인 버튼/입력/모달 패턴이 UI 프리미티브로 교체됨
- [ ] Module 3: 카드 내보내기(PNG) 출력 품질 동일
- [ ] Module 3: 반응형 레이아웃(320px+) 정상 동작
- [ ] 전체: `npm run build` 성공
- [ ] 전체: TypeScript 타입 에러 0건
- [ ] 전체: 번들 크기 증가 기존 대비 +5KB 이내

### Verification Methods

| 검증 항목                      | 방법                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| 디자인 토큰 등록               | Tailwind 클래스 적용 후 브라우저 DevTools 색상 값 확인     |
| UI 프리미티브 렌더링           | Vitest + React Testing Library 단위 테스트                 |
| 하드코딩 색상 잔여 수          | `grep -r "#020912" src/ --include="*.tsx"` 카드 제외 결과  |
| 카드 내보내기 품질             | 마이그레이션 전후 PNG 비교 (수동 시각 검증)                |
| 반응형 레이아웃                | Chrome DevTools 반응형 모드 주요 브레이크포인트 검증       |
| 번들 크기                      | `npm run build` 후 빌드 출력 크기 비교                     |
| TypeScript 타입 안전성         | `npx tsc --noEmit` 전체 프로젝트 타입 체크                 |
| 포커스 링 통일성               | Tab 키 네비게이션으로 전체 페이지 포커스 순회               |

---

## Edge Cases

### Edge Case 1: html-to-image와 Tailwind 클래스 호환성

```gherkin
Given html-to-image가 DOM 요소를 캡처할 때 computed style을 사용한다
When 카드 외부 컴포넌트에서 Tailwind 유틸리티 클래스를 사용한다
Then 캡처 대상이 아닌 컴포넌트의 Tailwind 클래스는 정상 동작해야 한다
And 캡처 대상인 카드 컴포넌트는 인라인 스타일을 유지하여 캡처 품질에 영향이 없어야 한다
```

### Edge Case 2: Tailwind CSS v4 @theme과 기존 :root 변수 공존

```gherkin
Given globals.css에 :root 선택자와 @theme 디렉티브가 공존한다
When 동일한 CSS 커스텀 프로퍼티가 양쪽에 정의될 수 있다
Then @theme 디렉티브의 토큰이 Tailwind 유틸리티로 올바르게 해석되어야 한다
And :root 변수 참조(var(--color-primary))도 여전히 정상 동작해야 한다
And 두 방식 간 값 불일치가 없어야 한다
```

### Edge Case 3: 서버 컴포넌트에서 UI 프리미티브 사용

```gherkin
Given UI 프리미티브 컴포넌트가 'use client' 디렉티브를 포함한다
When 서버 컴포넌트에서 Button 컴포넌트를 import하여 사용한다
Then 서버/클라이언트 경계가 올바르게 처리되어야 한다
And 하이드레이션 에러가 발생하지 않아야 한다
```

### Edge Case 4: 동적 색상 값 처리

```gherkin
Given 일부 컴포넌트에서 사용자 입력에 따른 동적 색상 값(style={{ backgroundColor: userColor }})을 사용한다
When 해당 컴포넌트를 마이그레이션 대상으로 분류한다
Then 동적 색상 값은 인라인 스타일로 유지하고 마이그레이션 대상에서 제외해야 한다
And 주변의 정적 스타일만 디자인 토큰으로 교체해야 한다
```
