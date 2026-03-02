# SPEC-NAV-001: 글로벌 네비게이션 리스트럭처링 - 하단 탭 + 상단 네비게이션

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-NAV-001 |
| 제목 | Global Navigation Restructure - Bottom Tab + Top Nav |
| 상태 | draft |
| 우선순위 | High |
| 생성일 | 2026-03-02 |
| 관련 SPEC | SPEC-COMMUNITY-003, SPEC-COMMUNITY-004, SPEC-LINKBIO-001 |
| 라이프사이클 | spec-anchored |

---

## 1. 환경 (Environment)

### 1.1 현재 시스템 상태

- **프레임워크**: Next.js 16.1.6, React 19, TypeScript, Tailwind CSS 4
- **배포**: Cloudflare Workers (@opennextjs/cloudflare)
- **디자인 시스템**: 딥 네이비(#020912) + 오프 화이트(#fcfcfc), 0px border-radius, Figtree + Anonymous Pro 폰트
- **인증**: Supabase Auth (이메일/비밀번호 + Google OAuth)
- **기존 네비게이션**: 각 페이지에 독립적인 헤더 존재 (글로벌 네비게이션 없음)

### 1.2 현재 네비게이션 구조 분석

| 컴포넌트 | 위치 | 역할 | 문제점 |
|----------|------|------|--------|
| `UserMenu.tsx` | 각 페이지 헤더 내부 | 사용자 메뉴 (갤러리, 명함만들기, 내요청, 설정, 로그아웃) | 커뮤니티, 북마크, 프로필 링크 누락 |
| `CommunityNav.tsx` | /community/* 하위 페이지 | 질문/커피챗 탭 전환 | 커뮤니티 진입 경로가 불분명 |
| `admin/layout.tsx` | /admin/* 하위 페이지 | 관리자 전용 상단 네비게이션 | 별도 시스템으로 변경 불필요 |
| 각 페이지 헤더 | dashboard, gallery 등 | 로고 + UserMenu | 일관된 글로벌 네비게이션 부재 |

### 1.3 영향받는 페이지

- `/` (랜딩 페이지) - 인증 사용자만 네비게이션 표시
- `/cards` (갤러리)
- `/gallery` (갤러리/피드)
- `/community/questions` (질문 피드)
- `/community/questions/[id]` (질문 상세)
- `/community/coffee-chat` (커피챗 탐색)
- `/community/coffee-chat/my` (내 커피챗)
- `/dashboard` (사용자 대시보드)
- `/dashboard/[id]` (요청 상세)
- `/dashboard/settings` (설정)
- `/dashboard/bookmarks` (북마크)
- `/profile/[id]` (사용자 프로필)
- `/cards/[id]` (공개 명함)

### 1.4 영향받지 않는 페이지 (변경 없음)

- `/admin/*` (관리자 페이지 - 기존 admin/layout.tsx 유지)
- `/login`, `/signup`, `/confirm`, `/callback` (인증 페이지)

---

## 2. 가정 (Assumptions)

### 2.1 기술적 가정

- **A-01**: Tailwind CSS 4의 `md:` breakpoint (768px)가 모바일/데스크톱 분기점으로 적합하다.
  - 근거: 기존 프로젝트가 동일한 breakpoint를 반응형 디자인에 사용 중
  - 검증: 기존 컴포넌트(`MyRequestList` 등)에서 `sm:`, `md:` 활용 확인

- **A-02**: `usePathname()` Next.js 훅이 모든 라우트에서 안정적으로 현재 경로를 반환한다.
  - 근거: `CommunityNav.tsx`에서 이미 동일 패턴 사용 중
  - 위험: 낮음

- **A-03**: 하단 탭바의 고정 높이(약 64px)가 모바일 콘텐츠 영역을 충분히 확보한다.
  - 근거: iOS/Android 네이티브 앱 표준 탭바 높이 참조
  - 검증: 구현 시 실제 디바이스 테스트 필요

- **A-04**: `useCoffeeChatCount` 훅의 60초 폴링이 네비게이션 컴포넌트에서도 정상 작동한다.
  - 근거: 현재 `CommunityNav.tsx`에서 동일 훅 사용 중
  - 위험: 중복 폴링 발생 가능성 (동일 페이지에서 CommunityNav + GlobalNav 동시 렌더링)

### 2.2 비즈니스 가정

- **A-05**: 모바일 사용자 비율이 50% 이상으로, 하단 탭바가 UX에 큰 개선을 가져온다.
  - 검증: 배포 후 사용자 행동 분석 필요

- **A-06**: 탭 개수를 4개로 제한하면 정보 과부하 없이 핵심 기능에 접근할 수 있다.
  - 근거: 모바일 UX 모범 사례 (3-5개 탭 권장)

### 2.3 디자인 가정

- **A-07**: 기존 디자인 시스템(#020912/#fcfcfc, 0px border-radius, Figtree 폰트)을 네비게이션에도 일관 적용한다.
  - 근거: product.md의 "미니멀리스트/모던 갤러리 스타일" 유지 필요

---

## 3. 요구사항 (Requirements)

### 3.1 모바일 하단 탭바 (Mobile Bottom Tab Bar)

**REQ-NAV-001 [Ubiquitous]**
시스템은 항상 모바일 뷰포트(< 768px)에서 화면 하단에 고정된 탭바를 표시해야 한다.

**REQ-NAV-002 [Event-Driven]**
WHEN 인증된 사용자가 비관리자 페이지를 방문 THEN 시스템은 4개 탭을 포함한 하단 탭바를 렌더링해야 한다:
- 홈 (/cards) - 갤러리 아이콘 + "홈" 라벨
- 커뮤니티 (/community/questions) - 사람들 아이콘 + "커뮤니티" 라벨
- 마이페이지 (/dashboard) - 사용자 아이콘 + "마이" 라벨
- 프로필 (/profile/[id]) - 카드 아이콘 + "프로필" 라벨 (현재 로그인한 사용자의 프로필)

**REQ-NAV-003 [Event-Driven]**
WHEN 사용자가 현재 활성 경로에 해당하는 탭을 확인 THEN 해당 탭에 시각적 활성 표시자(하단 밑줄 또는 아이콘 채움)를 적용해야 한다.

**REQ-NAV-004 [Event-Driven]**
WHEN 커뮤니티 탭이 렌더링되고 커피챗 pending 수신 건수가 1 이상 THEN 커뮤니티 탭 아이콘 옆에 배지를 표시해야 한다.
- `useCoffeeChatCount` 훅을 재사용하여 60초 간격 폴링
- `CoffeeChatBadge` 컴포넌트 재사용

**REQ-NAV-005 [State-Driven]**
IF 현재 페이지가 관리자 페이지(/admin/*)이거나 인증 페이지(/login, /signup 등) THEN 하단 탭바를 숨겨야 한다.

**REQ-NAV-006 [State-Driven]**
IF 사용자가 미인증 상태 THEN 하단 탭바를 숨겨야 한다.

**REQ-NAV-007 [Ubiquitous]**
하단 탭바는 디자인 시스템을 준수해야 한다:
- 배경색: #fcfcfc (오프 화이트)
- 상단 보더: 1px solid rgba(2, 9, 18, 0.1)
- 아이콘 색상: 비활성 #020912/40, 활성 #020912
- 라벨 폰트: Figtree, text-xs (12px)
- 라벨 한국어 표기
- 0px border-radius 일관 적용
- 최소 터치 영역: 44px x 44px (접근성)

**REQ-NAV-008 [Ubiquitous]**
하단 탭바는 데스크톱 뷰포트(>= 768px)에서 `md:hidden` 클래스를 통해 숨겨야 한다.

### 3.2 데스크톱 상단 네비게이션 (Desktop Top Navigation)

**REQ-NAV-010 [Ubiquitous]**
시스템은 항상 데스크톱 뷰포트(>= 768px)에서 페이지 상단에 고정된 네비게이션 바를 표시해야 한다.

**REQ-NAV-011 [Event-Driven]**
WHEN 인증된 사용자가 비관리자 페이지를 방문 THEN 상단 네비게이션에 다음 요소를 표시해야 한다:
- 왼쪽: 로고 ("Namecard" 링크, / 이동)
- 중앙-좌: 갤러리 링크 (/cards)
- 중앙-좌: 커뮤니티 링크 (/community/questions) + 커피챗 배지
- 오른쪽: UserMenu 드롭다운

**REQ-NAV-012 [Event-Driven]**
WHEN 사용자가 UserMenu 드롭다운을 열기 THEN 다음 메뉴 항목을 표시해야 한다:
- 내 프로필 (/profile/[id]) - 현재 사용자 프로필로 이동
- 대시보드 (/dashboard) - 내 요청 현황
- 북마크 (/dashboard/bookmarks) - 북마크한 카드
- 설정 (/dashboard/settings) - 비밀번호 변경 등
- 로그아웃 - signOut() 실행

**REQ-NAV-013 [Event-Driven]**
WHEN 사용자가 현재 활성 경로에 해당하는 네비게이션 링크를 확인 THEN 해당 링크에 시각적 활성 표시자(하단 밑줄)를 적용해야 한다.

**REQ-NAV-014 [State-Driven]**
IF 사용자가 미인증 상태이고 공개 페이지를 방문 THEN 상단 네비게이션에 로고와 로그인 버튼만 표시해야 한다.

**REQ-NAV-015 [Ubiquitous]**
상단 네비게이션은 모바일 뷰포트(< 768px)에서 `hidden md:flex` 클래스를 통해 숨겨야 한다.

**REQ-NAV-016 [Ubiquitous]**
상단 네비게이션은 디자인 시스템을 준수해야 한다:
- 배경색: #fcfcfc 또는 white
- 하단 보더: 1px solid rgba(2, 9, 18, 0.1)
- 높이: 56px (h-14)
- 최대 너비: max-w-5xl (기존 페이지 레이아웃과 일관)
- 폰트: Figtree
- 0px border-radius

### 3.3 반응형 동작 (Responsive Behavior)

**REQ-NAV-020 [Ubiquitous]**
시스템은 항상 모바일과 데스크톱 네비게이션 간 전환 시 레이아웃 시프트가 발생하지 않아야 한다.

**REQ-NAV-021 [Ubiquitous]**
모바일에서 하단 탭바가 표시될 때, 페이지 콘텐츠 하단에 탭바 높이만큼의 패딩을 추가하여 콘텐츠 가림을 방지해야 한다.

**REQ-NAV-022 [Ubiquitous]**
네비게이션 전환(뷰포트 크기 변경)은 부드러운 트랜지션을 적용하여 시각적 끊김이 없어야 한다.

### 3.4 통합 요구사항 (Integration Requirements)

**REQ-NAV-030 [State-Driven]**
IF 사용자가 /community/* 하위 페이지에 있고 CommunityNav가 렌더링 THEN 하단 탭바의 커뮤니티 탭은 활성 상태를 표시하고, CommunityNav(질문/커피챗 서브탭)는 기존대로 동작해야 한다.

**REQ-NAV-031 [State-Driven]**
IF 현재 페이지가 /admin/* THEN 글로벌 네비게이션(상단+하단 모두)을 렌더링하지 않고 기존 admin/layout.tsx의 네비게이션을 유지해야 한다.

**REQ-NAV-032 [Event-Driven]**
WHEN 미인증 사용자가 랜딩 페이지(/)를 방문 THEN 기존 랜딩 페이지 디자인을 유지하고 글로벌 네비게이션을 표시하지 않아야 한다.

**REQ-NAV-033 [Event-Driven]**
WHEN 인증 사용자가 랜딩 페이지(/)를 방문 THEN 글로벌 네비게이션(상단 네비게이션 + 하단 탭바)을 표시해야 한다.

**REQ-NAV-034 [Event-Driven]**
WHEN 프로필 탭을 클릭 THEN 현재 로그인한 사용자의 자신의 프로필 페이지(/profile/[currentUserId])로 이동해야 한다.

### 3.5 접근성 요구사항 (Accessibility)

**REQ-NAV-040 [Ubiquitous]**
네비게이션 컴포넌트는 ARIA 속성을 올바르게 적용해야 한다:
- `<nav>` 요소에 `role="navigation"`, `aria-label` 적용
- 활성 탭에 `aria-current="page"` 적용
- 배지에 `aria-label`로 수신 건수 텍스트 제공

**REQ-NAV-041 [Ubiquitous]**
모든 네비게이션 요소는 키보드 네비게이션(Tab, Enter, Space)을 지원해야 한다.

**REQ-NAV-042 [Ubiquitous]**
하단 탭바의 각 탭은 최소 44px x 44px 터치 영역을 보장해야 한다.

### 3.6 금지 요구사항 (Unwanted Behavior)

**REQ-NAV-050 [Unwanted]**
시스템은 동일 페이지에서 `useCoffeeChatCount` 훅이 두 번 이상 폴링하지 않아야 한다.
- 대안: 커피챗 카운트를 상위 컴포넌트에서 한 번만 호출하고 prop으로 전달

**REQ-NAV-051 [Unwanted]**
시스템은 페이지 전환 시 네비게이션 컴포넌트가 깜빡이거나 리렌더링되지 않아야 한다.

**REQ-NAV-052 [Unwanted]**
시스템은 하단 탭바가 표시되는 페이지에서 콘텐츠가 탭바에 의해 가려지지 않아야 한다.

---

## 4. 명세 (Specifications)

### 4.1 컴포넌트 아키텍처

```
src/components/navigation/
  |- GlobalNav.tsx          # 상위 래퍼 - 인증 상태/경로 기반 조건부 렌더링
  |- TopNav.tsx             # 데스크톱 상단 네비게이션 (hidden md:flex)
  |- BottomTabBar.tsx       # 모바일 하단 탭바 (md:hidden)
  |- UserMenuDropdown.tsx   # 데스크톱 UserMenu 드롭다운 (기존 UserMenu.tsx 리팩토링)
  |- NavBadge.tsx           # 범용 배지 컴포넌트 (CoffeeChatBadge 기반 확장)
```

### 4.2 GlobalNav 컴포넌트 명세

```typescript
// src/components/navigation/GlobalNav.tsx
'use client';

interface GlobalNavProps {
  // 없음 - 내부적으로 useAuth, usePathname, useCoffeeChatCount 사용
}

// 렌더링 조건:
// 1. 미인증 + 공개 페이지: TopNav(로고 + 로그인 버튼만)
// 2. 인증 + 비관리자 페이지: TopNav(풀) + BottomTabBar
// 3. 관리자 페이지 (/admin/*): 렌더링 안 함
// 4. 인증 페이지 (/login, /signup 등): 렌더링 안 함
// 5. 미인증 + 랜딩 페이지 (/): 렌더링 안 함
```

### 4.3 BottomTabBar 탭 구성

| 순서 | 라벨 | 경로 | 아이콘 | 활성 조건 | 배지 |
|------|------|------|--------|-----------|------|
| 1 | 홈 | /cards | HomeIcon (집 아이콘) | pathname === '/cards' 또는 pathname.startsWith('/cards/') | - |
| 2 | 커뮤니티 | /community/questions | UsersIcon (사람들 아이콘) | pathname.startsWith('/community') | 커피챗 pending count |
| 3 | 마이 | /dashboard | ListIcon (목록 아이콘) | pathname.startsWith('/dashboard') | - |
| 4 | 프로필 | /profile/[currentUserId] | UserIcon (사용자 아이콘) | pathname.startsWith('/profile') | - |

### 4.4 TopNav 구조

```
|-----------------------------------------------------------------------|
| [Logo: Namecard]   [갤러리]  [커뮤니티 + Badge]    [spacer]  [UserMenu ▼] |
|-----------------------------------------------------------------------|
```

### 4.5 UserMenuDropdown 메뉴 항목

| 순서 | 라벨 | 경로 | 아이콘 |
|------|------|------|--------|
| 1 | 내 프로필 | /profile/[currentUserId] | UserCircle |
| 2 | 대시보드 | /dashboard | LayoutGrid |
| 3 | 북마크 | /dashboard/bookmarks | Bookmark |
| 4 | 설정 | /dashboard/settings | Settings |
| 구분선 | --- | --- | --- |
| 5 | 로그아웃 | signOut() | LogOut |

### 4.6 레이아웃 통합 방법

`GlobalNav`를 `src/app/layout.tsx`의 `AuthProvider` 내부에 배치한다:

```tsx
// src/app/layout.tsx (수정 후)
<body className="min-h-screen bg-[#fcfcfc]">
  <AuthProvider>
    <KakaoProvider>
      <ToastProvider>
        <GlobalNav />
        <main>{children}</main>
      </ToastProvider>
    </KakaoProvider>
  </AuthProvider>
</body>
```

### 4.7 기존 코드 영향도

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/app/layout.tsx` | 수정 | GlobalNav 추가, main 래퍼 추가 |
| `src/components/auth/UserMenu.tsx` | 리팩토링 | UserMenuDropdown으로 기능 이전, 기존 UserMenu는 호환성 래퍼로 유지 |
| `src/app/dashboard/page.tsx` | 수정 | 독립 헤더 제거, GlobalNav로 대체 |
| `src/app/gallery/page.tsx` | 수정 | 독립 헤더 제거 |
| `src/components/community/CommunityNav.tsx` | 유지 | 기존 서브탭 네비게이션 그대로 유지 |
| `src/middleware.ts` | 유지 | 변경 없음 |
| `src/app/admin/layout.tsx` | 유지 | 변경 없음 |
| `src/components/landing/LandingPage.tsx` | 조건부 수정 | 인증 사용자일 때 기존 헤더 숨김 처리 |

### 4.8 커피챗 카운트 중복 폴링 방지

`useCoffeeChatCount`가 GlobalNav와 CommunityNav에서 중복 호출되는 것을 방지하기 위해:

- 방법 A (권장): React Context로 커피챗 카운트를 상위에서 한 번만 호출하고 하위에 공유
- 방법 B: CommunityNav에서 직접 호출 대신 prop으로 카운트를 전달받도록 수정

### 4.9 모바일 콘텐츠 패딩

하단 탭바 높이: `h-16` (64px)
모바일에서 콘텐츠 하단 패딩: `pb-16` (64px) - GlobalNav가 main 요소에 조건부 적용

---

## 5. 추적성 (Traceability)

| 요구사항 | 구현 컴포넌트 | 테스트 시나리오 |
|----------|--------------|----------------|
| REQ-NAV-001 ~ 008 | BottomTabBar.tsx | AC-001 ~ AC-008 |
| REQ-NAV-010 ~ 016 | TopNav.tsx | AC-010 ~ AC-016 |
| REQ-NAV-020 ~ 022 | GlobalNav.tsx, layout.tsx | AC-020 ~ AC-022 |
| REQ-NAV-030 ~ 034 | GlobalNav.tsx | AC-030 ~ AC-034 |
| REQ-NAV-040 ~ 042 | 전체 네비게이션 | AC-040 ~ AC-042 |
| REQ-NAV-050 ~ 052 | GlobalNav.tsx, Context | AC-050 ~ AC-052 |
