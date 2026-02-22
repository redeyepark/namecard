# 프로젝트 구조

## 디렉토리 트리

```
namecard/
├── src/
│   ├── middleware.ts                           # Supabase 세션 갱신 미들웨어 (라우트 보호)
│   ├── app/                               # Next.js App Router
│   │   ├── layout.tsx                     # Root layout (AuthProvider 래핑)
│   │   ├── page.tsx                       # 랜딩 페이지 (LandingPage 컴포넌트)
│   │   ├── globals.css                    # Tailwind CSS 4 + 커스텀 스타일
│   │   ├── login/
│   │   │   └── page.tsx                   # 로그인 페이지 (이메일/비밀번호 + Google OAuth)
│   │   ├── signup/
│   │   │   └── page.tsx                   # 회원가입 페이지
│   │   ├── confirm/
│   │   │   └── page.tsx                   # 이메일 인증 확인 페이지
│   │   ├── callback/
│   │   │   └── route.ts                   # OAuth 콜백 핸들러 (코드 교환)
│   │   ├── create/
│   │   │   ├── layout.tsx                 # Create 레이아웃
│   │   │   ├── page.tsx                   # 위저드 기반 명함 제작 (useAuth)
│   │   │   └── edit/
│   │   │       └── page.tsx               # 카드 편집기 (2-column 반응형 레이아웃)
│   │   ├── dashboard/
│   │   │   ├── page.tsx                   # 사용자 대시보드 (내 요청 목록)
│   │   │   └── [id]/
│   │   │       └── page.tsx               # 사용자 요청 상세 (읽기 전용)
│   │   ├── admin/
│   │   │   ├── layout.tsx                 # Admin 레이아웃 (UserMenu, 인증 확인)
│   │   │   ├── page.tsx                   # 관리자 대시보드 (요청 목록)
│   │   │   └── [id]/
│   │   │       └── page.tsx               # 요청 상세 (상태 관리, 일러스트 업로드)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── me/
│   │       │       └── route.ts           # 사용자 정보 + isAdmin 상태 API
│   │       ├── admin/
│   │       │   └── bulk-upload/
│   │       │       └── route.ts           # POST (CSV 대량 등록, requireAdmin, 이메일 자동 회원가입)
│   │       └── requests/
│   │           ├── route.ts               # POST (요청 생성, requireAuth), GET (목록, requireAdmin)
│   │           ├── my/
│   │           │   └── route.ts           # GET (사용자 본인 요청 목록, requireAuth)
│   │           └── [id]/
│   │               └── route.ts           # GET (상세, requireAuth + 소유권 검증), PATCH (수정, requireAdmin)
│   ├── components/
│   │   ├── auth/                          # 인증 관련 컴포넌트
│   │   │   ├── AuthProvider.tsx           # Supabase onAuthStateChange 컨텍스트 (useAuth 훅)
│   │   │   ├── LoginButton.tsx            # 로그인/로그아웃 버튼 (useAuth)
│   │   │   └── UserMenu.tsx               # 사용자 정보 + 관리자 배지 + 로그아웃 (useAuth)
│   │   ├── landing/                       # 랜딩 페이지 컴포넌트
│   │   │   └── LandingPage.tsx            # 인증 상태 기반 CTA가 있는 랜딩 페이지
│   │   ├── card/                          # 카드 미리보기 컴포넌트
│   │   │   ├── CardFront.tsx              # 앞면 미리보기
│   │   │   ├── CardBack.tsx               # 뒷면 미리보기
│   │   │   └── CardPreview.tsx            # 프리뷰 컨테이너 (플립 애니메이션)
│   │   ├── editor/                        # 편집기 폼 컴포넌트
│   │   │   ├── EditorPanel.tsx            # 편집기 패널 컨테이너
│   │   │   ├── FrontEditor.tsx            # 앞면 편집 필드
│   │   │   ├── BackEditor.tsx             # 뒷면 편집 필드
│   │   │   ├── ImageUploader.tsx          # 이미지 업로드 (드래그 앤 드롭, 5MB 제한)
│   │   │   ├── ColorPicker.tsx            # react-colorful 래퍼
│   │   │   ├── TextColorPicker.tsx        # 텍스트 색상 선택기 (화이트/블랙 2옵션)
│   │   │   ├── HashtagEditor.tsx          # 해시태그 태그 관리
│   │   │   └── SocialLinkEditor.tsx       # 소셜 링크 CRUD
│   │   ├── export/                        # 내보내기 컴포넌트
│   │   │   └── ExportButton.tsx           # PNG 내보내기 (2x 해상도)
│   │   ├── ui/                            # 범용 UI 컴포넌트
│   │   │   ├── TabSwitch.tsx              # 앞면/뒷면 탭 전환
│   │   │   └── ResetButton.tsx            # 확인 단계 포함 초기화 버튼
│   │   ├── wizard/                        # 명함 제작 위저드 컴포넌트
│   │   │   ├── WizardContainer.tsx        # 멀티 스텝 위저드 컨테이너
│   │   │   ├── ProgressBar.tsx            # 단계 진행률 표시기
│   │   │   ├── StepNavigation.tsx         # 이전/다음 네비게이션
│   │   │   ├── PersonalInfoStep.tsx       # Step 1: 이름, 직함, 회사
│   │   │   ├── PhotoUploadStep.tsx        # Step 2: 아바타 업로드, 배경색/텍스트 색상 선택
│   │   │   ├── SocialTagStep.tsx          # Step 3: 소셜 링크, 해시태그
│   │   │   ├── PreviewStep.tsx            # Step 4: 카드 미리보기
│   │   │   ├── RequestSubmitStep.tsx      # Step 5: 제작 요청 제출
│   │   │   ├── CompleteStep.tsx           # Step 6: 완료
│   │   │   └── MiniPreview.tsx            # 위저드 내 미니 카드 미리보기
│   │   ├── dashboard/                     # 사용자 대시보드 컴포넌트
│   │   │   ├── ProgressStepper.tsx        # 3단계 진행 상태 인디케이터 (의뢰됨/작업중/확정)
│   │   │   ├── MyRequestList.tsx          # 반응형 요청 목록 (모바일: 카드 / 데스크톱: 테이블)
│   │   │   ├── RequestCard.tsx            # 모바일용 요청 카드 컴포넌트
│   │   │   ├── EmptyState.tsx             # 요청 없음 안내 + "명함 만들기" CTA
│   │   │   └── MyRequestDetail.tsx        # 요청 상세 뷰 (읽기 전용)
│   │   └── admin/                         # 관리자 컴포넌트
│   │       ├── RequestList.tsx            # 관리자 요청 목록 테이블
│   │       ├── RequestDetail.tsx          # 요청 상세 뷰
│   │       ├── StatusBadge.tsx            # 상태 배지 컴포넌트
│   │       ├── StatusHistory.tsx          # 상태 변경 이력
│   │       ├── CardCompare.tsx            # 원본 vs 일러스트 비교 (외부 URL 이미지 에러 핸들링 포함)
│   │       ├── IllustrationUploader.tsx   # 일러스트 이미지 업로드 (파일 업로드 + 외부 URL 입력)
│   │       └── BulkUploadModal.tsx        # CSV/Excel 대량 등록 모달 (SheetJS 변환 지원)
│   ├── stores/
│   │   ├── useCardStore.ts                # Zustand store (persist middleware)
│   │   └── __tests__/
│   │       └── useCardStore.test.ts       # Store 단위 테스트
│   ├── types/
│   │   ├── card.ts                        # 카드 타입 (CardData, SocialLink 등)
│   │   └── request.ts                     # 요청 타입 (CardRequest, RequestStatus, createdBy)
│   ├── lib/
│   │   ├── supabase.ts                    # 서버 Supabase 클라이언트 (service role key)
│   │   ├── supabase-auth.ts               # 브라우저 Supabase 클라이언트 (anon key)
│   │   ├── auth-utils.ts                  # 서버 인증 유틸리티 (requireAuth, requireAdmin, AuthError, isAdmin)
│   │   ├── storage.ts                     # Supabase DB/Storage 연산 (saveRequest, getRequest, updateRequest 등)
│   │   ├── export.ts                      # html-to-image PNG 내보내기 유틸리티
│   │   └── validation.ts                  # 이미지 파일 검증 + Base64 변환
│   └── test/
│       └── setup.ts                       # Vitest 테스트 환경 설정
├── .moai/                                 # MoAI-ADK 설정
│   ├── config/                            # 프로젝트 설정 파일
│   │   └── sections/                      # 설정 섹션 (quality, user, language)
│   ├── project/                           # 프로젝트 문서
│   └── specs/                             # SPEC 문서
│       ├── SPEC-UI-001/                   # Namecard Editor SPEC
│       └── SPEC-DASHBOARD-001/            # User Dashboard SPEC
├── .claude/                               # Claude Code 설정
│   ├── agents/                            # Sub-agent 정의
│   ├── commands/                          # Slash commands
│   ├── rules/                             # Project rules
│   │   └── moai/                          # MoAI-specific rules
│   └── skills/                            # Skills 정의
├── .github/                               # GitHub 설정
│   └── workflows/
│       └── deploy.yml                     # Cloudflare Workers 배포 CI/CD
├── _AEC/                                  # 참조용 디자인 에셋
├── public/                                # Static assets
├── package.json                           # 프로젝트 의존성 및 스크립트
├── tsconfig.json                          # TypeScript 설정
├── next.config.ts                         # Next.js 설정
├── postcss.config.mjs                     # PostCSS 설정 (Tailwind CSS 4)
├── eslint.config.mjs                      # ESLint 9 설정
├── vitest.config.mts                      # Vitest 테스트 설정
├── wrangler.jsonc                         # Cloudflare Workers 설정
└── CLAUDE.md                              # MoAI Execution Directive
```

## 아키텍처 패턴

### 풀스택 애플리케이션 (Next.js App Router + Supabase)

이 프로젝트는 Next.js 16의 App Router를 사용하는 풀스택 웹 애플리케이션입니다. 서버 컴포넌트와 클라이언트 컴포넌트를 혼합하여 사용하며, API Routes(`src/app/api/`)를 통해 서버 사이드 비즈니스 로직을 처리합니다. Supabase를 Backend-as-a-Service로 활용하여 인증, PostgreSQL 데이터베이스, 파일 스토리지를 통합 관리합니다.

### 데이터 흐름

```
[사용자 입력 흐름]
User Input -> Wizard Steps -> API POST /api/requests -> Supabase DB (card_requests 테이블)
                                                     -> Supabase Storage (avatars 버킷)

[사용자 대시보드 흐름]
User Login -> UserMenu "내 요청" -> /dashboard -> GET /api/requests/my -> Supabase DB (created_by 필터)
User -> /dashboard/[id] -> GET /api/requests/[id] -> 소유권 검증 -> 상세 렌더링

[관리자 흐름]
Admin -> /admin 대시보드 -> API GET /api/requests -> Supabase DB
Admin -> /admin/[id] -> PATCH /api/requests/[id] -> 상태 업데이트 + 일러스트 업로드
Admin -> BulkUploadModal -> CSV/Excel 파일 선택 -> xlsx 변환 -> POST /api/admin/bulk-upload -> Supabase DB (대량 생성) + Supabase Auth (이메일 자동 등록)

[카드 편집기 흐름]
Card Editor -> Zustand Store -> localStorage (persist) -> html-to-image -> PNG 다운로드
```

1. 사용자가 위저드에서 명함 정보를 입력하면 API를 통해 Supabase DB에 저장됩니다.
2. 아바타 이미지는 Supabase Storage(avatars 버킷)에 업로드됩니다.
3. 관리자가 대시보드에서 요청을 검토하고 상태를 관리합니다.
4. 관리자가 일러스트를 업로드하면 Supabase Storage(illustrations 버킷)에 저장됩니다.
5. 카드 편집기에서는 Zustand Store가 로컬 상태를 관리하고 localStorage에 자동 저장합니다.
6. 내보내기 시 html-to-image가 DOM 요소를 캡처하여 PNG로 변환합니다.

### 인증 및 권한 구조

- `middleware.ts`: 모든 요청에 대해 Supabase 세션 자동 갱신
- `AuthProvider`: `onAuthStateChange` 리스너로 클라이언트 인증 상태 관리
- `requireAuth`: API 라우트에서 인증 사용자만 접근 허용
- `requireAdmin`: API 라우트에서 관리자만 접근 허용 (ADMIN_EMAILS 환경변수 기반)

## 컴포넌트 계층 구조

```
layout.tsx (Root - AuthProvider 래핑)
├── page.tsx (Landing)
│   └── LandingPage                # 인증 상태 기반 CTA 랜딩 페이지
│
├── login/page.tsx (Login)
│   ├── LoginButton                # 이메일/비밀번호 로그인 폼
│   └── Google OAuth               # Google 소셜 로그인
│
├── signup/page.tsx (Signup)       # 회원가입 폼
│
├── create/page.tsx (Wizard)       # 명함 제작 위저드
│   └── WizardContainer
│       ├── ProgressBar            # 단계 진행률
│       ├── PersonalInfoStep       # Step 1: 개인 정보
│       ├── PhotoUploadStep        # Step 2: 사진 업로드
│       ├── SocialTagStep          # Step 3: 소셜/태그
│       ├── PreviewStep            # Step 4: 미리보기
│       │   └── MiniPreview        # 미니 카드 미리보기
│       ├── RequestSubmitStep      # Step 5: 제작 요청
│       ├── CompleteStep           # Step 6: 완료
│       └── StepNavigation         # 이전/다음 버튼
│
├── create/edit/page.tsx (Editor)  # 카드 편집기
│   ├── CardPreview
│   │   ├── CardFront              # 앞면 미리보기
│   │   └── CardBack               # 뒷면 미리보기
│   ├── TabSwitch                  # 앞면/뒷면 탭 전환
│   ├── EditorPanel
│   │   ├── FrontEditor            # 앞면 편집
│   │   │   ├── ImageUploader      # 이미지 업로드
│   │   │   ├── ColorPicker        # 배경색 선택
│   │   │   └── TextColorPicker    # 텍스트 색상 선택
│   │   └── BackEditor             # 뒷면 편집
│   │       ├── HashtagEditor      # 해시태그 관리
│   │       ├── SocialLinkEditor   # 소셜 링크 관리
│   │       ├── ColorPicker        # 배경색 선택
│   │       └── TextColorPicker    # 텍스트 색상 선택
│   ├── ExportButton               # PNG 내보내기
│   └── ResetButton                # 초기화
│
├── dashboard/page.tsx (User Dashboard) # 사용자 대시보드
│   ├── UserMenu                   # 사용자 메뉴 ("내 요청" 링크 포함)
│   ├── MyRequestList              # 반응형 요청 목록
│   │   ├── RequestCard            # 모바일 카드 뷰
│   │   ├── ProgressStepper        # 3단계 진행 상태 (의뢰됨/작업중/확정)
│   │   └── StatusBadge            # 상태 배지 (재사용)
│   └── EmptyState                 # 요청 없음 안내 + CTA
│
├── dashboard/[id]/page.tsx (User Detail) # 사용자 요청 상세
│   ├── MyRequestDetail            # 읽기 전용 요청 상세 뷰
│   ├── ProgressStepper            # 진행 상태 시각화
│   ├── StatusHistory              # 상태 변경 이력 (재사용)
│   └── CardCompare                # 원본 vs 일러스트 비교 (재사용)
│
├── admin/page.tsx (Dashboard)     # 관리자 대시보드
│   ├── UserMenu                   # 사용자 메뉴 + 관리자 배지
│   ├── BulkUploadModal            # CSV/Excel 대량 등록 모달
│   └── RequestList                # 요청 목록 테이블
│       └── StatusBadge            # 상태 배지
│
└── admin/[id]/page.tsx (Detail)   # 요청 상세
    ├── RequestDetail              # 요청 상세 뷰
    ├── StatusHistory              # 상태 변경 이력
    ├── CardCompare                # 원본 vs 일러스트 비교
    └── IllustrationUploader       # 일러스트 업로드
```

## 주요 디렉토리 설명

| 디렉토리 | 설명 |
|----------|------|
| `src/middleware.ts` | Supabase 세션 갱신 미들웨어 (Next.js 16 호환) |
| `src/app/` | Next.js App Router 기반 페이지, 레이아웃, API 라우트 |
| `src/app/api/` | REST API 엔드포인트 (인증, 요청 CRUD) |
| `src/app/login/`, `signup/`, `confirm/`, `callback/` | 인증 관련 페이지 |
| `src/app/create/` | 명함 제작 위저드 및 카드 편집기 |
| `src/app/dashboard/` | 사용자 대시보드 (내 요청 목록, 요청 상세) |
| `src/app/admin/` | 관리자 대시보드 및 요청 상세 페이지 |
| `src/components/auth/` | 인증 관련 컴포넌트 (AuthProvider, LoginButton, UserMenu) |
| `src/components/landing/` | 랜딩 페이지 컴포넌트 |
| `src/components/card/` | 명함 미리보기 렌더링 컴포넌트 |
| `src/components/editor/` | 명함 편집 폼 컴포넌트 |
| `src/components/export/` | PNG 이미지 내보내기 관련 컴포넌트 |
| `src/components/ui/` | 범용 UI 컴포넌트 (탭, 버튼) |
| `src/components/wizard/` | 6단계 명함 제작 위저드 컴포넌트 |
| `src/components/dashboard/` | 사용자 대시보드 컴포넌트 (ProgressStepper, MyRequestList, RequestCard, EmptyState, MyRequestDetail) |
| `src/components/admin/` | 관리자 대시보드 컴포넌트 (BulkUploadModal, IllustrationUploader 등) |
| `src/stores/` | Zustand 상태 관리 (localStorage persist 포함) |
| `src/types/` | TypeScript 타입 정의 (카드, 요청) |
| `src/lib/` | 유틸리티 함수 (Supabase 클라이언트, 인증, 스토리지, 내보내기, 검증). `storage.ts`에 `getRequestsByUser(email)` 함수 포함 |
| `src/test/` | 테스트 환경 설정 |
| `.github/workflows/` | GitHub Actions CI/CD 워크플로우 (Cloudflare Workers 배포) |

## 파일 수 현황

| 카테고리 | 파일 수 |
|---------|--------|
| 페이지/레이아웃 (`.tsx` in `app/`) | 13 |
| API 라우트 (`.ts` in `app/api/`) | 5 |
| React 컴포넌트 (`.tsx` in `components/`) | 34 |
| Zustand Store (`.ts` in `stores/`) | 1 |
| 타입 정의 (`.ts` in `types/`) | 2 |
| 유틸리티 (`.ts` in `lib/`) | 6 |
| 미들웨어 (`.ts`) | 1 |
| 테스트 (`.ts`, `.test.ts`) | 2 |
| 스타일시트 (`.css`) | 1 |
| 총 소스 파일 | 64 |
