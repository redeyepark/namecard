# Namecard Service (명함 제작 서비스)

## 프로젝트 설명

명함 디자인부터 제작 요청, 관리자 검수, 일러스트 제작까지 전체 워크플로우를 지원하는 풀스택 웹 애플리케이션입니다. 사용자는 Supabase Auth를 통해 이메일/비밀번호 또는 Google OAuth로 로그인한 후, 6단계 위저드를 통해 명함 정보를 입력하고 제작을 요청합니다. 관리자는 요청을 검토하고 일러스트를 업로드하여 최종 명함을 완성합니다. 별도로 카드 편집기를 통해 명함의 앞면과 뒷면을 실시간으로 편집하고, 고화질 PNG 이미지로 내보낼 수 있습니다.

### UI 디자인 스타일

미니멀리스트/모던 갤러리 스타일의 디자인을 채택하고 있습니다. 딥 네이비(`#020912`)와 오프 화이트(`#fcfcfc`) 색상 조합으로 세련된 대비를 구현하며, 모든 요소에 날카로운 모서리(0px border-radius)를 적용하여 샤프한 인상을 줍니다. Google Fonts의 Figtree(제목/헤딩)와 Anonymous Pro(본문/모노) 폰트를 사용합니다.

## 대상 사용자

### 일반 사용자

- 명함 제작을 요청하고 싶은 개인 사용자
- 프리랜서
- 소규모 사업자

### 관리자

- 명함 제작 요청을 검토하고 일러스트를 제작하는 관리자
- ADMIN_EMAILS 환경변수에 등록된 이메일로 관리자 권한 부여

## 핵심 기능

### 사용자 인증

- 이메일/비밀번호 기반 회원가입 및 로그인
- Google OAuth 소셜 로그인
- Supabase Auth 기반 세션 관리
- 이메일 확인 프로세스 (회원가입 후 이메일 인증)
- 인증 상태에 따른 라우트 보호 (middleware.ts 미들웨어)

### 사용자 설정

- 비밀번호 변경 기능 (`/dashboard/settings`)
- 이메일/비밀번호 인증 사용자만 변경 가능 (Google OAuth 사용자는 안내 메시지 표시)
- 현재 비밀번호 확인 후 새 비밀번호 설정 (`supabase.auth.signInWithPassword()`로 현재 비밀번호 검증, `supabase.auth.updateUser()`로 변경)
- UserMenu에서 "설정" 링크로 접근 (기어 아이콘, "내 요청"과 "로그아웃" 사이에 위치)

### 명함 제작 위저드 (6단계)

- **Step 1 - 개인 정보**: 이름, 직함, 회사명 입력
- **Step 2 - 사진 업로드**: 아바타 이미지 업로드 (드래그 앤 드롭, 5MB 제한), 배경색 선택, 텍스트 컬러 선택 (화이트/블랙)
- **Step 3 - 소셜/태그**: 소셜 링크 추가, 해시태그 입력
- **Step 4 - 미리보기**: 입력 정보 기반 명함 미리보기
- **Step 5 - 제작 요청**: 명함 제작 요청 제출 (Supabase DB에 저장)
- **Step 6 - 완료**: 요청 완료 안내

> **임시 조치**: `/create` 및 `/create/edit` 라우트는 현재 `/dashboard`로 리다이렉트됩니다. 위저드를 통한 신규 명함 제작은 일시 중단되었으며, 기존 코드를 복원하면 쉽게 되돌릴 수 있습니다.

### 사용자 대시보드

- 로그인한 사용자의 명함 제작 요청 목록 조회 (`GET /api/requests/my`)
- 3단계 프로그레스 인디케이터로 진행 상태 시각화 (의뢰됨 -> 작업중 -> 확정)
- 반응형 레이아웃: 모바일은 카드형, 데스크톱은 테이블형 리스트
- 요청 상세 보기 (`/dashboard/[id]`): 상태 이력, 카드 비교, 명함 정보 읽기 전용 표시
- 사용자 확정 기능: 요청 상세 페이지(`/dashboard/[id]`)에서 사용자가 직접 카드 요청을 확정(confirm)할 수 있음. 편집 폼에서 "저장 후 확정" 버튼 제공
- 편집 가능 상태: `submitted`(의뢰됨) 및 `processing`(작업중) 상태에서 사용자 편집 가능
- 요청이 없는 경우 EmptyState에서 "명함 만들기" CTA 제공
- 소유권 검증: 다른 사용자의 요청에 접근 시 403 반환

### 관리자 대시보드

- 명함 제작 요청 목록 조회 및 관리
- 전체 의뢰 현황 대시보드 (상태별 카운트, 최근 활동)
- 요청 상세 정보 확인 (원본 카드 정보, 사용자 정보)
- 요청 상태 관리: submitted -> processing -> confirmed / rejected
- 상태 변경 이력 추적 (card_request_status_history 테이블)
- 일러스트 이미지 업로드 (Supabase Storage illustrations 버킷)
- 외부 URL 이미지 지원: 일러스트 이미지로 파일 업로드 외에 외부 URL 직접 입력 가능
- Google Drive URL 자동 변환: Google Drive 공유 URL을 직접 이미지 URL(`lh3.googleusercontent.com`)로 자동 변환하여 일러스트 이미지 표시 (`convertGoogleDriveUrl` 공유 유틸리티)
- 원본 카드와 일러스트 비교 뷰 (이미지 로드 실패 시 에러 핸들링 및 디버그 정보 표시)
- 테마 관리 페이지 (`/admin/themes`): 테마 미리보기 갤러리, 테마별 의뢰 통계, 일괄 테마 적용
- 요청 상세에서 테마 및 메타데이터 편집 가능
- 회원 관리 페이지 (`/admin/members`): 회원별 의뢰 내역 확인
- 명함 의뢰 및 회원 삭제 기능
- CSV/Excel 대량 등록: CSV(.csv) 및 Excel(.xlsx, .xls) 파일을 통한 명함 제작 요청 일괄 등록
  - 12개 컬럼 형식: 사진URL, 앞면이름, 뒷면이름, 관심사, 키워드1-3, 이메일, Facebook, Instagram, LinkedIn, 배경색
  - 소셜 링크 라벨 처리: URL에서 실제 고객 핸들을 추출하여 라벨로 사용 (`extractSocialHandle()` 함수). 플랫폼명 대신 `@username` 형태로 표시
  - 샘플 CSV 파일 다운로드 버튼 제공
  - Excel 파일은 브라우저에서 SheetJS(xlsx) 라이브러리로 CSV 변환 후 처리
  - API 엔드포인트: POST /api/admin/bulk-upload
- 이메일 자동 회원가입: 대량 등록 시 존재하지 않는 이메일은 Supabase Auth에 자동으로 사용자 생성 (기본 비밀번호: 123456)
  - Supabase Auth REST API를 통한 직접 HTTP 요청으로 사용자 생성 (`POST ${supabaseUrl}/auth/v1/admin/users`)
  - Cloudflare Workers 엣지 런타임 호환: SDK admin 메서드 대신 REST API fetch() 호출 사용
  - 응답에 자동 등록된 사용자 수(`autoRegistered`) 포함

### 테마 시스템

- 5개 테마 지원: Classic (기본), Pokemon (트레이딩 카드), Hearthstone (전설 카드), Harry Potter (위저드 카드), Tarot (신비 카드)
- 테마별 고유 디자인 요소
- **Pokemon 테마**: 7개 타입(Fire, Water, Grass, Electric, Psychic, Steel, Normal), 골드 프레임(#EED171), HP 배지, 타입 아이콘
- **Hearthstone 테마**: 9개 직업(Warrior, Mage, Rogue, Priest, Hunter, Paladin, Shaman, Warlock, Druid), 석재/금색 프레임(#8B6914), 마나 크리스탈, 공격/체력 스탯
- **Harry Potter 테마**: 4개 기숙사(Gryffindor, Slytherin, Hufflepuff, Ravenclaw), 양피지/석재 프레임, 기숙사 문장 배지, 지팡이 장식, 주문 파워 스탯
- **Tarot 테마**: 5개 아르카나(Major, Wands, Cups, Swords, Pentacles), 아르누보 보더, 천체 별 패턴, 신비로운 눈 모티프, 미스틱 스탯
- 에디터에서 실시간 테마 전환 및 미리보기
- 테마별 메타데이터 편집 (타입/기숙사/아르카나 선택, 스탯 입력)
- 하위 호환성: theme 필드 없는 기존 카드는 자동 classic 처리

### 명함 앞면/뒷면 실시간 편집 및 미리보기

- 앞면(Front): Display Name, Avatar Image, 텍스트 컬러 편집
- 뒷면(Back): Full Name(`text-[30px]`), Title/Role(`text-[20px]`), Hashtags(`text-[20px]`), Social Links, 텍스트 컬러 편집 - 고정 폰트 사이즈 적용
  - 소셜 링크 표시: 플랫폼 순서(email -> linkedin -> instagram -> facebook)로 정렬, 빈 항목 필터링, `platform/handle` 형식, 우측 정렬
- 탭 전환으로 앞면/뒷면 즉시 전환 (카드 플립 애니메이션 포함)
- 데스크톱에서는 오른쪽에 sticky preview, 모바일에서는 상단에 preview 표시

### 이미지 업로드

- 드래그 앤 드롭(Drag & Drop) 방식 지원
- 클릭하여 파일 선택 방식 지원
- 지원 형식: PNG, JPG, WebP
- 파일 크기 제한: 5MB
- 업로드된 이미지 미리보기 및 삭제 기능
- 위저드에서 업로드한 아바타 이미지는 Supabase Storage(avatars 버킷)에 저장
- 카드 편집기에서 업로드한 이미지는 Base64 인코딩으로 localStorage에 저장

### 배경색 커스터마이징

- 앞면/뒷면 개별 배경색 설정
- react-colorful 기반 시각적 색상 선택기
- Hex 값 직접 입력 지원
- 10가지 한국어 프리셋 색상: 퍼플, 블루, 그린, 엘로우, 오렌지, 레드, 블랙(#131313), 그레이, 엘로우그린, 핑크
- 실시간 색상 미리보기

### 텍스트 컬러 커스터마이징

- 앞면/뒷면 개별 텍스트 색상 설정
- 화이트(#FFFFFF) / 블랙(#000000) 2가지 옵션 선택
- `TextColorPicker` 컴포넌트로 간편한 선택 UI 제공
- 앞면 기본값: 화이트(#FFFFFF), 뒷면 기본값: 블랙(#000000)
- 앞면에서는 배경 대비를 위한 미세한 텍스트 그림자(text-shadow) 적용

### 텍스트 편집

- **Display Name**: 앞면에 표시되는 이름 (최대 40자)
- **Full Name**: 뒷면에 표시되는 전체 이름 (최대 50자)
- **Title / Role**: 직함 또는 역할 (최대 80자)
- **Hashtags**: 태그 형태로 키워드 추가/삭제 (Enter 키 또는 버튼으로 추가)
- **Social Links**: Facebook, Instagram, LinkedIn, Email, Custom 플랫폼별 링크 CRUD (추가/수정/삭제)

### QR 코드 및 vCard 명함 저장

- QR 코드 생성: 명함정보 QR (vCard 3.0) + 명함 URL QR (공개 카드 페이지 링크)
- vCard (.vcf) 파일 다운로드: 연락처 앱에 명함 정보 즉시 저장
- QR 코드 이미지(PNG) 다운로드
- qrcode npm 패키지 기반 클라이언트 사이드 QR 생성
- 관리자 요청 상세 페이지에서 QR 코드 발행 가능

### 공개 명함 페이지

- /cards/[id] 경로로 명함 직접 URL 접근 (QR 스캔용)
- cancelled/rejected 상태를 제외한 모든 카드 표시
- "명함 저장" 버튼으로 vCard(.vcf) 직접 다운로드
- Open Graph / Twitter Card 메타데이터 자동 생성
- AdminCardPreview 컴포넌트 재사용으로 모든 테마 지원

### 공개 명함 갤러리

- /gallery 경로로 전체 명함 목록 조회
- 이벤트별 그룹화 표시
- is_public 플래그로 갤러리 노출 제어

### 이벤트 관리 (관리자)

- /admin/events에서 이벤트 생성, 수정, 삭제
- 이벤트에 카드 할당 및 해제
- 이벤트별 참여 추적
- 이벤트별 명함 PDF 다운로드: 참여자 명함 앞/뒷면을 A4 페이지에 병렬 배치하여 PDF 생성 (jsPDF + html-to-image). 파일명 형식: `{이벤트명}_명함_{YYYY-MM-DD}.pdf`. 생성 중 프로그레스 오버레이 표시. API: `GET /api/admin/events/[id]/cards`
- DB 마이그레이션 미적용 감지 및 안내 UI

### PNG 이미지 고화질 내보내기

- html-to-image 라이브러리를 사용한 DOM-to-PNG 변환
- 2x 해상도(pixelRatio: 2)로 고화질 출력
- 앞면과 뒷면을 각각 별도 파일로 다운로드 (namecard-front.png, namecard-back.png)
- 내보내기 진행 중 로딩 상태 표시

### localStorage 기반 자동 저장 (카드 편집기)

- Zustand persist middleware를 활용한 자동 저장
- 브라우저를 닫아도 편집 내용 유지
- storage key: `namecard-storage`
- 초기화(Reset) 버튼으로 기본값 복원 (확인 단계 포함)

## 서비스 워크플로우

### 사용자 흐름

1. 사용자가 랜딩 페이지(/)에서 서비스 소개 확인
2. 이메일/비밀번호 또는 Google OAuth로 회원가입/로그인
3. ~~명함 제작 위저드(/create)에서 6단계에 걸쳐 명함 정보 입력~~ (현재 임시 비활성화, /dashboard로 리다이렉트)
4. 제작 요청 제출 시 API POST /api/requests로 Supabase DB에 저장
5. 아바타 이미지는 Supabase Storage(avatars 버킷)에 업로드
6. ~~요청 완료 후 카드 편집기(/create/edit)에서 추가 편집 가능~~ (현재 임시 비활성화, /dashboard로 리다이렉트)
7. UserMenu의 "설정" 클릭으로 비밀번호 변경 등 사용자 설정 페이지(/dashboard/settings) 접근
8. UserMenu의 "내 요청" 클릭으로 대시보드(/dashboard)에서 제작 진행 상태 확인
9. 대시보드에서 요청 클릭 시 상세 페이지(/dashboard/[id])에서 상태 이력, 카드 비교 확인
10. 요청 상세에서 확정(confirm) 버튼 클릭 또는 편집 후 "저장 후 확정"으로 사용자가 직접 카드 요청 확정

### 관리자 흐름

1. ADMIN_EMAILS에 등록된 계정으로 로그인
2. 관리자 대시보드(/admin)에서 전체 요청 목록 확인
3. CSV/Excel 파일로 명함 제작 요청 대량 등록 (BulkUploadModal을 통한 일괄 업로드)
4. 요청 상세 페이지(/admin/[id])에서 요청 내용 검토
5. 상태 변경: submitted -> processing -> confirmed/rejected
6. 일러스트 이미지를 Supabase Storage(illustrations 버킷)에 업로드하거나 외부 URL로 지정
7. 원본 카드와 일러스트 비교 확인

### 요청 상태 흐름

```
submitted (의뢰됨) -> processing (작업중) -> confirmed (확정)
                                          -> revision_requested (수정 요청)
                                          -> rejected (반려)
                                          -> delivered (배송 완료)
submitted (의뢰됨) -> confirmed (확정)      # 사용자가 대시보드에서 직접 확정 가능
```

> **구현 완료 (SPEC-WF-001)**: 확장 상태 워크플로우가 구현되었습니다. 기존 3단계(submitted, processing, confirmed) 외에 `revision_requested` (수정 요청), `rejected` (반려), `delivered` (배송 완료) 상태가 추가되었습니다. 관리자-사용자 간 수정 피드백 및 진행 상태 추적이 강화되었습니다.

## 사용 사례

### 개인 사용자가 명함 제작 요청

사용자가 회원가입 후 위저드를 통해 이름, 직함, 사진, 소셜 링크 등을 입력하고 명함 제작을 요청합니다. 관리자가 요청을 검토하고 일러스트를 제작하여 완성된 명함을 제공합니다.

### 프리랜서가 카드 편집기로 직접 디자인

프리랜서가 카드 편집기(/create/edit)에서 자신의 브랜드 색상에 맞는 명함을 직접 디자인합니다. Avatar Image를 업로드하고, 브랜드 색상을 배경에 적용하며, 해시태그와 소셜 링크를 추가하여 개성 있는 명함을 제작한 후 PNG로 내보냅니다.

### 관리자가 명함 요청을 일괄 관리

관리자가 대시보드에서 접수된 명함 제작 요청 목록을 확인하고, 각 요청의 상태를 관리합니다. 일러스트 제작이 완료되면 이미지를 업로드하고 원본과 비교 확인한 후 완료 처리합니다.

## 라우트 보호

| 라우트 | 접근 수준 | 설명 |
|--------|-----------|------|
| `/` | 공개 | 랜딩 페이지 |
| `/login` | 공개 | 로그인 (이메일/비밀번호 + Google OAuth) |
| `/signup` | 공개 | 회원가입 |
| `/confirm` | 공개 | 이메일 인증 확인 |
| `/callback` | 공개 | OAuth 콜백 핸들러 |
| `/create` | 인증 필요 | 명함 제작 위저드 (임시 비활성화 - /dashboard로 리다이렉트) |
| `/create/edit` | 인증 필요 | 카드 편집기 (임시 비활성화 - /dashboard로 리다이렉트) |
| `/dashboard` | 인증 필요 | 사용자 대시보드 (내 요청 목록) |
| `/dashboard/[id]` | 인증 필요 | 사용자 요청 상세 (소유권 검증) |
| `/dashboard/settings` | 인증 필요 | 사용자 설정 (비밀번호 변경) |
| `/admin` | 관리자 전용 | 관리자 대시보드 |
| `/admin/[id]` | 관리자 전용 | 요청 상세 페이지 |
| `/admin/themes` | 관리자 전용 | 테마 관리 (미리보기, 통계, 일괄 적용) |
| `/admin/events` | 관리자 전용 | 이벤트 관리 |
| `/admin/members` | 관리자 전용 | 회원 관리 |
| `/cards/[id]` | 공개 | 공개 명함 페이지 (QR 스캔용) |
| `/gallery` | 공개 | 공개 명함 갤러리 |

## 접근성(Accessibility) 지원

- ARIA 속성 적용 (role, aria-label, aria-selected, aria-controls)
- 키보드 네비게이션 지원 (Tab, Enter, Space)
- focus-visible 스타일 전역 적용
- 터치 디바이스 최소 터치 영역 44px 보장
- 반응형 레이아웃 (모바일, 태블릿, 데스크톱)

## 보안 현황 (Security Status)

> 2026-02-22 서비스 분석 리포트 기준

**전체 위험 수준: HIGH**

### 보안 이슈 요약

| 심각도 | 건수 |
|--------|------|
| CRITICAL | 2 |
| HIGH | 4 |
| MEDIUM | 5 |
| LOW | 4 |
| **합계** | **15** |

### 주요 Critical 이슈

- **C-01. Supabase RLS 정책 사실상 비활성화** (OWASP A01, CWE-862): RLS가 활성화되어 있으나 `USING (true)` 정책으로 인해 anon 키를 가진 누구든 모든 card_requests 데이터에 접근/수정 가능. 24시간 이내 수정 필요.
- **C-02. Storage 버킷 업로드 정책 미제한** (OWASP A01, CWE-284): INSERT/UPDATE 정책이 인증 여부를 확인하지 않아, 공개 anon 키로 임의 파일 업로드 및 기존 파일 덮어쓰기 가능. 24시간 이내 수정 필요.

### 긍정적 보안 구현 사항

- 모든 API 라우트에 `requireAuth()`/`requireAdmin()` 서버 측 인증 적용
- 미들웨어 및 API 라우트에서 `getUser()`를 통한 토큰 재검증
- 요청 상세 엔드포인트에서 소유권 검증 구현
- 유효한 상태 전환 규칙 적용
- React 자동 이스케이프 적용 (`dangerouslySetInnerHTML` 미사용)
- 10MB 이미지 크기 제한 및 일반적 에러 메시지 사용
- 이중 관리자 검증 (미들웨어 + API 라우트)

## 개선 로드맵 (Improvement Roadmap)

> 2026-02-22 서비스 분석 리포트 기반. 보안 15건, UX 6건, 성능 5건, 아키텍처 5건, 비즈니스 기능 4건, 인프라 3건 총 38건 개선 사항 도출.

### Phase 1: 보안 강화 (긴급 - 1-2주)

- [ ] RLS 정책 수정 - `USING (true)` 제거, `service_role` 전용으로 변경 (Critical)
- [ ] Storage 버킷 정책 수정 - 업로드/수정 시 인증 검증 추가 (Critical)
- [ ] API Rate Limiting 추가 - Cloudflare Rate Limiting 또는 `@upstash/ratelimit` 도입 (High)
- [ ] 서버 측 이미지 콘텐츠 검증 - magic bytes 검증으로 악성 파일 차단 (High)
- [ ] 비밀번호 정책 강화 - 최소 8자 이상 (NIST 권장 12자) (High)
- [ ] 보안 헤더 추가 - CSP, X-Frame-Options, HSTS 등 (Medium)
- [ ] Open Redirect 취약점 수정 - callbackUrl 검증 로직 추가 (Medium)

### Phase 2: 핵심 UX 개선 (단기 - 2-4주)

- [ ] Base64 -> Direct Upload 전환 - presigned URL 기반 직접 업로드로 33% 페이로드 절감
- [ ] 상태 변경 알림 시스템 - Supabase Edge Functions + 이메일 알림
- [ ] 요청 편집/취소 기능 - submitted 상태에서 수정 및 취소 허용
- [x] 확장 상태 워크플로우 - `revision_requested`, `rejected`, `delivered` 상태 추가 (SPEC-WF-001 구현 완료)
- [ ] Zod 스키마 검증 - 모든 API 입력에 대한 일관된 런타임 검증
- [ ] Error Boundary 컴포넌트 - 레이아웃 레벨 에러 경계 처리

### Phase 3: 아키텍처 강화 (중기 - 1-2개월)

- [ ] 데이터베이스 기반 RBAC - `user_roles` 테이블로 역할 관리 전환
- [ ] 이미지 최적화 파이프라인 - `sharp` 기반 리사이즈 + WebP 변환
- [ ] 관리자 목록 페이지네이션 - 커서 기반 페이지네이션 + 상태/날짜 필터
- [ ] Sentry 에러 모니터링 - `@sentry/nextjs` 통합
- [ ] 미들웨어 인증 통합 - API 라우트 인가를 미들웨어로 중앙 집중화
- [ ] 한국어 폰트 로딩 최적화 - `next/font` 기반 프리로딩 + 서브셋

### Phase 4: 기능 확장 (장기 - 2-3개월)

- [x] 카드 공유 + QR 코드 - 공개 카드 페이지 및 QR 코드 생성 (구현 완료)
- [x] 포트폴리오 갤러리 - 이벤트별 그룹 갤러리 (구현 완료)
- [ ] 사용자-관리자 메시징 - 요청별 코멘트/메시지 스레드
- [ ] 관리자 분석 대시보드 - 요청 수/평균 처리 시간/전환율 통계
- [ ] 클라우드 초안 자동 저장 - Supabase에 드래프트 자동 저장 (교차 기기 지원)
- [ ] 카드 버전 이력 - 디자인 변경 이력 관리 및 롤백
