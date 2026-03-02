# SPEC-NAV-001: 구현 계획

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-NAV-001 |
| 제목 | Global Navigation Restructure - Bottom Tab + Top Nav |
| 상태 | draft |

---

## 1. 기술적 접근 방식

### 1.1 아키텍처 설계 방향

**컴포넌트 기반 분리 전략**: 글로벌 네비게이션을 독립적인 컴포넌트 디렉토리(`src/components/navigation/`)로 분리하여, 기존 페이지별 헤더와의 간섭을 최소화한다.

**조건부 렌더링 패턴**: `GlobalNav` 래퍼 컴포넌트가 인증 상태, 현재 경로, 관리자 여부를 판단하여 적절한 네비게이션을 렌더링한다.

**기존 코드 보존**: 기존 `UserMenu.tsx`, `CommunityNav.tsx`는 호환성을 유지하면서 새 컴포넌트에 기능을 이전한다.

### 1.2 핵심 기술 결정

| 결정 사항 | 선택 | 근거 |
|----------|------|------|
| 하단 탭바 위치 | `fixed bottom-0` | 스크롤과 무관하게 항상 표시 |
| 상단 네비게이션 위치 | `sticky top-0` | 스크롤 시 상단 고정 |
| 반응형 전환 | Tailwind `md:` breakpoint | 기존 프로젝트 패턴과 일관성 |
| 아이콘 | 인라인 SVG (Heroicons 스타일) | 기존 프로젝트 패턴 (외부 아이콘 라이브러리 미사용) |
| 드롭다운 | 커스텀 구현 (headlessui 미사용) | 번들 크기 최소화, 기존 패턴 일관성 |
| 커피챗 카운트 공유 | React Context | 중복 폴링 방지, 성능 최적화 |

### 1.3 컴포넌트 의존성 그래프

```
layout.tsx
  └── GlobalNav.tsx
        ├── TopNav.tsx
        │     ├── Logo (Link to /)
        │     ├── NavLinks (갤러리, 커뮤니티 + Badge)
        │     └── UserMenuDropdown.tsx
        │           ├── 아바타 + 이름
        │           └── 드롭다운 메뉴
        └── BottomTabBar.tsx
              ├── TabItem (홈)
              ├── TabItem (커뮤니티 + Badge)
              ├── TabItem (마이)
              └── TabItem (프로필)

의존 훅:
  ├── useAuth() - 인증 상태, 사용자 정보
  ├── usePathname() - 현재 경로
  └── useCoffeeChatCount() - 커피챗 배지 (Context로 공유)
```

---

## 2. 구현 마일스톤

### 마일스톤 1: 기반 인프라 구축 (Primary Goal)

**목표**: 글로벌 네비게이션 컴포넌트 기반 구조 생성 및 layout.tsx 통합

**태스크**:

1. `src/components/navigation/` 디렉토리 생성
2. `CoffeeChatCountProvider` Context 생성 (중복 폴링 방지)
   - `useCoffeeChatCount` 훅 로직을 Context로 이전
   - 기존 `useCoffeeChatCount` 훅은 Context 소비자로 리팩토링
3. `GlobalNav.tsx` 래퍼 컴포넌트 구현
   - 인증 상태 판단 로직
   - 경로 기반 렌더링 조건 (관리자, 인증 페이지 제외)
4. `src/app/layout.tsx` 수정
   - `GlobalNav` 삽입
   - `<main>` 래퍼에 조건부 하단 패딩 적용

**완료 조건**:
- GlobalNav가 layout.tsx에 통합됨
- 관리자 페이지에서 GlobalNav가 렌더링되지 않음
- 인증 페이지에서 GlobalNav가 렌더링되지 않음

### 마일스톤 2: 모바일 하단 탭바 구현 (Primary Goal)

**목표**: 4개 탭이 포함된 반응형 하단 탭바 완성

**태스크**:

1. `BottomTabBar.tsx` 구현
   - 4개 탭 (홈, 커뮤니티, 마이, 프로필)
   - SVG 아이콘 + 한국어 라벨
   - 활성 탭 표시자 (하단 밑줄 + 아이콘 색상 변경)
   - `md:hidden` 반응형 숨김
2. 커피챗 배지 통합
   - `CoffeeChatCountProvider`에서 카운트 소비
   - 커뮤니티 탭에 `NavBadge` 표시
3. 프로필 탭 동적 경로 구현
   - `useAuth()`에서 현재 사용자 ID 추출
   - `/profile/[currentUserId]`로 동적 링크 생성
4. 접근성 적용
   - `role="navigation"`, `aria-label`
   - `aria-current="page"` 활성 탭
   - 44px 최소 터치 영역
5. 콘텐츠 패딩 조정
   - 모바일에서 main 요소 하단에 `pb-16` 추가

**완료 조건**:
- 모바일에서 하단 탭바가 정상 표시됨
- 활성 탭 표시자가 정확히 동작함
- 커피챗 배지가 실시간 갱신됨
- 데스크톱에서 하단 탭바가 숨겨짐

### 마일스톤 3: 데스크톱 상단 네비게이션 구현 (Primary Goal)

**목표**: 로고, 네비게이션 링크, UserMenu 드롭다운이 포함된 상단 네비게이션 완성

**태스크**:

1. `TopNav.tsx` 구현
   - 로고 (Namecard 링크)
   - 갤러리 링크 (/cards)
   - 커뮤니티 링크 (/community/questions) + 배지
   - 활성 링크 표시자 (하단 밑줄)
   - `hidden md:flex` 반응형 표시
2. `UserMenuDropdown.tsx` 구현
   - 아바타 + 이름 (클릭 시 드롭다운 토글)
   - 드롭다운 메뉴: 내 프로필, 대시보드, 북마크, 설정, 로그아웃
   - 외부 클릭 시 드롭다운 닫기
   - 관리자 배지 표시
   - 키보드 네비게이션 (Escape로 닫기)
3. 미인증 상태 처리
   - 로고 + 로그인 버튼만 표시

**완료 조건**:
- 데스크톱에서 상단 네비게이션이 정상 표시됨
- UserMenu 드롭다운이 올바르게 동작함
- 모바일에서 상단 네비게이션이 숨겨짐

### 마일스톤 4: 기존 페이지 헤더 제거 및 통합 (Secondary Goal)

**목표**: 각 페이지의 독립적인 헤더를 제거하고 GlobalNav로 통합

**태스크**:

1. `src/app/dashboard/page.tsx` 수정
   - 기존 `<header>` + `<UserMenu>` 제거
   - 콘텐츠 영역만 유지
2. `src/app/gallery/page.tsx` 수정 (해당하는 경우)
   - 독립 헤더 제거
3. `src/components/landing/LandingPage.tsx` 수정
   - 인증 사용자: 기존 헤더 영역을 GlobalNav에 위임
   - 미인증 사용자: 기존 디자인 유지
4. 기타 페이지 (community, profile 등) 헤더 정리
   - GlobalNav와 중복되는 헤더 요소 제거
5. 기존 `UserMenu.tsx` 호환성 래퍼 유지
   - 관리자 페이지 등에서 여전히 사용 가능하도록 보존

**완료 조건**:
- 모든 비관리자 페이지에서 글로벌 네비게이션이 일관되게 표시됨
- 기존 헤더와 글로벌 네비게이션이 중복되지 않음
- 관리자 페이지는 기존 네비게이션 유지

### 마일스톤 5: 품질 보증 및 최적화 (Secondary Goal)

**목표**: 접근성, 성능, 크로스 브라우저 호환성 검증

**태스크**:

1. 접근성 검증
   - ARIA 속성 올바른 적용 확인
   - 키보드 네비게이션 테스트
   - 스크린 리더 호환성 확인
2. 반응형 테스트
   - 320px ~ 1440px 뷰포트 범위 테스트
   - 768px 경계에서의 전환 동작 확인
3. 성능 최적화
   - 커피챗 폴링 중복 방지 확인
   - 불필요한 리렌더링 방지 (`React.memo`, `useMemo`)
4. 레이아웃 시프트 검증
   - 네비게이션 표시/숨김 시 CLS 확인
   - 하단 패딩 적용 검증

**완료 조건**:
- 접근성 기본 요건 충족
- 레이아웃 시프트 없음
- 커피챗 폴링 중복 없음

---

## 3. 리스크 및 대응 방안

### 3.1 기술적 리스크

| 리스크 | 영향도 | 발생 가능성 | 대응 방안 |
|--------|-------|------------|----------|
| 기존 페이지 헤더 제거 시 레이아웃 깨짐 | 높음 | 중간 | 각 페이지별 단계적 마이그레이션, 시각적 회귀 테스트 |
| 커피챗 폴링 중복으로 인한 API 부하 | 중간 | 높음 | React Context로 단일 폴링 소스 보장 |
| 하단 탭바가 특정 페이지 콘텐츠를 가림 | 중간 | 중간 | 전역 패딩 적용 + 페이지별 커스텀 패딩 허용 |
| useAuth 훅의 user.id 부재 | 높음 | 낮음 | Supabase Auth의 user 객체에서 id 추출 방법 확인 필요 |

### 3.2 설계 리스크

| 리스크 | 영향도 | 발생 가능성 | 대응 방안 |
|--------|-------|------------|----------|
| 4개 탭으로 핵심 기능 커버가 불충분 | 중간 | 낮음 | 드롭다운/more 탭 추가 가능한 확장 구조 설계 |
| 관리자가 일반 네비게이션과 관리자 네비게이션 사이 전환 혼란 | 낮음 | 중간 | 관리자 페이지 진입 시 명확한 컨텍스트 전환 표시 |

---

## 4. 파일 생성/수정 목록

### 4.1 신규 생성 파일

| 파일 | 설명 |
|------|------|
| `src/components/navigation/GlobalNav.tsx` | 글로벌 네비게이션 래퍼 |
| `src/components/navigation/TopNav.tsx` | 데스크톱 상단 네비게이션 |
| `src/components/navigation/BottomTabBar.tsx` | 모바일 하단 탭바 |
| `src/components/navigation/UserMenuDropdown.tsx` | UserMenu 드롭다운 |
| `src/components/navigation/NavBadge.tsx` | 범용 배지 컴포넌트 |
| `src/components/navigation/CoffeeChatCountProvider.tsx` | 커피챗 카운트 Context |

### 4.2 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/app/layout.tsx` | GlobalNav 추가, CoffeeChatCountProvider 래핑 |
| `src/app/dashboard/page.tsx` | 독립 헤더(UserMenu 포함) 제거 |
| `src/components/landing/LandingPage.tsx` | 인증 사용자 헤더 조건부 처리 |
| `src/hooks/useCoffeeChatCount.ts` | Context 소비자로 리팩토링 (선택) |

### 4.3 보존 파일 (변경 없음)

| 파일 | 보존 이유 |
|------|----------|
| `src/app/admin/layout.tsx` | 관리자 네비게이션 독립 유지 |
| `src/components/community/CommunityNav.tsx` | 서브탭 네비게이션으로 기존 역할 유지 |
| `src/middleware.ts` | 라우트 보호 로직 변경 불필요 |
| `src/components/auth/UserMenu.tsx` | 호환성 래퍼로 보존 (admin 등에서 사용) |

---

## 5. 기술 스택 확인

이 SPEC 구현에 추가 라이브러리가 필요하지 않다:

- **아이콘**: 기존 프로젝트 패턴대로 인라인 SVG 사용 (Heroicons 스타일)
- **드롭다운**: 커스텀 구현 (외부 라이브러리 불필요)
- **애니메이션**: Tailwind CSS transition 유틸리티 사용
- **상태 관리**: React Context + 기존 useAuth 훅

---

## 6. 전문가 자문 권장

### 6.1 프론트엔드 전문가 (expert-frontend)

- 반응형 네비게이션 패턴 검토
- 드롭다운 접근성 구현 검증
- 레이아웃 시프트 방지 전략 확인

### 6.2 UI/UX 전문가 (expert-stitch)

- 하단 탭바 아이콘 및 라벨 디자인 검토
- 활성 상태 표시자 디자인 결정
- UserMenu 드롭다운 인터랙션 패턴 검토
