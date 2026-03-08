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
│   │   │   ├── page.tsx                   # 위저드 기반 명함 제작 (임시 /dashboard 리다이렉트)
│   │   │   └── edit/
│   │   │       └── page.tsx               # 카드 편집기 (임시 /dashboard 리다이렉트)
│   │   ├── dashboard/
│   │   │   ├── page.tsx                   # 사용자 대시보드 (내 요청 목록)
│   │   │   ├── settings/
│   │   │   │   └── page.tsx               # 사용자 설정 페이지 (비밀번호 변경)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx               # 사용자 요청 상세 (확정 버튼, 편집 폼 "저장 후 확정" 포함)
│   │   │   └── bookmarks/
│   │   │       └── page.tsx               # 북마크한 카드 목록 페이지
│   │   ├── cards/
│   │   │   └── [id]/
│   │   │       ├── page.tsx               # 공개 명함 페이지 (Server Component, OG 메타데이터)
│   │   │       └── PublicCardView.tsx      # 공개 명함 뷰 (vCard 다운로드 버튼)
│   │   ├── gallery/
│   │   │   └── page.tsx                   # 공개 명함 갤러리 (이벤트별 그룹)
│   │   ├── admin/
│   │   │   ├── layout.tsx                 # Admin 레이아웃 (UserMenu, 인증 확인)
│   │   │   ├── page.tsx                   # 관리자 대시보드 (요청 목록, 현황 통계)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx               # 요청 상세 (상태 관리, 일러스트 업로드)
│   │   │   ├── themes/
│   │   │   │   └── page.tsx               # 테마 관리 페이지 (미리보기, 통계, 일괄 적용)
│   │   │   ├── events/
│   │   │   │   └── page.tsx               # 이벤트 관리 페이지
│   │   │   ├── members/
│   │   │   │   └── page.tsx               # 회원 관리 페이지
│   │   │   ├── print/
│   │   │   │   └── page.tsx               # 인쇄 주문 관리 페이지
│   │   │   └── login/
│   │   │       ├── layout.tsx             # 관리자 로그인 레이아웃
│   │   │       └── page.tsx               # 관리자 로그인 페이지
│   │   ├── community/
│   │   │   ├── questions/
│   │   │   │   ├── page.tsx               # 질문 피드 페이지 (해시태그 필터, 무한 스크롤)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx           # 질문 상세 페이지 (생각 목록, 좋아요)
│   │   │   │       └── QuestionDetailActions.tsx # 질문 상세 액션 (삭제 등)
│   │   │   ├── surveys/
│   │   │   │   ├── page.tsx               # 설문/투표 피드 페이지
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # 설문 상세 페이지
│   │   │   └── coffee-chat/
│   │   │       ├── page.tsx               # 커피챗 탐색 페이지 (회원 그리드)
│   │   │       ├── CoffeeChatDiscoverClient.tsx # 커피챗 탐색 클라이언트
│   │   │       └── my/
│   │   │           ├── page.tsx           # 내 커피챗 목록 페이지
│   │   │           └── MyCoffeeChatClient.tsx # 내 커피챗 클라이언트
│   │   ├── profile/
│   │   │   └── [id]/
│   │   │       ├── page.tsx               # 사용자 프로필 페이지 (Server Component, Link-in-Bio 스타일)
│   │   │       └── ProfileClient.tsx      # 프로필 클라이언트 컴포넌트 (소셜 아이콘, 링크 목록)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── me/
│   │       │       └── route.ts           # 사용자 정보 + isAdmin 상태 API
│   │       ├── events/
│   │       │   └── route.ts               # 이벤트 CRUD API
│   │       ├── admin/
│   │       │   ├── migrate/
│   │       │   │   └── route.ts           # DB 마이그레이션 상태 확인 API
│   │       │   ├── bulk-upload/
│   │       │   │   └── route.ts           # POST (CSV 대량 등록, requireAdmin, 이메일 자동 회원가입, extractSocialHandle)
│   │       │   ├── themes/
│   │       │   │   └── route.ts           # GET (테마별 의뢰 통계), PATCH (일괄 테마 적용)
│   │       │   ├── events/
│   │       │   │   └── [id]/
│   │       │   │       └── cards/
│   │       │   │           └── route.ts   # GET (이벤트별 카드 데이터, requireAdminToken)
│   │       │   ├── custom-themes/
│   │       │   │   ├── route.ts           # GET/POST (커스텀 테마 목록/생성, requireAdmin)
│   │       │   │   └── [id]/
│   │       │   │       └── route.ts       # GET/PUT/DELETE (커스텀 테마 상세/수정/삭제, requireAdmin)
│   │       │   ├── print/
│   │       │   │   ├── quote/
│   │       │   │   │   └── route.ts       # POST (Gelato 견적 조회, requireAdminToken)
│   │       │   │   ├── orders/
│   │       │   │   │   ├── route.ts       # POST/GET (인쇄 주문 생성/목록, requireAdminToken)
│   │       │   │   │   └── [id]/
│   │       │   │   │       └── route.ts   # GET/PATCH (주문 상태/확정, requireAdminToken)
│   │       │   │   ├── products/
│   │       │   │   │   └── route.ts       # GET (Gelato 제품 정보, requireAdminToken)
│   │       │   │   ├── shipping-methods/
│   │       │   │   │   └── route.ts       # GET (배송 방법 목록, requireAdminToken)
│   │       │   │   └── pdf/
│   │       │   │       └── route.ts       # POST (PDF 업로드 → Supabase Storage, requireAdminToken)
│   │       │   ├── login/
│   │       │   │   └── route.ts           # 관리자 로그인 API
│   │       │   ├── questions/
│   │       │   │   ├── route.ts           # GET/POST (관리자 질문 목록/생성, requireAdmin)
│   │       │   │   └── [id]/
│   │       │   │       └── route.ts       # PUT/DELETE (관리자 질문 수정/삭제, requireAdmin)
│   │       │   └── logout/
│   │       │       └── route.ts           # 관리자 로그아웃 API
│   │       ├── webhooks/
│   │       │   └── gelato/
│   │       │       └── route.ts           # POST (Gelato Webhook 수신, 공유 시크릿 인증)
│   │       ├── profiles/
│   │       │   ├── me/
│   │       │   │   ├── route.ts           # GET/PUT (내 프로필 조회/수정)
│   │       │   │   ├── avatar/
│   │       │   │   │   └── route.ts       # POST (아바타 이미지 업로드)
│   │       │   │   └── links/
│   │       │   │       ├── route.ts       # GET/POST (내 링크 목록/생성)
│   │       │   │       ├── [linkId]/
│   │       │   │       │   └── route.ts   # PUT/DELETE (링크 수정/삭제)
│   │       │   │       └── reorder/
│   │       │   │           └── route.ts   # PUT (링크 순서 변경)
│   │       │   └── [id]/
│   │       │       ├── route.ts           # GET (사용자 프로필 조회)
│   │       │       ├── cards/
│   │       │       │   └── route.ts       # GET (사용자의 카드 목록)
│   │       │       └── links/
│   │       │           └── route.ts       # GET (사용자 공개 링크 목록)
│   │       ├── questions/
│   │       │   ├── route.ts               # GET/POST (질문 목록/생성, requireAuth for POST)
│   │       │   └── [id]/
│   │       │       ├── route.ts           # GET/DELETE (질문 조회/삭제)
│   │       │       └── thoughts/
│   │       │           ├── route.ts       # GET/POST (생각 목록/생성)
│   │       │           └── [thoughtId]/
│   │       │               └── route.ts   # DELETE (생각 삭제)
│   │       ├── thoughts/
│   │       │   └── [id]/
│   │       │       └── like/
│   │       │           └── route.ts       # POST/DELETE (생각 좋아요 토글)
│   │       ├── mbti/
│   │       │   ├── questions/
│   │       │   │   └── route.ts           # GET (MBTI 진행 상태, requireAuth)
│   │       │   └── answer/
│   │       │       └── route.ts           # POST (MBTI 답변 제출, requireAuth)
│   │       ├── surveys/
│   │       │   ├── route.ts               # GET/POST (설문 목록/생성)
│   │       │   └── [id]/
│   │       │       ├── route.ts           # GET (설문 상세)
│   │       │       └── vote/
│   │       │           └── route.ts       # POST (투표, requireAuth)
│   │       ├── coffee-chat/
│   │       │   ├── route.ts               # GET/POST (커피챗 목록/생성, requireAuth)
│   │       │   ├── [id]/
│   │       │   │   ├── route.ts           # GET (커피챗 상세, requireAuth)
│   │       │   │   └── respond/
│   │       │   │       └── route.ts       # POST (커피챗 수락/거절/취소/완료)
│   │       │   └── pending-count/
│   │       │       └── route.ts           # GET (수신 대기 건수)
│   │       ├── members/
│   │       │   └── discoverable/
│   │       │       └── route.ts           # GET (탐색 가능 회원 목록)
│   │       ├── feed/
│   │       │   └── route.ts               # GET (커뮤니티 피드, 필터/정렬)
│   │       ├── cards/
│   │       │   └── [id]/
│   │       │       ├── like/
│   │       │       │   └── route.ts       # POST/DELETE (좋아요 토글)
│   │       │       └── bookmark/
│   │       │           └── route.ts       # POST/DELETE (북마크 토글)
│   │       ├── themes/
│   │       │   └── route.ts               # GET (공개 테마 목록, 커스텀 테마 포함)
│   │       ├── requests/
│   │       │   ├── route.ts               # POST (요청 생성, requireAuth), GET (목록, requireAdmin)
│   │       │   ├── my/
│   │       │   │   └── route.ts           # GET (사용자 본인 요청 목록, requireAuth)
│   │       │   └── [id]/
│   │       │       └── route.ts           # GET (상세, requireAuth + 소유권 검증), PATCH (수정, requireAdmin)
│   ├── components/
│   │   ├── auth/                          # 인증 관련 컴포넌트
│   │   │   ├── AuthProvider.tsx           # Supabase onAuthStateChange 컨텍스트 (useAuth 훅)
│   │   │   ├── LoginButton.tsx            # 로그인/로그아웃 버튼 (useAuth)
│   │   │   └── UserMenu.tsx               # 사용자 정보 + 관리자 배지 + 설정 + 로그아웃 (useAuth)
│   │   ├── landing/                       # 랜딩 페이지 컴포넌트
│   │   │   └── LandingPage.tsx            # 인증 상태 기반 CTA가 있는 랜딩 페이지
│   │   ├── card/                          # 카드 미리보기 컴포넌트 (테마 기반 위임 패턴)
│   │   │   ├── CardFront.tsx              # 앞면 래퍼 (theme에 따라 Classic/Pokemon/Hearthstone/Harrypotter/Tarot 위임)
│   │   │   ├── CardBack.tsx               # 뒷면 래퍼 (theme에 따라 Classic/Pokemon/Hearthstone/Harrypotter/Tarot 위임)
│   │   │   ├── CardPreview.tsx            # 프리뷰 컨테이너 (플립 애니메이션)
│   │   │   ├── PokemonCardFront.tsx       # Pokemon 테마 앞면 (골드 프레임, HP 배지)
│   │   │   ├── PokemonCardBack.tsx        # Pokemon 테마 뒷면 (그라데이션 배경)
│   │   │   ├── pokemon-types.ts           # Pokemon 7개 타입 정의, 색상, SVG 아이콘
│   │   │   ├── HearthstoneCardFront.tsx   # Hearthstone 테마 앞면 (석재 프레임, 마나, 공격/체력)
│   │   │   ├── HearthstoneCardBack.tsx    # Hearthstone 테마 뒷면 (다크 브라운 배경)
│   │   │   ├── hearthstone-types.ts       # Hearthstone 9개 직업 정의, 색상, SVG 아이콘
│   │   │   ├── HarrypotterCardFront.tsx   # Harry Potter 테마 앞면 (양피지/석재 프레임, 기숙사 배지, 주문 파워)
│   │   │   ├── HarrypotterCardBack.tsx    # Harry Potter 테마 뒷면 (기숙사 색상 배경, 지팡이 장식)
│   │   │   ├── harrypotter-types.ts       # Harry Potter 4개 기숙사 정의, 색상, SVG 아이콘
│   │   │   ├── TarotCardFront.tsx         # Tarot 테마 앞면 (아르누보 보더, 천체 패턴, 미스틱 스탯)
│   │   │   ├── TarotCardBack.tsx          # Tarot 테마 뒷면 (신비로운 눈 모티프, 별 패턴)
│   │   │   ├── tarot-types.ts             # Tarot 5개 아르카나 정의, 색상, SVG 아이콘
│   │   │   ├── CustomThemeCardFront.tsx   # 커스텀 테마 앞면 (동적 필드 렌더링)
│   │   │   ├── CustomThemeCardBack.tsx    # 커스텀 테마 뒷면 (동적 필드 렌더링)
│   │   │   ├── SNSProfileCardFront.tsx    # SNS 프로필 테마 앞면
│   │   │   ├── SNSProfileCardBack.tsx     # SNS 프로필 테마 뒷면
│   │   │   ├── CardDataProvider.tsx       # 카드 데이터 컨텍스트 프로바이더
│   │   │   └── QRCodeModal.tsx            # QR 코드 모달 (vCard QR + URL QR, 다운로드)
│   │   ├── editor/                        # 편집기 폼 컴포넌트
│   │   │   ├── EditorPanel.tsx            # 편집기 패널 컨테이너
│   │   │   ├── FrontEditor.tsx            # 앞면 편집 필드 (ThemeSelector, 테마별 메타데이터 편집 포함)
│   │   │   ├── BackEditor.tsx             # 뒷면 편집 필드
│   │   │   ├── ImageUploader.tsx          # 이미지 업로드 (드래그 앤 드롭, 5MB 제한)
│   │   │   ├── ColorPicker.tsx            # react-colorful 래퍼
│   │   │   ├── TextColorPicker.tsx        # 텍스트 색상 선택기 (화이트/블랙 2옵션)
│   │   │   ├── HashtagEditor.tsx          # 해시태그 태그 관리
│   │   │   ├── SocialLinkEditor.tsx       # 소셜 링크 CRUD
│   │   │   ├── ThemeSelector.tsx          # 테마 선택기 (Classic / Pokemon / Hearthstone / Harry Potter / Tarot)
│   │   │   ├── PokemonTypeSelector.tsx    # Pokemon 타입 선택 그리드
│   │   │   ├── ExpInput.tsx              # EXP 숫자 입력
│   │   │   ├── HearthstoneClassSelector.tsx # Hearthstone 직업 선택 그리드
│   │   │   ├── HearthstoneStatInput.tsx   # Mana/Attack/Health 스탯 입력
│   │   │   ├── HarrypotterHouseSelector.tsx # Harry Potter 기숙사 선택 그리드
│   │   │   ├── HarrypotterStatInput.tsx   # Year/SpellPower 스탯 입력
│   │   │   ├── TarotArcanaSelector.tsx    # Tarot 아르카나 선택 그리드
│   │   │   ├── TarotStatInput.tsx         # CardNumber/Mystique 스탯 입력
│   │   │   └── CustomThemeFieldsEditor.tsx # 커스텀 테마 동적 필드 편집기
│   │   ├── feed/                          # 커뮤니티 피드 컴포넌트
│   │   │   ├── FeedContainer.tsx          # 피드 컨테이너 (무한 스크롤, 필터)
│   │   │   ├── FeedCardThumbnail.tsx      # 피드 카드 썸네일 (좋아요/북마크 표시)
│   │   │   └── FeedFilters.tsx            # 피드 필터 (테마, 정렬, 검색)
│   │   ├── community/                     # 커뮤니티 컴포넌트 (질문/생각)
│   │   │   ├── CommunityNav.tsx           # 커뮤니티 탭 네비게이션 (질문, 커피챗 + 배지)
│   │   │   ├── QuestionCard.tsx           # 질문 카드 (해시태그, 생각 수 표시)
│   │   │   ├── QuestionFeed.tsx           # 질문 피드 (무한 스크롤)
│   │   │   ├── QuestionForm.tsx           # 질문 작성 폼
│   │   │   ├── QuestionDetail.tsx         # 질문 상세 뷰
│   │   │   ├── QuestionFilters.tsx        # 질문 필터 (해시태그)
│   │   │   ├── ThoughtCard.tsx            # 생각 카드 (좋아요 표시)
│   │   │   ├── ThoughtForm.tsx            # 생각 작성 폼
│   │   │   ├── ThoughtList.tsx            # 생각 목록
│   │   │   ├── ThoughtLikeButton.tsx      # 생각 좋아요 버튼
│   │   │   ├── HashtagChip.tsx            # 해시태그 칩 컴포넌트
│   │   │   └── __tests__/                 # 커뮤니티 컴포넌트 테스트
│   │   │       ├── QuestionCard.test.tsx   # QuestionCard 단위 테스트
│   │   │       └── ThoughtForm.test.tsx    # ThoughtForm 단위 테스트
│   │   ├── mbti/                           # MBTI 컴포넌트
│   │   │   ├── MbtiSection.tsx            # MBTI 메인 섹션 (진행바, 질문 목록)
│   │   │   ├── MbtiQuestionCard.tsx       # 개별 질문 카드 (잠금/활성/완료 3가지 상태)
│   │   │   ├── MbtiLevelBadge.tsx         # "Lv.X" 레벨 배지
│   │   │   └── MbtiResultBadge.tsx        # MBTI 타입 배지 (예: "ENFP")
│   │   ├── survey/                        # 설문/투표 컴포넌트
│   │   │   ├── SurveyCard.tsx             # 설문 카드 (피드용)
│   │   │   ├── SurveyFeed.tsx             # 설문 피드 (무한 스크롤)
│   │   │   ├── SurveyForm.tsx             # 설문 작성 폼
│   │   │   ├── SurveyDetail.tsx           # 설문 상세 뷰
│   │   │   ├── SurveyVoteUI.tsx           # 투표 UI 컴포넌트
│   │   │   ├── SurveyResults.tsx          # 투표 결과 시각화
│   │   │   ├── SurveyFilters.tsx          # 설문 필터 (해시태그)
│   │   │   └── OfficialBadge.tsx          # 관리자 공식 배지
│   │   ├── coffee-chat/                   # 커피챗 컴포넌트
│   │   │   ├── CoffeeChatCard.tsx         # 커피챗 요청 카드
│   │   │   ├── CoffeeChatDetail.tsx       # 커피챗 상세 뷰
│   │   │   ├── CoffeeChatList.tsx         # 커피챗 목록
│   │   │   ├── CoffeeChatButton.tsx       # 커피챗 요청 버튼
│   │   │   ├── CoffeeChatRequestModal.tsx # 커피챗 요청 모달
│   │   │   ├── CoffeeChatActions.tsx      # 커피챗 액션 (수락/거절/취소/완료)
│   │   │   ├── CoffeeChatStatusBadge.tsx  # 커피챗 상태 배지
│   │   │   ├── CoffeeChatBadge.tsx        # 커피챗 Pending 카운트 배지 (60초 폴링)
│   │   │   ├── MemberCard.tsx             # 회원 탐색 카드
│   │   │   ├── MemberDiscoverGrid.tsx     # 회원 탐색 그리드 (무한 스크롤)
│   │   │   └── __tests__/                 # 커피챗 컴포넌트 테스트
│   │   │       └── CoffeeChatComponents.test.tsx # 커피챗 컴포넌트 단위 테스트
│   │   ├── profile/                       # 사용자 프로필 컴포넌트 (Link-in-Bio 스타일)
│   │   │   ├── ProfileHeader.tsx          # 프로필 헤더 (아바타, 이름, 소개)
│   │   │   ├── ProfileEditForm.tsx        # 프로필 편집 폼
│   │   │   ├── SocialIconRow.tsx          # 소셜 플랫폼 아이콘 배열 (Instagram, GitHub 등)
│   │   │   ├── LinkButton.tsx             # 개별 링크 버튼
│   │   │   ├── LinkList.tsx               # 링크 목록 렌더링
│   │   │   ├── CardPortfolio.tsx          # 명함 카드 포트폴리오 갤러리
│   │   │   ├── LinkEditor.tsx             # 링크 관리 편집기
│   │   │   ├── LinkEditModal.tsx          # 링크 추가/수정 모달
│   │   │   ├── SocialLinksEditor.tsx      # 소셜 링크 편집기
│   │   │   └── ThemeDistribution.tsx      # 테마 사용 분포 차트
│   │   ├── social/                        # 소셜 상호작용 컴포넌트
│   │   │   ├── LikeButton.tsx             # 좋아요 버튼 (토글, 카운트 표시)
│   │   │   └── BookmarkButton.tsx         # 북마크 버튼 (토글)
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
│   │   │   └── MyRequestDetail.tsx        # 요청 상세 뷰 (확정 버튼, 편집 폼, 저장 후 확정)
│   │   └── admin/                         # 관리자 컴포넌트
│   │       ├── RequestList.tsx            # 관리자 요청 목록 테이블
│   │       ├── RequestDetail.tsx          # 요청 상세 뷰
│   │       ├── StatusBadge.tsx            # 상태 배지 컴포넌트
│   │       ├── StatusHistory.tsx          # 상태 변경 이력
│   │       ├── CardCompare.tsx            # 원본 vs 일러스트 비교 (외부 URL 이미지 에러 핸들링 포함)
│   │       ├── IllustrationUploader.tsx   # 일러스트 이미지 업로드 (파일 업로드 + 외부 URL 입력)
│   │       ├── EventPdfDownload.tsx       # 이벤트별 명함 PDF 다운로드 (jsPDF + html-to-image)
│   │       ├── BulkUploadModal.tsx        # CSV/Excel 대량 등록 모달 (SheetJS 변환 지원)
│   │       ├── CustomThemeManager.tsx     # 커스텀 테마 관리 (목록, CRUD)
│   │       ├── CustomThemeForm.tsx        # 커스텀 테마 생성/편집 폼
│   │       ├── CustomThemePreview.tsx     # 커스텀 테마 미리보기
│   │       ├── PrintOrderManager.tsx      # 인쇄 주문 관리 컨테이너 (새 주문/주문 이력 탭)
│   │       ├── PrintCardSelector.tsx      # 인쇄 카드 다중 선택 + 수량 입력
│   │       ├── PrintQuoteView.tsx         # Gelato 견적 결과 표시 (배송 방법 선택)
│   │       ├── ShippingAddressForm.tsx    # 배송 주소 입력 폼 (한국어, localStorage)
│   │       ├── PrintOrderStatus.tsx       # 주문 상태 타임라인 + 배송 추적
│   │       └── PrintOrderHistory.tsx      # 주문 이력 목록 (상태 필터, 상세 확장)
│   ├── stores/
│   │   ├── useCardStore.ts                # Zustand store (persist middleware)
│   │   └── __tests__/
│   │       └── useCardStore.test.ts       # Store 단위 테스트
│   ├── hooks/                             # 커스텀 React 훅
│   │   ├── useLike.ts                     # 좋아요 토글 훅 (낙관적 업데이트)
│   │   ├── useBookmark.ts                 # 북마크 토글 훅 (낙관적 업데이트)
│   │   ├── useCustomThemes.ts             # 커스텀 테마 CRUD 훅
│   │   ├── usePrintOrders.ts              # 인쇄 주문 CRUD + 견적 조회 훅
│   │   ├── useAdminFilters.ts             # 관리자 필터 훅
│   │   ├── useLinks.ts                    # 프로필 링크 CRUD 훅 (Link-in-Bio)
│   │   ├── useQuestions.ts                # 질문 CRUD + 피드 훅 (커서 기반 페이지네이션)
│   │   ├── useThoughts.ts                 # 생각 CRUD 훅 (질문별 생각 목록)
│   │   ├── useThoughtLike.ts              # 생각 좋아요 토글 훅
│   │   ├── useCoffeeChat.ts               # 커피챗 CRUD + 목록 훅 (커서 기반 페이지네이션)
│   │   ├── useCoffeeChatCount.ts           # 커피챗 Pending 카운트 훅 (60초 폴링)
│   │   ├── useMbtiProgress.ts             # MBTI 데이터 조회 및 답변 제출 훅
│   │   ├── useSurveys.ts                  # 설문 피드 훅
│   │   ├── useSurveyDetail.ts             # 설문 상세 훅
│   │   ├── useSurveyVote.ts               # 설문 투표 훅
│   │   ├── useSurveyCreate.ts             # 설문 생성 훅
│   │   └── __tests__/
│   │       └── useThoughtLike.test.ts     # 생각 좋아요 훅 단위 테스트
│   ├── types/
│   │   ├── card.ts                        # 카드 타입 (CardData, SocialLink 등)
│   │   ├── request.ts                     # 요청 타입 (CardRequest, RequestStatus, createdBy)
│   │   ├── profile.ts                     # 프로필 타입 (UserProfile, UserLink, SocialLink, ProfilePageData)
│   │   ├── custom-theme.ts               # 커스텀 테마 타입 (CustomTheme, ThemeField 등)
│   │   ├── print-order.ts                 # 인쇄 주문 타입 (PrintOrder, PrintOrderItem, ShippingAddress)
│   │   ├── question.ts                    # 질문/생각 타입 (Question, Thought, QuestionWithAuthor, ThoughtWithAuthor)
│   │   ├── coffee-chat.ts                 # 커피챗 타입 (CoffeeChat, CoffeeChatWithUsers, DiscoverableMember, VALID_TRANSITIONS)
│   │   ├── mbti.ts                        # MBTI 타입 (MbtiQuestion, MbtiAnswer, MbtiProgress, MbtiDimension 등)
│   │   ├── survey.ts                      # 설문/투표 타입
│   │   ├── event.ts                       # 이벤트 타입
│   │   └── kakao.d.ts                     # 카카오 SDK 타입 선언
│   ├── lib/
│   │   ├── supabase.ts                    # 서버 Supabase 클라이언트 (service role key)
│   │   ├── supabase-auth.ts               # 브라우저 Supabase 클라이언트 (anon key)
│   │   ├── auth-utils.ts                  # 서버 인증 유틸리티 (requireAuth, requireAdmin, AuthError, isAdmin)
│   │   ├── storage.ts                     # Supabase DB/Storage 연산 (saveRequest, getRequest, updateRequest 등)
│   │   ├── social-utils.ts               # 소셜 미디어 URL에서 핸들 추출 유틸리티 (extractHandle)
│   │   ├── url-utils.ts                  # Google Drive URL 변환 유틸리티 (convertGoogleDriveUrl)
│   │   ├── qrcode.ts                      # QR 코드 생성 + vCard 3.0 생성 유틸리티
│   │   ├── export.ts                      # html-to-image PNG 내보내기 유틸리티
│   │   ├── validation.ts                  # 이미지 파일 검증 + Base64 변환
│   │   ├── profile-storage.ts             # 프로필 DB 연산 (getProfile, updateProfile, getProfileCards 등)
│   │   ├── gelato.ts                      # Gelato API 클라이언트 (fetch 기반, Workers 호환)
│   │   ├── gelato-types.ts                # Gelato API 타입 및 상수
│   │   ├── event-storage.ts               # 이벤트 DB 연산
│   │   ├── question-storage.ts            # 질문/생각 DB 연산 (stripHtml XSS 방지, 커서 기반 페이지네이션)
│   │   ├── coffee-chat-storage.ts         # 커피챗 DB 연산 (상태 전이 검증, rate limiting, 프로필 일괄 조회)
│   │   ├── mbti-storage.ts               # MBTI DB 연산 (getMbtiQuestions, getUserMbtiAnswers, getMbtiProgress, submitMbtiAnswer)
│   │   └── survey-storage.ts             # 설문/투표 DB 연산
│   ├── test/
│   │   └── setup.ts                       # Vitest 테스트 환경 설정
│   └── lib/__tests__/                     # 라이브러리 단위 테스트
│       ├── question-storage.test.ts       # 질문 스토리지 단위 테스트
│       ├── coffee-chat-storage.test.ts    # 커피챗 스토리지 단위 테스트
│       ├── coffee-chat-transitions.test.ts # 커피챗 상태 전이 테스트
│       └── coffee-chat-email.test.ts      # 커피챗 이메일 공개 테스트
├── .moai/                                 # MoAI-ADK 설정
│   ├── config/                            # 프로젝트 설정 파일
│   │   └── sections/                      # 설정 섹션 (quality, user, language)
│   ├── project/                           # 프로젝트 문서
│   └── specs/                             # SPEC 문서
│       ├── SPEC-UI-001/                   # Namecard Editor SPEC
│       ├── SPEC-DASHBOARD-001/            # User Dashboard SPEC
│       └── SPEC-SURVEY-001/               # 커뮤니티 설문/투표 SPEC
├── .claude/                               # Claude Code 설정
│   ├── agents/                            # Sub-agent 정의
│   ├── commands/                          # Slash commands
│   ├── rules/                             # Project rules
│   │   └── moai/                          # MoAI-specific rules
│   └── skills/                            # Skills 정의
├── .github/                               # GitHub 설정
│   └── workflows/
│       └── deploy.yml                     # Cloudflare Workers 배포 CI/CD
├── supabase/                              # Supabase 로컬 설정
│   └── migrations/                        # DB 마이그레이션 파일
│       ├── 007_add_custom_themes.sql      # 커스텀 테마 테이블 생성
│       ├── 008_add_community.sql          # 커뮤니티 프로필/피드 테이블 생성
│       ├── 009_add_likes_bookmarks.sql    # 좋아요/북마크 테이블 생성
│       ├── 010_add_print_orders.sql       # 인쇄 주문 테이블 (print_orders, print_order_items)
│       ├── 011_add_questions_thoughts.sql # 질문/생각 테이블 (community_questions, community_thoughts, thought_likes + RLS + 트리거)
│       ├── 012_add_coffee_chat.sql        # 커피챗 테이블 (coffee_chat_requests + 5-상태 FSM + LEAST/GREATEST 유니크 인덱스)
│       ├── 013_add_coffee_chat_preferences.sql # 커피챗 개인 선호도
│       ├── 014_add_surveys.sql            # 설문/투표 테이블 (community_surveys, survey_options, survey_votes)
│       ├── 015_fix_thoughts_rls.sql       # Thoughts RLS 수정
│       ├── 016_add_mbti_system.sql        # MBTI 테이블 (mbti_questions, mbti_answers) + user_profiles level/mbti_type
│       └── 017_add_more_mbti_questions.sql # 32개 추가 MBTI 질문
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

[인쇄 주문 흐름]
Admin -> /admin/print -> PrintCardSelector (카드 선택) -> ShippingAddressForm (배송 주소)
-> POST /api/admin/print/quote (견적 조회) -> Gelato Quote API
-> POST /api/admin/print/orders (Draft 주문 생성) -> Gelato Order API + Supabase DB (print_orders)
-> PATCH /api/admin/print/orders/[id] (주문 확정) -> Gelato Confirm API
-> Gelato Webhook -> POST /api/webhooks/gelato -> Supabase DB (상태 업데이트)

[카드 편집기 흐름]
Card Editor -> Zustand Store -> localStorage (persist) -> html-to-image -> PNG 다운로드

[질문/생각 흐름]
User -> /community/questions -> GET /api/questions (커서 기반 페이지네이션) -> Supabase DB (community_questions)
User -> /community/questions/[id] -> GET /api/questions/[id] -> 질문 상세 + 생각 목록
User -> POST /api/questions -> 질문 작성 (requireAuth) -> Supabase DB
User -> POST /api/questions/[id]/thoughts -> 생각 작성 (requireAuth) -> 트리거 -> thought_count 자동 증가
User -> POST /api/thoughts/[id]/like -> 생각 좋아요 토글 -> 트리거 -> like_count 자동 업데이트

[커피챗 흐름]
User -> /community/coffee-chat -> GET /api/members/discoverable (탐색 가능 회원) -> Supabase DB (user_profiles)
User -> POST /api/coffee-chat -> 커피챗 요청 생성 (rate limit: 5건/24h) -> Supabase DB (coffee_chat_requests)
Receiver -> POST /api/coffee-chat/[id]/respond -> 수락/거절 (이메일 조건부 공개) -> 상태 전이 검증
User -> GET /api/coffee-chat/pending-count -> Pending 카운트 조회 (60초 폴링)
User -> /community/coffee-chat/my -> GET /api/coffee-chat -> 내 요청/수신 목록 (커서 기반 페이지네이션)

[MBTI 흐름]
User -> /community/questions -> MbtiSection -> GET /api/mbti/questions (진행 상태) -> Supabase DB (mbti_questions, mbti_answers)
User -> POST /api/mbti/answer -> 답변 제출 (requireAuth) -> Supabase DB -> 레벨 업 + MBTI 타입 자동 계산

[설문/투표 흐름]
User -> /community/surveys -> GET /api/surveys (설문 목록) -> Supabase DB (community_surveys)
User -> /community/surveys/[id] -> GET /api/surveys/[id] -> 설문 상세 + 투표 결과
User -> POST /api/surveys -> 설문 작성 (requireAuth) -> Supabase DB
User -> POST /api/surveys/[id]/vote -> 투표 (requireAuth) -> Supabase DB (survey_votes)
Admin -> POST /api/admin/questions -> 관리자 질문 생성 (requireAdmin) -> Supabase DB

[Link-in-Bio 프로필 흐름]
User -> /profile/[id] -> GET /api/profiles/[id] + GET /api/profiles/[id]/links -> 프로필 + 링크 렌더링
Owner -> /dashboard/settings -> PUT /api/profiles/me (프로필 수정) -> POST /api/profiles/me/avatar (아바타 업로드)
Owner -> POST/PUT/DELETE /api/profiles/me/links -> 커스텀 링크 CRUD
Owner -> PUT /api/profiles/me/links/reorder -> 링크 순서 변경
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
├── create/page.tsx (Wizard)       # 명함 제작 위저드 (임시 /dashboard 리다이렉트)
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
├── create/edit/page.tsx (Editor)  # 카드 편집기 (임시 /dashboard 리다이렉트)
│   ├── CardPreview
│   │   ├── CardFront              # 앞면 래퍼 (테마 기반 위임)
│   │   │   ├── (classic)          # Classic 앞면 (기본, theme 없는 경우 포함)
│   │   │   ├── PokemonCardFront   # Pokemon 앞면 (골드 프레임, HP 배지, 타입 아이콘)
│   │   │   ├── HearthstoneCardFront # Hearthstone 앞면 (석재 프레임, 마나, 공격/체력)
│   │   │   ├── HarrypotterCardFront # Harry Potter 앞면 (양피지 프레임, 기숙사 배지, 주문 파워)
│   │   │   └── TarotCardFront     # Tarot 앞면 (아르누보 보더, 천체 패턴, 미스틱)
│   │   └── CardBack               # 뒷면 래퍼 (테마 기반 위임)
│   │       ├── (classic)          # Classic 뒷면 (기본, theme 없는 경우 포함)
│   │       ├── PokemonCardBack    # Pokemon 뒷면 (그라데이션 배경)
│   │       ├── HearthstoneCardBack # Hearthstone 뒷면 (다크 브라운 배경)
│   │       ├── HarrypotterCardBack # Harry Potter 뒷면 (기숙사 색상, 지팡이 장식)
│   │       └── TarotCardBack      # Tarot 뒷면 (신비로운 눈 모티프, 별 패턴)
│   ├── TabSwitch                  # 앞면/뒷면 탭 전환
│   ├── EditorPanel
│   │   ├── FrontEditor            # 앞면 편집
│   │   │   ├── ThemeSelector      # 테마 선택 (Classic/Pokemon/Hearthstone/Harry Potter/Tarot)
│   │   │   ├── PokemonTypeSelector # Pokemon 타입 선택 그리드
│   │   │   ├── ExpInput           # EXP 숫자 입력
│   │   │   ├── HearthstoneClassSelector # Hearthstone 직업 선택 그리드
│   │   │   ├── HearthstoneStatInput # Mana/Attack/Health 스탯 입력
│   │   │   ├── HarrypotterHouseSelector # Harry Potter 기숙사 선택 그리드
│   │   │   ├── HarrypotterStatInput # Year/SpellPower 스탯 입력
│   │   │   ├── TarotArcanaSelector # Tarot 아르카나 선택 그리드
│   │   │   ├── TarotStatInput     # CardNumber/Mystique 스탯 입력
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
├── cards/[id]/page.tsx (Public Card) # 공개 명함 페이지
│   └── PublicCardView              # 명함 뷰 + vCard 다운로드
│       └── AdminCardPreview        # 카드 미리보기 (테마 지원)
│
├── gallery/page.tsx (Gallery)      # 공개 갤러리
│   └── AdminCardPreview            # 이벤트별 그룹 카드 목록
│
├── dashboard/page.tsx (User Dashboard) # 사용자 대시보드
│   ├── UserMenu                   # 사용자 메뉴 ("내 요청", "설정" 링크 포함)
│   ├── MyRequestList              # 반응형 요청 목록
│   │   ├── RequestCard            # 모바일 카드 뷰
│   │   ├── ProgressStepper        # 3단계 진행 상태 (의뢰됨/작업중/확정)
│   │   └── StatusBadge            # 상태 배지 (재사용)
│   └── EmptyState                 # 요청 없음 안내 + CTA
│
├── dashboard/settings/page.tsx (Settings) # 사용자 설정 (비밀번호 변경)
│
├── dashboard/[id]/page.tsx (User Detail) # 사용자 요청 상세 (확정 + 편집)
│   ├── MyRequestDetail            # 요청 상세 뷰 (확정 버튼, 편집 폼, 저장 후 확정)
│   ├── ProgressStepper            # 진행 상태 시각화
│   ├── StatusHistory              # 상태 변경 이력 (재사용)
│   └── CardCompare                # 원본 vs 일러스트 비교 (재사용)
│
├── dashboard/bookmarks/page.tsx (Bookmarks) # 북마크한 카드 목록
│   └── FeedCardThumbnail          # 카드 썸네일 (북마크 해제 가능)
│
├── community/questions/page.tsx (Questions) # 질문 피드
│   ├── CommunityNav               # 커뮤니티 탭 네비게이션 (질문/커피챗/설문)
│   ├── MbtiSection                # MBTI 메인 섹션 (진행바, 질문 목록)
│   │   ├── MbtiQuestionCard       # 개별 질문 카드 (잠금/활성/완료)
│   │   ├── MbtiLevelBadge         # "Lv.X" 레벨 배지
│   │   └── MbtiResultBadge        # MBTI 타입 배지
│   ├── QuestionFeed               # 질문 피드 (무한 스크롤)
│   │   └── QuestionCard           # 질문 카드 (해시태그, 생각 수)
│   │       └── HashtagChip        # 해시태그 칩
│   ├── QuestionForm               # 질문 작성 폼
│   └── QuestionFilters            # 질문 필터 (해시태그)
│
├── community/questions/[id]/page.tsx (QuestionDetail) # 질문 상세
│   ├── QuestionDetail             # 질문 상세 뷰
│   ├── QuestionDetailActions      # 질문 삭제 등 액션
│   ├── ThoughtList                # 생각 목록
│   │   └── ThoughtCard            # 생각 카드
│   │       └── ThoughtLikeButton  # 생각 좋아요 버튼
│   └── ThoughtForm               # 생각 작성 폼
│
├── community/surveys/page.tsx (Surveys) # 설문/투표 피드
│   ├── CommunityNav               # 커뮤니티 탭 네비게이션
│   ├── SurveyFeed                 # 설문 피드 (무한 스크롤)
│   │   └── SurveyCard             # 설문 카드
│   │       └── OfficialBadge      # 관리자 공식 배지
│   ├── SurveyForm                 # 설문 작성 폼
│   └── SurveyFilters              # 설문 필터 (해시태그)
│
├── community/surveys/[id]/page.tsx (SurveyDetail) # 설문 상세
│   ├── SurveyDetail               # 설문 상세 뷰
│   ├── SurveyVoteUI               # 투표 UI 컴포넌트
│   └── SurveyResults              # 투표 결과 시각화
│
├── community/coffee-chat/page.tsx (CoffeeChat Discover) # 커피챗 탐색
│   ├── CommunityNav               # 커뮤니티 탭 네비게이션
│   ├── CoffeeChatDiscoverClient   # 탐색 클라이언트
│   └── MemberDiscoverGrid         # 회원 탐색 그리드
│       └── MemberCard             # 회원 카드
│           ├── CoffeeChatButton   # 커피챗 요청 버튼
│           └── CoffeeChatRequestModal # 커피챗 요청 모달
│
├── community/coffee-chat/my/page.tsx (My CoffeeChat) # 내 커피챗
│   ├── MyCoffeeChatClient         # 내 커피챗 클라이언트
│   └── CoffeeChatList             # 커피챗 목록
│       └── CoffeeChatCard         # 커피챗 요청 카드
│           ├── CoffeeChatStatusBadge # 상태 배지
│           ├── CoffeeChatDetail   # 커피챗 상세 뷰
│           └── CoffeeChatActions  # 수락/거절/취소/완료 액션
│
├── profile/[id]/page.tsx (Profile) # 사용자 프로필 (Link-in-Bio)
│   ├── ProfileClient              # 프로필 클라이언트 컴포넌트
│   ├── ProfileHeader              # 프로필 헤더 (아바타, 이름, 소개)
│   ├── SocialIconRow              # 소셜 플랫폼 아이콘 행
│   ├── LinkList                   # 커스텀 링크 목록
│   │   └── LinkButton             # 개별 링크 버튼
│   ├── CardPortfolio              # 명함 카드 포트폴리오 갤러리
│   ├── ProfileEditForm            # 프로필 편집 폼 (본인 프로필인 경우)
│   ├── SocialLinksEditor          # 소셜 링크 편집기
│   ├── LinkEditor                 # 커스텀 링크 관리
│   │   └── LinkEditModal          # 링크 추가/수정 모달
│   └── ThemeDistribution          # 테마 사용 분포 차트
│
├── gallery/page.tsx (Feed)        # 커뮤니티 피드 (갤러리 확장)
│   ├── FeedContainer              # 피드 컨테이너 (무한 스크롤)
│   ├── FeedFilters                # 피드 필터 (테마, 정렬, 검색)
│   └── FeedCardThumbnail          # 카드 썸네일 (좋아요/북마크)
│       ├── LikeButton             # 좋아요 토글
│       └── BookmarkButton         # 북마크 토글
│
├── admin/page.tsx (Dashboard)     # 관리자 대시보드
│   ├── UserMenu                   # 사용자 메뉴 + 관리자 배지 + 설정
│   ├── BulkUploadModal            # CSV/Excel 대량 등록 모달
│   └── RequestList                # 요청 목록 테이블
│       └── StatusBadge            # 상태 배지
│
├── admin/[id]/page.tsx (Detail)   # 요청 상세
│   ├── RequestDetail              # 요청 상세 뷰 (테마 및 메타데이터 편집 포함)
│   ├── StatusHistory              # 상태 변경 이력
│   ├── CardCompare                # 원본 vs 일러스트 비교
│   └── IllustrationUploader       # 일러스트 업로드
│
├── admin/print/page.tsx (Print Order Management) # 인쇄 주문 관리
│   └── PrintOrderManager            # 주문 관리 컨테이너
│       ├── PrintCardSelector         # 카드 다중 선택 + 수량
│       ├── ShippingAddressForm       # 배송 주소 입력
│       ├── PrintQuoteView            # 견적 결과 (배송 방법 선택)
│       ├── PrintOrderStatus          # 주문 상태 타임라인
│       └── PrintOrderHistory         # 주문 이력 (필터, 상세)
│
├── admin/events/page.tsx (Events) # 이벤트 관리
│   └── EventPdfDownload           # 이벤트별 명함 PDF 다운로드 (jsPDF + html-to-image)
│
└── admin/themes/page.tsx (Themes) # 테마 관리
    ├── 테마 미리보기 갤러리        # Classic/Pokemon/Hearthstone/Harry Potter/Tarot 미리보기
    ├── 테마별 의뢰 통계            # 테마 사용 현황
    └── 일괄 테마 적용              # 필터 기반 대량 테마 변경
```

## 주요 디렉토리 설명

| 디렉토리 | 설명 |
|----------|------|
| `src/middleware.ts` | Supabase 세션 갱신 미들웨어 (Next.js 16 호환) |
| `src/app/` | Next.js App Router 기반 페이지, 레이아웃, API 라우트 |
| `src/app/api/` | REST API 엔드포인트 (인증, 요청 CRUD, 이벤트/카드 데이터) |
| `src/app/login/`, `signup/`, `confirm/`, `callback/` | 인증 관련 페이지 |
| `src/app/create/` | 명함 제작 위저드 및 카드 편집기 |
| `src/app/dashboard/` | 사용자 대시보드 (내 요청 목록, 요청 상세, 설정) |
| `src/app/cards/` | 공개 명함 페이지 (QR 스캔용, Server Component + OG 메타데이터) |
| `src/app/gallery/` | 공개 명함 갤러리 (이벤트별 그룹) |
| `src/app/admin/` | 관리자 대시보드, 요청 상세, 이벤트 관리, 회원 관리 페이지 |
| `src/components/auth/` | 인증 관련 컴포넌트 (AuthProvider, LoginButton, UserMenu) |
| `src/components/landing/` | 랜딩 페이지 컴포넌트 |
| `src/components/card/` | 명함 미리보기 렌더링 컴포넌트 (테마 기반 위임 패턴: CardFront/CardBack이 theme 값에 따라 Classic/Pokemon/Hearthstone/Harrypotter/Tarot/Custom 컴포넌트로 위임) |
| `src/components/editor/` | 명함 편집 폼 컴포넌트 (ThemeSelector, PokemonTypeSelector, HearthstoneClassSelector, HarrypotterHouseSelector, TarotArcanaSelector 등 테마 편집 UI 포함) |
| `src/components/export/` | PNG 이미지 내보내기 관련 컴포넌트 |
| `src/components/ui/` | 범용 UI 컴포넌트 (탭, 버튼) |
| `src/components/wizard/` | 6단계 명함 제작 위저드 컴포넌트 |
| `src/components/dashboard/` | 사용자 대시보드 컴포넌트 (ProgressStepper, MyRequestList, RequestCard, EmptyState, MyRequestDetail) |
| `src/components/feed/` | 커뮤니티 피드 컴포넌트 (FeedContainer, FeedCardThumbnail, FeedFilters) |
| `src/components/community/` | 커뮤니티 컴포넌트 - 질문/생각 (QuestionCard, QuestionFeed, QuestionForm, QuestionDetail, QuestionFilters, ThoughtCard, ThoughtForm, ThoughtList, ThoughtLikeButton, HashtagChip, CommunityNav - 질문/커피챗/설문 탭) |
| `src/components/mbti/` | MBTI 컴포넌트 (MbtiSection, MbtiQuestionCard, MbtiLevelBadge, MbtiResultBadge) |
| `src/components/survey/` | 설문/투표 컴포넌트 (SurveyCard, SurveyFeed, SurveyForm, SurveyDetail, SurveyVoteUI, SurveyResults, SurveyFilters, OfficialBadge) |
| `src/components/coffee-chat/` | 커피챗 컴포넌트 (CoffeeChatCard, CoffeeChatDetail, CoffeeChatList, CoffeeChatButton, CoffeeChatRequestModal, CoffeeChatActions, CoffeeChatStatusBadge, CoffeeChatBadge, MemberCard, MemberDiscoverGrid) |
| `src/components/profile/` | 사용자 프로필 컴포넌트 - Link-in-Bio 스타일 (ProfileHeader, ProfileEditForm, SocialIconRow, LinkButton, LinkList, CardPortfolio, LinkEditor, LinkEditModal, SocialLinksEditor, ThemeDistribution) |
| `src/components/social/` | 소셜 상호작용 컴포넌트 (LikeButton, BookmarkButton) |
| `src/components/admin/` | 관리자 대시보드 컴포넌트 (BulkUploadModal, IllustrationUploader, EventPdfDownload, CustomThemeManager, PrintOrderManager, PrintCardSelector, PrintQuoteView, ShippingAddressForm, PrintOrderStatus, PrintOrderHistory 등) |
| `src/stores/` | Zustand 상태 관리 (localStorage persist 포함) |
| `src/hooks/` | 커스텀 React 훅 (좋아요, 북마크, 커스텀 테마, 인쇄 주문, 링크, 질문, 생각, 생각 좋아요, 커피챗, 커피챗 카운트, 관리자 필터, MBTI 진행, 설문 피드/상세/투표/생성) |
| `src/types/` | TypeScript 타입 정의 (카드, 요청, 프로필, 커스텀 테마, 인쇄 주문, 질문, 커피챗, MBTI, 설문, 이벤트) |
| `src/lib/` | 유틸리티 함수 (Supabase 클라이언트, 인증, 스토리지, 내보내기, 검증, 소셜 핸들 추출, URL 변환, QR 코드/vCard 생성, 프로필 DB 연산, 질문/생각 DB 연산, 커피챗 DB 연산, MBTI DB 연산, 설문 DB 연산, 이벤트 DB 연산). `storage.ts`에 `getRequestsByUser(email)` 함수, `social-utils.ts`에 `extractHandle()` 함수, `url-utils.ts`에 `convertGoogleDriveUrl()` 함수, `qrcode.ts`에 `generateVCard()`, `generateQRDataURL()`, `getCardPublicURL()` 함수, `profile-storage.ts`에 프로필 CRUD 함수, `question-storage.ts`에 질문/생각 CRUD + `stripHtml()` 함수, `coffee-chat-storage.ts`에 커피챗 CRUD + 상태 전이 검증 함수, `mbti-storage.ts`에 MBTI CRUD + 진행 상태 함수, `survey-storage.ts`에 설문 CRUD 함수 포함 |
| `src/test/` | 테스트 환경 설정 |
| `.github/workflows/` | GitHub Actions CI/CD 워크플로우 (Cloudflare Workers 배포) |
| `supabase/migrations/` | Supabase DB 마이그레이션 파일 (커스텀 테마, 커뮤니티, 좋아요/북마크, 인쇄 주문, 질문/생각, 커피챗, 커피챗 선호도, 설문/투표, Thoughts RLS, MBTI 시스템) |

## 파일 수 현황

| 카테고리 | 파일 수 |
|---------|--------|
| 페이지/레이아웃 (`.tsx` in `app/`) | 36 |
| API 라우트 (`.ts` in `app/api/`) | 51 |
| React 컴포넌트 (`.tsx`/`.ts` in `components/`) | 127 |
| 커스텀 훅 (`.ts` in `hooks/`) | 16 |
| Zustand Store (`.ts` in `stores/`) | 1 |
| 타입 정의 (`.ts` in `types/`) | 11 |
| 유틸리티 (`.ts` in `lib/`) | 17 |
| 미들웨어 (`.ts`) | 1 |
| 테스트 (`.ts`, `.test.ts`, `.test.tsx`) | 9 |
| 스타일시트 (`.css`) | 1 |
| DB 마이그레이션 (`.sql`) | 17 |
| 총 소스 파일 | 287 |
