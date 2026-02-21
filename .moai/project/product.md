# Namecard Service (명함 제작 서비스)

## 프로젝트 설명

명함 디자인부터 제작 요청, 관리자 검수, 일러스트 제작까지 전체 워크플로우를 지원하는 풀스택 웹 애플리케이션입니다. 사용자는 Supabase Auth를 통해 이메일/비밀번호 또는 Google OAuth로 로그인한 후, 6단계 위저드를 통해 명함 정보를 입력하고 제작을 요청합니다. 관리자는 요청을 검토하고 일러스트를 업로드하여 최종 명함을 완성합니다. 별도로 카드 편집기를 통해 명함의 앞면과 뒷면을 실시간으로 편집하고, 고화질 PNG 이미지로 내보낼 수 있습니다.

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

### 명함 제작 위저드 (6단계)

- **Step 1 - 개인 정보**: 이름, 직함, 회사명 입력
- **Step 2 - 사진 업로드**: 아바타 이미지 업로드 (드래그 앤 드롭, 5MB 제한)
- **Step 3 - 소셜/태그**: 소셜 링크 추가, 해시태그 입력
- **Step 4 - 미리보기**: 입력 정보 기반 명함 미리보기
- **Step 5 - 제작 요청**: 명함 제작 요청 제출 (Supabase DB에 저장)
- **Step 6 - 완료**: 요청 완료 안내

### 사용자 대시보드

- 로그인한 사용자의 명함 제작 요청 목록 조회 (`GET /api/requests/my`)
- 3단계 프로그레스 인디케이터로 진행 상태 시각화 (의뢰됨 -> 작업중 -> 확정)
- 반응형 레이아웃: 모바일은 카드형, 데스크톱은 테이블형 리스트
- 요청 상세 보기 (`/dashboard/[id]`): 상태 이력, 카드 비교, 명함 정보 읽기 전용 표시
- 요청이 없는 경우 EmptyState에서 "명함 만들기" CTA 제공
- 소유권 검증: 다른 사용자의 요청에 접근 시 403 반환

### 관리자 대시보드

- 명함 제작 요청 목록 조회 및 관리
- 요청 상세 정보 확인 (원본 카드 정보, 사용자 정보)
- 요청 상태 관리: submitted -> processing -> confirmed / rejected
- 상태 변경 이력 추적 (card_request_status_history 테이블)
- 일러스트 이미지 업로드 (Supabase Storage illustrations 버킷)
- 원본 카드와 일러스트 비교 뷰

### 명함 앞면/뒷면 실시간 편집 및 미리보기

- 앞면(Front): Display Name, Avatar Image 편집
- 뒷면(Back): Full Name, Title/Role, Hashtags, Social Links 편집
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
- 실시간 색상 미리보기

### 텍스트 편집

- **Display Name**: 앞면에 표시되는 이름 (최대 40자)
- **Full Name**: 뒷면에 표시되는 전체 이름 (최대 50자)
- **Title / Role**: 직함 또는 역할 (최대 80자)
- **Hashtags**: 태그 형태로 키워드 추가/삭제 (Enter 키 또는 버튼으로 추가)
- **Social Links**: Facebook, Instagram, LinkedIn, Email, Custom 플랫폼별 링크 CRUD (추가/수정/삭제)

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
3. 명함 제작 위저드(/create)에서 6단계에 걸쳐 명함 정보 입력
4. 제작 요청 제출 시 API POST /api/requests로 Supabase DB에 저장
5. 아바타 이미지는 Supabase Storage(avatars 버킷)에 업로드
6. 요청 완료 후 카드 편집기(/create/edit)에서 추가 편집 가능
7. UserMenu의 "내 요청" 클릭으로 대시보드(/dashboard)에서 제작 진행 상태 확인
8. 대시보드에서 요청 클릭 시 상세 페이지(/dashboard/[id])에서 상태 이력, 카드 비교 확인

### 관리자 흐름

1. ADMIN_EMAILS에 등록된 계정으로 로그인
2. 관리자 대시보드(/admin)에서 전체 요청 목록 확인
3. 요청 상세 페이지(/admin/[id])에서 요청 내용 검토
4. 상태 변경: submitted -> processing -> confirmed/rejected
5. 일러스트 이미지를 Supabase Storage(illustrations 버킷)에 업로드
6. 원본 카드와 일러스트 비교 확인

### 요청 상태 흐름

```
submitted (의뢰됨) -> processing (작업중) -> confirmed (확정)
```

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
| `/create` | 인증 필요 | 명함 제작 위저드 |
| `/create/edit` | 인증 필요 | 카드 편집기 |
| `/dashboard` | 인증 필요 | 사용자 대시보드 (내 요청 목록) |
| `/dashboard/[id]` | 인증 필요 | 사용자 요청 상세 (소유권 검증) |
| `/admin` | 관리자 전용 | 관리자 대시보드 |
| `/admin/[id]` | 관리자 전용 | 요청 상세 페이지 |

## 접근성(Accessibility) 지원

- ARIA 속성 적용 (role, aria-label, aria-selected, aria-controls)
- 키보드 네비게이션 지원 (Tab, Enter, Space)
- focus-visible 스타일 전역 적용
- 터치 디바이스 최소 터치 영역 44px 보장
- 반응형 레이아웃 (모바일, 태블릿, 데스크톱)
