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
- 외부 URL 이미지 지원: 일러스트 이미지로 파일 업로드 외에 외부 URL 직접 입력 가능
- 원본 카드와 일러스트 비교 뷰 (이미지 로드 실패 시 에러 핸들링 및 디버그 정보 표시)
- CSV/Excel 대량 등록: CSV(.csv) 및 Excel(.xlsx, .xls) 파일을 통한 명함 제작 요청 일괄 등록
  - 12개 컬럼 형식: 사진URL, 앞면이름, 뒷면이름, 관심사, 키워드1-3, 이메일, Facebook, Instagram, LinkedIn, 배경색
  - 샘플 CSV 파일 다운로드 버튼 제공
  - Excel 파일은 브라우저에서 SheetJS(xlsx) 라이브러리로 CSV 변환 후 처리
  - API 엔드포인트: POST /api/admin/bulk-upload
- 이메일 자동 회원가입: 대량 등록 시 존재하지 않는 이메일은 Supabase Auth에 자동으로 사용자 생성 (기본 비밀번호: 123456)
  - `supabase.auth.admin.createUser()`로 이메일 확인 완료 상태로 생성
  - Cloudflare Workers 런타임에서 Supabase Admin API 미사용 시 graceful degradation 처리
  - 응답에 자동 등록된 사용자 수(`autoRegistered`) 포함

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

- [ ] 카드 공유 + QR 코드 - 공개 카드 페이지 및 QR 코드 생성
- [ ] 사용자-관리자 메시징 - 요청별 코멘트/메시지 스레드
- [ ] 관리자 분석 대시보드 - 요청 수/평균 처리 시간/전환율 통계
- [ ] 포트폴리오 갤러리 - 완성된 일러스트 작품 갤러리 (랜딩 페이지)
- [ ] 클라우드 초안 자동 저장 - Supabase에 드래프트 자동 저장 (교차 기기 지원)
- [ ] 카드 버전 이력 - 디자인 변경 이력 관리 및 롤백
